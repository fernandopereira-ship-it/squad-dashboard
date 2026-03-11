// Edge Function: sync-squad-presales
// Populates squad_presales_response from Pipedrive API (deals + activities)
// Triggered via POST /functions/v1/sync-squad-presales

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PIPELINE_ID = 28;
const DAYS_LOOKBACK = 30;
const PIPEDRIVE_BASE = "https://api.pipedrive.com/v1";

interface PreSeller {
  user_id: number;
  user_name: string;
}

interface PipedriveDeal {
  id: number;
  title: string;
  owner_id: number;
  owner_name: string;
  add_time: string;
  stage_change_time: string;
  stage_id: number;
  status: string;
  pipeline_id: number;
}

interface PipedriveActivity {
  id: number;
  deal_id: number;
  type: string;
  subject: string;
  add_time: string;
  done: boolean;
  user_id: number;
}

// --- Pipedrive API helpers ---

async function pipedriveGet<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(`${PIPEDRIVE_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("api_token", token);

  const items: T[] = [];
  let start = 0;
  const limit = 500;

  while (true) {
    url.searchParams.set("start", String(start));
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pipedrive ${path} error ${res.status}: ${text}`);
    }

    const json = await res.json();
    if (!json.data || json.data.length === 0) break;

    items.push(...json.data);

    if (!json.additional_data?.pagination?.more_items_in_collection) break;
    start = json.additional_data.pagination.next_start;
  }

  return items;
}

async function fetchDealsForUser(userId: number, token: string, sinceDate: string): Promise<PipedriveDeal[]> {
  const deals = await pipedriveGet<PipedriveDeal>("/deals", token, {
    user_id: String(userId),
    status: "open",
    sort: "add_time DESC",
  });

  return deals.filter((d) =>
    d.pipeline_id === PIPELINE_ID &&
    d.add_time >= sinceDate
  );
}

async function fetchActivitiesForUser(userId: number, token: string, sinceDate: string): Promise<PipedriveActivity[]> {
  return pipedriveGet<PipedriveActivity>("/activities", token, {
    user_id: String(userId),
    done: "1",
    start_date: sinceDate.slice(0, 10), // YYYY-MM-DD
    type: "call",
  });
}

