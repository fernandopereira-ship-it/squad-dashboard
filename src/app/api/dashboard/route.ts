import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SQUADS, NUM_DAYS } from "@/lib/constants";
import { generateDates } from "@/lib/dates";
import type { TabKey, AcompanhamentoData, SquadData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tab = (req.nextUrl.searchParams.get("tab") as TabKey) || "mql";

  try {
    const dates = generateDates();
    const startDate = dates[dates.length - 1].date;
    const endDate = dates[0].date;

    // Fetch daily counts from Supabase
    const { data: rows, error } = await supabase
      .from("squad_daily_counts")
      .select("date, empreendimento, count")
      .eq("tab", tab)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    // Build date index
    const dateIndex = new Map(dates.map((d, i) => [d.date, i]));

    // Build counts per empreendimento
    const empCounts = new Map<string, number[]>();
    for (const row of rows || []) {
      const idx = dateIndex.get(row.date);
      if (idx === undefined) continue;
      if (!empCounts.has(row.empreendimento)) {
        empCounts.set(row.empreendimento, new Array(NUM_DAYS).fill(0));
      }
      empCounts.get(row.empreendimento)![idx] += row.count;
    }

    // Calculate current month boundaries for "Total mês"
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Map to squads
    const squads: SquadData[] = SQUADS.map((sq) => {
      const sqRows = sq.empreendimentos.map((emp) => {
        const daily = empCounts.get(emp) || new Array(NUM_DAYS).fill(0);
        // totalMes = sum of days in current month only
        let totalMes = 0;
        daily.forEach((v, i) => {
          if (dates[i] && dates[i].date >= monthStart) totalMes += v;
        });
        return { emp, daily, totalMes };
      });
      return {
        id: sq.id,
        name: sq.name,
        marketing: sq.marketing,
        preVenda: sq.preVenda,
        venda: sq.venda,
        rows: sqRows,
        metaToDate: 0,
      };
    });

    // Fetch metas for current month
    const monthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: metaRows } = await supabase
      .from("squad_metas")
      .select("squad_id, meta")
      .eq("month", monthDate)
      .eq("tab", tab);

    if (metaRows) {
      for (const m of metaRows) {
        const sq = squads.find((s) => s.id === m.squad_id);
        if (sq) sq.metaToDate = m.meta;
      }
    }

    // Grand totals
    const grandDaily = new Array(NUM_DAYS).fill(0);
    let grandTotal = 0;
    let grandMeta = 0;
    squads.forEach((sq) => {
      grandMeta += sq.metaToDate;
      sq.rows.forEach((r) => {
        grandTotal += r.totalMes;
        r.daily.forEach((v, i) => (grandDaily[i] += v));
      });
    });

    const result: AcompanhamentoData = {
      squads,
      dates,
      grand: { totalMes: grandTotal, metaToDate: grandMeta, daily: grandDaily },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
