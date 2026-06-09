import { invalidateWikiCache } from "@/lib/actions";
import { logChange } from "@/lib/changelog";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const locationX = body.x != null ? Number(body.x) : null;
  const locationY = body.y != null ? Number(body.y) : null;

  try {
    const character = await prisma.character.update({
      where: { id },
      data: { locationX, locationY },
      select: { id: true, locationX: true, locationY: true },
    });
    const type = locationX != null ? "add_lieu" : "edit_lieu";
    await logChange(type, character.id);
    await invalidateWikiCache();
    return NextResponse.json(character);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
