export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST — créer un personnage
export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { nom, role, description, player_id, metier, lien_reddit } =
    await request.json();

  if (!nom || !player_id)
    return NextResponse.json(
      { error: "Champs requis manquants (nom, player_id)" },
      { status: 400 },
    );

  try {
    const sql = getDb();
    const [char] = await sql`
      INSERT INTO characters (nom, role, description, player_id, metier, lien_reddit)
      VALUES (${nom}, ${role || null}, ${description || null}, ${player_id}, ${metier || null}, ${lien_reddit || null})
      RETURNING *
    `;
    return NextResponse.json(char, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// PATCH — modifier un personnage
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, nom, role, description, player_id, metier, lien_reddit } =
    await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [char] = await sql`
      UPDATE characters
      SET
        nom         = COALESCE(${nom ?? null}, nom),
        role        = ${role ?? null},
        description = ${description ?? null},
        player_id   = COALESCE(${player_id ?? null}, player_id),
        metier      = ${metier ?? null},
        lien_reddit = ${lien_reddit ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(char);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