// --- Main handler ---

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Read Pipedrive token from Vault
    const { data: secretData, error: secretErr } = await supabase.rpc("vault_read_secret", {
      secret_name: "PIPEDRIVE_API_TOKEN",
    });
    if (secretErr || !secretData) throw new Error(`Vault error: ${secretErr?.message || "no secret"}`);
    const pipedriveToken = secretData;

    // 2. Read pre-sellers from config
    const { data: pvRows, error: pvErr } = await supabase
      .from("config_pre_vendedores")
      .select("user_id, user_name")
      .eq("pipeline_id", PIPELINE_ID);
    if (pvErr) throw new Error(`Config error: ${pvErr.message}`);

    const preSellers: PreSeller[] = pvRows || [];
    if (preSellers.length === 0) {
      return new Response(JSON.stringify({ message: "No pre-sellers configured" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const sinceDate = new Date(Date.now() - DAYS_LOOKBACK * 86400000).toISOString();
    const today = new Date().toISOString().slice(0, 10);

    // 3. Fetch deals and activities for each pre-seller
    const allRows: Array<{
      deal_id: number;
      deal_title: string;
      preseller_name: string;
      transbordo_at: string;
      first_action_at: string | null;
      response_time_minutes: number | null;
      action_type: string | null;
      snapshot_date: string;
    }> = [];

    // Collect all deal IDs first, then batch-fetch transbordo dates
    const allDeals: Array<{ deal: PipedriveDeal; pvName: string; firstCall: PipedriveActivity | undefined }> = [];

    for (const pv of preSellers) {
      const [deals, activities] = await Promise.all([
        fetchDealsForUser(pv.user_id, pipedriveToken, sinceDate),
        fetchActivitiesForUser(pv.user_id, pipedriveToken, sinceDate),
      ]);

      // Index activities by deal_id: first call (earliest add_time)
      const firstCallByDeal = new Map<number, PipedriveActivity>();
      // Sort activities by add_time ascending to find first
      const sorted = [...activities].sort((a, b) => a.add_time.localeCompare(b.add_time));
      for (const act of sorted) {
        if (act.deal_id && !firstCallByDeal.has(act.deal_id)) {
          firstCallByDeal.set(act.deal_id, act);
        }
      }

      for (const deal of deals) {
        allDeals.push({ deal, pvName: pv.user_name, firstCall: firstCallByDeal.get(deal.id) });
      }
    }

    // Batch-fetch transbordo MIA dates from nekt_transbordo_mia
    const dealIds = allDeals.map((d) => d.deal.id);
    const transbordoMap = new Map<number, string>();

    if (dealIds.length > 0) {
      // 1st source: nekt_transbordo_mia (webhook timestamp = real transbordo)
      for (let i = 0; i < dealIds.length; i += 500) {
        const batch = dealIds.slice(i, i + 500);
        const { data: miaRows } = await supabase
          .from("nekt_transbordo_mia")
          .select("deal_id, webhook_received_at_br")
          .in("deal_id", batch);
        for (const row of miaRows || []) {
          const did = Number(row.deal_id);
          const existing = transbordoMap.get(did);
          // Keep the most recent transbordo (last MIA transfer)
          if (!existing || row.webhook_received_at_br > existing) {
            transbordoMap.set(did, row.webhook_received_at_br);
          }
        }
      }

      // 2nd source (fallback): last MIA activity from nekt_pipedrive_activities
      // The last MIA activity = moment the lead was actually transferred to the preseller
      const missingIds = dealIds.filter((id) => !transbordoMap.has(id));
      if (missingIds.length > 0) {
        for (let i = 0; i < missingIds.length; i += 500) {
          const batch = missingIds.slice(i, i + 500);
          const { data: actRows } = await supabase
            .from("nekt_pipedrive_activities")
            .select("deal_id, add_time, subject")
            .in("deal_id", batch)
            .order("add_time", { ascending: false });
          for (const row of actRows || []) {
            const did = Number(row.deal_id);
            if (!transbordoMap.has(did) && /mia/i.test(row.subject || "")) {
              transbordoMap.set(did, row.add_time);
            }
          }
        }
      }
    }

    for (const { deal, pvName, firstCall } of allDeals) {
      // Transbordo priority: nekt_transbordo_mia > first MIA activity > deal.add_time
      const transbordo = transbordoMap.get(deal.id) || deal.add_time;
      const firstAction = firstCall?.add_time || null;

      // Calculate response_time_minutes (calendar minutes for now, business minutes calculated in API route)
      let responseMin: number | null = null;
      if (firstAction) {
        responseMin = Math.round(
          (new Date(firstAction).getTime() - new Date(transbordo).getTime()) / 60000
        );
      }

      allRows.push({
        deal_id: deal.id,
        deal_title: deal.title || "",
        preseller_name: pvName,
        transbordo_at: transbordo,
        first_action_at: firstAction,
        response_time_minutes: responseMin,
        action_type: firstCall?.type || null,
        snapshot_date: today,
      });
    }

    // 4. Upsert into squad_presales_response

    if (allRows.length > 0) {
      // Delete all existing rows and insert fresh data
      const { error: delErr } = await supabase
        .from("squad_presales_response")
        .delete()
        .gte("id", 0); // delete all

      if (delErr) throw new Error(`Delete error: ${delErr.message}`);

      // Insert in batches of 500
      for (let i = 0; i < allRows.length; i += 500) {
        const batch = allRows.slice(i, i + 500);
        const { error: insErr } = await supabase
          .from("squad_presales_response")
          .insert(batch);

        if (insErr) throw new Error(`Insert error (batch ${i}): ${insErr.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "OK",
        preSellers: preSellers.length,
        deals: allRows.length,
        withAction: allRows.filter((r) => r.first_action_at).length,
        pending: allRows.filter((r) => !r.first_action_at).length,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-squad-presales error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
