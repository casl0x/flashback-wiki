export const dynamic = "force-dynamic";

import { invalidateWikiCache } from "@/lib/actions";
import { logChange } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const {
    nom,
    role,
    description,
    player_id,
    version_id,
    metier,
    groupe,
    lien_reddif,
    image_url,
    etat_vie,
  } = await request.json();

  if (!nom)
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

  try {
    const char = await prisma.character.create({
      data: {
        nom,
        role: role ?? null,
        description: description ?? null,
        playerId: player_id ?? null,
        versionId: version_id ?? null,
        metier: metier ?? null,
        groupe: groupe ?? null,
        lienReddif: lien_reddif ?? null,
        imageUrl: image_url ?? null,
        etatVie: etat_vie ?? null,
      },
    });
    await logChange("add_global", char.nom, metier ?? undefined);
    await invalidateWikiCache();
    return NextResponse.json(char, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const {
    id,
    nom,
    role,
    description,
    player_id,
    version_id,
    metier,
    groupe,
    lien_reddif,
    image_url,
    etat_vie,
  } = await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const char = await prisma.character.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        role: role ?? null,
        description: description ?? null,
        ...(player_id !== undefined && { playerId: player_id ?? null }),
        ...(version_id !== undefined && { versionId: version_id ?? null }),
        metier: metier ?? null,
        groupe: groupe ?? null,
        lienReddif: lien_reddif ?? null,
        imageUrl: image_url ?? null,
        etatVie: etat_vie ?? null,
      },
    });
    await logChange("edit_info", char.nom);
    await invalidateWikiCache();
    return NextResponse.json(char);
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
    const existing = await prisma.character.findUnique({
      where: { id },
      select: { nom: true },
    });
    await prisma.character.delete({ where: { id } });
    await logChange("edit_info", existing?.nom ?? id, "Personnage supprimé");
    await invalidateWikiCache();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
