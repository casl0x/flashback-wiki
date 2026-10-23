import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { pseudo: "asc" },
    select: { id: true, pseudo: true },
  });
  return NextResponse.json(players);
}

// Les écritures se font dans l'admin (server actions de lib/admin/actions).
