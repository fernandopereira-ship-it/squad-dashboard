import { NextRequest, NextResponse } from "next/server";
import { fetchAcompanhamento } from "@/lib/pipedrive";
import type { TabKey } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Simplified: only fetches acompanhamento for the given tab
// Metas and alinhamento are separate endpoints
export async function GET(req: NextRequest) {
  const tab = (req.nextUrl.searchParams.get("tab") as TabKey) || "mql";

  try {
    const data = await fetchAcompanhamento(tab);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
