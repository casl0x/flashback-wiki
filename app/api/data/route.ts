export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    player: true;
    version: true;
    relationsA: { include: { personnageB: { include: { player: true } } } };
    relationsB: { include: { personnageA: { include: { player: true } } } };
  };
}>;

export async function GET() {
  try {
    const [versions, players, characters] = await Promise.all([
      prisma.version.findMany({ orderBy: { id: "asc" } }),
      prisma.player.findMany({ orderBy: { pseudo: "asc" } }),
      prisma.character.findMany({
        orderBy: { nom: "asc" },
        include: {
          player: true,
          version: true,
          relationsA: {
            include: { personnageB: { include: { player: true } } },
          },
          relationsB: {
            include: { personnageA: { include: { player: true } } },
          },
        },
      }),
    ]);

    // Normaliser les relations symétriques
    const enrichedChars = characters.map((c: CharacterWithRelations) => {
      const relations = [
        ...c.relationsA.map((r) => ({
          id: r.id,
          type_relation: r.typeRelation,
          linked: {
            id: r.personnageB.id,
            nom: r.personnageB.nom,
            role: r.personnageB.role,
            metier: r.personnageB.metier,
            player_pseudo: r.personnageB.player?.pseudo ?? null,
          },
        })),
        ...c.relationsB.map((r) => ({
          id: r.id,
          type_relation: r.typeRelation,
          linked: {
            id: r.personnageA.id,
            nom: r.personnageA.nom,
            role: r.personnageA.role,
            metier: r.personnageA.metier,
            player_pseudo: r.personnageA.player?.pseudo ?? null,
          },
        })),
      ];

      return {
        ...c,
        relationsA: undefined,
        relationsB: undefined,
        relations,
      };
    });

    return NextResponse.json(
      { versions, players, characters: enrichedChars },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
