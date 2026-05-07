export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { character_id, target_id, relation_type } = await request.json();

  try {
    const sql = getDb();
    await sql`
      INSERT INTO relations (character_id, target_id, relation_type)
      VALUES (${character_id}, ${target_id}, ${relation_type})
      ON CONFLICT (character_id, target_id) DO UPDATE SET relation_type = ${relation_type}
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await request.json();

  try {
    const sql = getDb();
    await sql`DELETE FROM relations WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE toutes les relations d'un personnage (utilisé avant re-sync)
export async function PUT(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { character_id } = await request.json();

  try {
    const sql = getDb();
    await sql`DELETE FROM relations WHERE character_id = ${character_id}`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
