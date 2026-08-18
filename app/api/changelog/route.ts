export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const entries = await prisma.changelogEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const { label, detail } = await req.json();
  if (!label) return NextResponse.json({ error: "Label requis" }, { status: 400 });

  const entry = await prisma.changelogEntry.create({
    data: { type: "site", label, detail: detail ?? null },
  });
  return NextResponse.json(entry, { status: 201 });
}