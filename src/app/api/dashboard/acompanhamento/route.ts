import { NextRequest, NextResponse } from "next/server";
import { fetchAcompanhamento } from "@/lib/pipedrive";
import type { TabKey } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const tab = (req.nextUrl.searchParams.get("tab") as TabKey) || "mql";

  try {
    const data = await fetchAcompanhamento(tab);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Acompanhamento error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
