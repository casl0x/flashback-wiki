import { isAdminToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (isAdminToken(token)) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}
