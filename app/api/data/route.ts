import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/data — toutes les données pour le wiki public (une seule requête)
export const dynamic = "force-dynamic";

type VersionRow = {
  id: number;
};

type PlayerRow = {
  id: number;
  pseudo: string;
};

type CharacterRow = {
  id: number;
  name: string;
  job: string;
  version_id: number;
  player_id: number;
};

type RelationQueryRow = {
  id: number;
  character_id: number;
  relation_type: string;
  target_id: number;
  t_id: number;
  t_name: string;
  t_job: string;
  t_version_id: number;
  t_player_pseudo: string;
};

type RelationItem = {
  id: number;
  relation_type: string;
  target_id: number;
  target: {
    id: number;
    name: string;
    job: string;
    version_id: number;
    player: { pseudo: string };
  };
};

export async function GET() {
  try {
    const sql = getDb();

    const [versions, players, characters, relations] = (await Promise.all([
      sql`SELECT * FROM versions ORDER BY id`,
      sql`SELECT * FROM players ORDER BY pseudo`,
      sql`SELECT * FROM characters ORDER BY name`,
      sql`
        SELECT r.*, 
          c.id as t_id, c.name as t_name, c.job as t_job, c.version_id as t_version_id,
          p.pseudo as t_player_pseudo
        FROM relations r
        JOIN characters c ON c.id = r.target_id
        JOIN players p ON p.id = c.player_id
      `,
    ])) as [VersionRow[], PlayerRow[], CharacterRow[], RelationQueryRow[]];

    // Assembler les données côté serveur
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
    const relsByChar: Record<number, RelationItem[]> = {};
    for (const r of relations) {
      if (!relsByChar[r.character_id]) relsByChar[r.character_id] = [];
      relsByChar[r.character_id].push({
        id: r.id,
        relation_type: r.relation_type,
        target_id: r.target_id,
        target: {
          id: r.t_id,
          name: r.t_name,
          job: r.t_job,
          version_id: r.t_version_id,
          player: { pseudo: r.t_player_pseudo },
        },
      });
    }

    const enrichedChars = characters.map((c) => ({
      ...c,
      player: playerMap[c.player_id] || null,
      version: versions.find((v) => v.id === c.version_id) || null,
      relations: relsByChar[c.id] || [],
    }));

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
