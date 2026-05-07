export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, label, description } = await request.json();
  if (!id || !label)
    return NextResponse.json({ error: "ID et label requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [version] = await sql`
      INSERT INTO versions (id, label, description)
      VALUES (${id}, ${label}, ${description || null})
      RETURNING *
    `;
    return NextResponse.json(version, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, label, description } = await request.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [version] = await sql`
      UPDATE versions
      SET
        label       = COALESCE(${label ?? null}, label),
        description = ${description ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(version);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await request.json();

  try {
    const sql = getDb();
    await sql`DELETE FROM versions WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
