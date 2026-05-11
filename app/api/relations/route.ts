export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function POST(request: NextRequest) {
  const { personnage_a, personnage_b, type_relation, type_relation_inverse } =
    await request.json();

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
  const isSwapped = a !== personnage_a;

  const typeA = isSwapped
    ? (type_relation_inverse ?? null)
    : (type_relation ?? null);
  const typeB = isSwapped
    ? (type_relation ?? null)
    : (type_relation_inverse ?? null);

  try {
    const relation = await prisma.relation.upsert({
      where: {
        personnageAId_personnageBId: { personnageAId: a, personnageBId: b },
      },
      update: { typeRelation: typeA, typeRelationInverse: typeB },
      create: {
        personnageAId: a,
        personnageBId: b,
        typeRelation: typeA,
        typeRelationInverse: typeB,
      },
    });
    return NextResponse.json(relation, { status: 201 });
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
    await prisma.relation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("RELATIONS ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
