export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Helper — trie les deux UUIDs pour respecter la contrainte personnage_a < personnage_b
function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// POST — créer ou mettre à jour une relation
export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { personnage_a, personnage_b, type_relation } = await request.json();

  if (!personnage_a || !personnage_b)
    return NextResponse.json(
      { error: "Les deux personnages sont requis" },
      { status: 400 },
    );

  if (personnage_a === personnage_b)
    return NextResponse.json(
      { error: "Un personnage ne peut pas être en relation avec lui-même" },
      { status: 400 },
    );

  const [a, b] = sortedPair(personnage_a, personnage_b);

  try {
    const sql = getDb();
    const [relation] = await sql`
      INSERT INTO relations (personnage_a, personnage_b, type_relation)
      VALUES (${a}, ${b}, ${type_relation || null})
      ON CONFLICT (personnage_a, personnage_b)
      DO UPDATE SET type_relation = ${type_relation || null}
      RETURNING *
    `;
    return NextResponse.json(relation, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — supprimer une relation par ID
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    await sql`DELETE FROM relations WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
