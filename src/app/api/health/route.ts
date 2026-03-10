import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const checks: Record<string, unknown> = { today, status: "ok" };
  const issues: string[] = [];

  try {
    // 1. squad_daily_counts — last date with data
    const { data: dailyLatest, error: e1 } = await supabase
      .from("squad_daily_counts")
      .select("date")
      .order("date", { ascending: false })
      .limit(1);

    if (e1) {
      issues.push(`squad_daily_counts error: ${e1.message}`);
    } else {
      const lastDate = dailyLatest?.[0]?.date ?? "N/A";
      checks.dailyCounts = { lastDate, isCurrent: lastDate === today };
      if (lastDate !== today) issues.push(`squad_daily_counts last date is ${lastDate}, expected ${today}`);
    }

    // 2. squad_daily_counts — row count for today
    const { count: todayCount, error: e1b } = await supabase
      .from("squad_daily_counts")
      .select("*", { count: "exact", head: true })
      .eq("date", today);

    if (!e1b) {
      checks.dailyCountsToday = todayCount ?? 0;
    }

    // 3. squad_alignment — total rows
    const { count: alignCount, error: e2 } = await supabase
      .from("squad_alignment")
      .select("*", { count: "exact", head: true });

    if (e2) {
      issues.push(`squad_alignment error: ${e2.message}`);
    } else {
      checks.alignment = { rows: alignCount ?? 0 };
      if ((alignCount ?? 0) === 0) issues.push("squad_alignment has 0 rows");
    }

    // 4. squad_metas — current month
    const now = new Date();
    const monthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: metaRows, error: e3 } = await supabase
      .from("squad_metas")
      .select("squad_id, tab, meta")
      .eq("month", monthDate);

    if (e3) {
      issues.push(`squad_metas error: ${e3.message}`);
    } else {
      checks.metas = { month: monthDate, rows: metaRows?.length ?? 0 };
      if ((metaRows?.length ?? 0) === 0) issues.push(`squad_metas has 0 rows for ${monthDate}`);
    }

    // 5. squad_meta_ads — latest snapshot
    const { data: adsLatest, error: e4 } = await supabase
      .from("squad_meta_ads")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(1);

    if (e4) {
      issues.push(`squad_meta_ads error: ${e4.message}`);
    } else {
      const lastSnapshot = adsLatest?.[0]?.snapshot_date ?? "N/A";
      checks.metaAds = { lastSnapshot, isCurrent: lastSnapshot === today };
      if (lastSnapshot !== today) issues.push(`squad_meta_ads last snapshot is ${lastSnapshot}, expected ${today}`);
    }

    // 6. squad_ratios — check exists
    const { count: ratioCount, error: e5 } = await supabase
      .from("squad_ratios")
      .select("*", { count: "exact", head: true });

    if (e5) {
      issues.push(`squad_ratios error: ${e5.message}`);
    } else {
      checks.ratios = { rows: ratioCount ?? 0 };
    }

    if (issues.length > 0) {
      checks.status = "warning";
      checks.issues = issues;
    }

    return NextResponse.json(checks);
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Unknown error", today },
      { status: 500 }
    );
  }
}
