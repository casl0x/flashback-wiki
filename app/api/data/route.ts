import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/data — toutes les données pour le wiki public (une seule requête)
export async function GET() {
  try {
    const sql = getDb()

    const [versions, players, characters, relations] = await Promise.all([
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
    ])

    // Assembler les données côté serveur
    const playerMap = Object.fromEntries(players.map((p: any) => [p.id, p]))
    const relsByChar: Record<number, any[]> = {}
    for (const r of relations as any[]) {
      if (!relsByChar[r.character_id]) relsByChar[r.character_id] = []
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
      })
    }

    const enrichedChars = (characters as any[]).map((c) => ({
      ...c,
      player: playerMap[c.player_id] || null,
      version: versions.find((v: any) => v.id === c.version_id) || null,
      relations: relsByChar[c.id] || [],
    }))

    return NextResponse.json({ versions, players, characters: enrichedChars })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
