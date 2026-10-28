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
    groupe_ids,
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
        versions: version_id ? { connect: [{ id: version_id }] } : undefined,
        groupes: groupe_ids?.length
          ? {
              create: groupe_ids.map((id: string, ordre: number) => ({
                groupeId: id,
                ordre,
              })),
            }
          : undefined,
        lienReddif: lien_reddif ?? null,
        imageUrl: image_url ?? null,
        etatVie: etat_vie ?? null,
      },
    });
    await logChange("add_global", char.nom, version_id ?? undefined);
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
    groupe_ids,
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
        ...(version_id !== undefined && {
          versions: { set: version_id ? [{ id: version_id }] : [] },
        }),
        groupes: {
          deleteMany: {},
          create: (groupe_ids ?? []).map((id: string, ordre: number) => ({
            groupeId: id,
            ordre,
          })),
        },
        lienReddif: lien_reddif ?? null,
        imageUrl: image_url ?? null,
        etatVie: etat_vie ?? null,
      },
    });
    await logChange("edit_info", char.nom, version_id ?? undefined);
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
