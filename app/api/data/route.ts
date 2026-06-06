import { getWikiData } from "@/lib/wiki-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getWikiData();

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
