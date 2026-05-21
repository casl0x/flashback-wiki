export const dynamic = "force-dynamic";

import { invalidateWikiCache } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { id, label, description, color } = await request.json();

  if (!id || !label)
    return NextResponse.json({ error: "ID et label requis" }, { status: 400 });

  try {
    const version = await prisma.version.create({
      data: {
        id,
        label,
        description: description ?? null,
        color: color ?? "#8880a8",
      },
    });
    await invalidateWikiCache();
    return NextResponse.json(version, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { id, label, description, color } = await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const version = await prisma.version.update({
      where: { id },
      data: {
        ...(label && { label }),
        description: description ?? null,
        ...(color && { color }),
      },
    });
    return NextResponse.json(version);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    await prisma.version.delete({ where: { id } });
    await invalidateWikiCache();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
