export const dynamic = "force-dynamic";

import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

type PlayerRow = {
  id: string;
  pseudo: string;
  stream: boolean;
  lien_chaine: string | null;
  reseaux: Record<string, string>;
};

type CharacterRow = {
  id: string;
  nom: string;
  role: "civil" | "illegal" | "fdo" | null;
  description: string | null;
  player_id: string;
  metier: string | null;
  lien_reddit: string | null;
};

type RelationQueryRow = {
  id: string;
  personnage_a: string;
  personnage_b: string;
  type_relation: string | null;
  // champs du personnage lié
  linked_id: string;
  linked_nom: string;
  linked_role: string | null;
  linked_metier: string | null;
  linked_player_pseudo: string;
};

export async function GET() {
  try {
    const sql = getDb();

    const [players, characters, relations] = (await Promise.all([
      sql`SELECT * FROM players ORDER BY pseudo`,
      sql`SELECT * FROM characters ORDER BY nom`,
      sql`
    SELECT
      r.id,
      r.personnage_a,
      r.personnage_b,
      r.type_relation,
      c.id            AS linked_id,
      c.nom           AS linked_nom,
      c.role          AS linked_role,
      c.metier        AS linked_metier,
      p.pseudo        AS linked_player_pseudo
    FROM relations r
    JOIN characters c ON c.id = CASE
      WHEN r.personnage_a = c.id THEN r.personnage_b
      ELSE r.personnage_a
    END
    JOIN players p ON p.id = c.player_id
  `,
    ])) as [PlayerRow[], CharacterRow[], RelationQueryRow[]];

    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

    // Grouper les relations par personnage (les deux côtés)
    const relsByChar: Record<
      string,
      {
        id: string;
        type_relation: string | null;
        linked: {
          id: string;
          nom: string;
          role: string | null;
          metier: string | null;
          player_pseudo: string;
        };
      }[]
    > = {};

    for (const r of relations) {
      const entry = {
        id: r.id,
        type_relation: r.type_relation,
        linked: {
          id: r.linked_id,
          nom: r.linked_nom,
          role: r.linked_role,
          metier: r.linked_metier,
          player_pseudo: r.linked_player_pseudo,
        },
      };
      // Côté a
      if (!relsByChar[r.personnage_a]) relsByChar[r.personnage_a] = [];
      relsByChar[r.personnage_a].push(entry);
      // Côté b (symétrie)
      if (!relsByChar[r.personnage_b]) relsByChar[r.personnage_b] = [];
      relsByChar[r.personnage_b].push(entry);
    }

    const enrichedChars = characters.map((c) => ({
      ...c,
      player: playerMap[c.player_id] || null,
      relations: relsByChar[c.id] || [],
    }));

    return NextResponse.json(
      { players, characters: enrichedChars },
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
