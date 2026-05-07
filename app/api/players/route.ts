export const dynamic = "force-dynamic";

import { isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { pseudo, discord, tiktok, stream_url } = await request.json();
  if (!pseudo)
    return NextResponse.json({ error: "Pseudo requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [player] = await sql`
      INSERT INTO players (pseudo, discord, tiktok, stream_url)
      VALUES (${pseudo}, ${discord || null}, ${tiktok || null}, ${stream_url || null})
      RETURNING *
    `;
    return NextResponse.json(player, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, discord, tiktok, stream_url } = await request.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const sql = getDb();
    const [player] = await sql`
      UPDATE players
      SET
        discord    = ${discord ?? null},
        tiktok     = ${tiktok ?? null},
        stream_url = ${stream_url ?? null}
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(player);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await request.json();

  try {
    const sql = getDb();
    await sql`DELETE FROM players WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
