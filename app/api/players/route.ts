export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { pseudo, stream, lienChaine, reseaux, badges } = await request.json();

  if (!pseudo)
    return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });

  try {
    const player = await prisma.player.create({
      data: {
        pseudo,
        stream: stream ?? false,
        lienChaine: lienChaine ?? null,
        reseaux: reseaux ?? {},
        badges: badges ?? [],
      },
    });
    return NextResponse.json(player, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { id, pseudo, stream, lienChaine, reseaux, badges } =
    await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const player = await prisma.player.update({
      where: { id },
      data: {
        ...(pseudo && { pseudo }),
        stream: stream ?? false,
        lienChaine: lienChaine ?? null,
        ...(reseaux !== undefined && { reseaux }),
        ...(badges !== undefined && { badges }),
      },
    });
    return NextResponse.json(player);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
