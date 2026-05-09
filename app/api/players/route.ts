export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST — créer un joueur
export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { pseudo, stream, lien_chaine, reseaux } = await request.json();

  if (!pseudo)
    return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [player] = await sql`
      INSERT INTO players (pseudo, stream, lien_chaine, reseaux)
      VALUES (${pseudo}, ${stream ?? false}, ${lien_chaine || null}, ${JSON.stringify(reseaux || {})})
      RETURNING *
    `;
    return NextResponse.json(player, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — modifier un joueur
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, pseudo, stream, lien_chaine, reseaux } = await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [player] = await sql`
      UPDATE players
      SET
        pseudo      = COALESCE(${pseudo ?? null}, pseudo),
        stream      = COALESCE(${stream ?? null}, stream),
        lien_chaine = ${lien_chaine ?? null},
        reseaux     = COALESCE(${reseaux ? JSON.stringify(reseaux) : null}::jsonb, reseaux)
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(player);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — supprimer un joueur
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();

  try {
    const sql = getDb();
    await sql`DELETE FROM players WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
