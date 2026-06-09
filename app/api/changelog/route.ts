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
