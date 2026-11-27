import { isAdminUser } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Personnages proposés par @ dans les éditeurs de texte de l'admin (annonces…). */
export async function GET() {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) return NextResponse.json([], { status: 403 });

  const characters = await prisma.character.findMany({
    orderBy: { nom: "asc" },
    select: { id: true, nom: true, player: { select: { pseudo: true } } },
  });
  return NextResponse.json(characters);
}
