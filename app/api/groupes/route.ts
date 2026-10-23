export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const groupes = await prisma.groupe.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(
    groupes.map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })),
  );
}

// Les écritures se font dans l'admin (server actions de lib/admin/actions).
