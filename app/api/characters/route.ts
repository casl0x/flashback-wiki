export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST — créer un personnage
export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { name, job, description, tags, version_id, player_id, status } =
    await request.json();
  if (!name || !job || !version_id || !player_id)
    return NextResponse.json(
      { error: "Champs requis manquants" },
      { status: 400 },
    );

  try {
    const sql = getDb();
    const [char] = await sql`
      INSERT INTO characters (name, job, description, tags, version_id, player_id, status)
      VALUES (${name}, ${job}, ${description || null}, ${tags || []}, ${version_id}, ${player_id}, ${status || null})
      RETURNING *
    `;
    return NextResponse.json(char, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

// PATCH — modifier un personnage
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, name, job, description, tags, version_id, player_id, status } =
    await request.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [char] = await sql`
      UPDATE characters
      SET
        name       = COALESCE(${name ?? null}, name),
        job        = COALESCE(${job ?? null}, job),
        description= ${description ?? null},
        tags       = COALESCE(${tags ?? null}, tags),
        version_id = COALESCE(${version_id ?? null}, version_id),
        player_id  = COALESCE(${player_id ?? null}, player_id),
        status     = ${status ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(char);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

// DELETE — supprimer un personnage
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    await sql`DELETE FROM characters WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
