export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// ?type=site ne renvoie que les mises à jour du site (bouton « Nouveautés »).
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type");
  const entries = await prisma.changelogEntry.findMany({
    where: type === "site" ? { type: "site" } : undefined,
    orderBy: { createdAt: "desc" },
    take: type === "site" ? 30 : 100,
  });
  return NextResponse.json(entries);
}
