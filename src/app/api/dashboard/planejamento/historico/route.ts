import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { HistoricoAdRow, HistoricoCampanhasData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, anonKey);

    const [historicoRes, funnelRes] = await Promise.all([
      supabase.rpc("get_historico_campanhas"),
      supabase.rpc("get_ad_funnel_counts", { start_date: "2020-01-01" }),
    ]);

    if (historicoRes.error) throw new Error(`RPC error: ${historicoRes.error.message}`);

    const adFunnel = new Map<string, { mql: number; sql: number; opp: number; won: number }>();
    for (const row of funnelRes.data || []) {
      adFunnel.set(row.ad_id, {
        mql: Number(row.mql) || 0,
        sql: Number(row.sql_count) || 0,
        opp: Number(row.opp) || 0,
        won: Number(row.won) || 0,
      });
    }

    const ads: HistoricoAdRow[] = [];
    for (const row of historicoRes.data || []) {
      const spend = Number(row.spend) || 0;
      const leads = Number(row.leads) || 0;
      const impressions = Number(row.impressions) || 0;
      const clicks = Number(row.clicks) || 0;
      const funnel = adFunnel.get(row.ad_id);
      const mql = funnel?.mql ?? 0;
      const sql = funnel?.sql ?? 0;
      const opp = funnel?.opp ?? 0;
      const won = funnel?.won ?? 0;

      ads.push({
        adId: row.ad_id,
        adName: row.ad_name || "",
        adsetName: row.adset_name || "",
        campaignName: row.campaign_name || "",
        empreendimento: row.empreendimento || "",
        effectiveStatus: row.effective_status || "PAUSED",
        spend,
        leads,
        mql,
        sql,
        opp,
        won,
        impressions,
        clicks,
        cpl: leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0,
        cmql: mql > 0 ? Math.round((spend / mql) * 100) / 100 : 0,
        csql: sql > 0 ? Math.round((spend / sql) * 100) / 100 : 0,
        copp: opp > 0 ? Math.round((spend / opp) * 100) / 100 : 0,
        cpw: won > 0 ? Math.round((spend / won) * 100) / 100 : 0,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
        cpm: impressions > 0 ? Math.round((spend / impressions) * 100000) / 100 : 0,
        lastSeenDate: row.last_seen_date || "",
      });
    }

    const result: HistoricoCampanhasData = { ads };
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Historico campanhas error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
