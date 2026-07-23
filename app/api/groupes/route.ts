export const dynamic = "force-dynamic";

import { invalidateWikiCache } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const groupes = await prisma.groupe.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(
    groupes.map((g) => ({ ...g, createdAt: g.createdAt.toISOString() })),
  );
}

export async function POST(request: NextRequest) {
  const { slug, nom, description, color, image_url } = await request.json();
  if (!nom || !slug)
    return NextResponse.json({ error: "Nom et slug requis" }, { status: 400 });

  try {
    const groupe = await prisma.groupe.create({
      data: {
        slug,
        nom,
        description: description ?? null,
        color: color ?? null,
        imageUrl: image_url ?? null,
      },
    });
    await invalidateWikiCache();
    return NextResponse.json(
      { ...groupe, createdAt: groupe.createdAt.toISOString() },
      { status: 201 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { id, slug, nom, description, color, image_url } = await request.json();
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  try {
    const groupe = await prisma.groupe.update({
      where: { id },
      data: {
        slug,
        nom,
        description: description ?? null,
        color: color ?? null,
        imageUrl: image_url ?? null,
      },
    });
    await invalidateWikiCache();
    return NextResponse.json({
      ...groupe,
      createdAt: groupe.createdAt.toISOString(),
    });
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
    await prisma.groupe.delete({ where: { id } });
    await invalidateWikiCache();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
