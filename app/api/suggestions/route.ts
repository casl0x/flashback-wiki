import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import type { EtatVie, Role } from "@prisma/client";
import { NextResponse } from "next/server";

// La validation / le refus des propositions se fait dans l'admin
// (Modération, server actions de lib/admin/actions/moderation.ts).

const ROLES: Role[] = ["civil", "illegal"];
const ETATS: EtatVie[] = ["EN_VIE", "MORT", "PARTI", "DISPARU", "PRISON"];

const text = (v: unknown, max = 4000) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  // Seuls les champs d'une proposition sont acceptés (pas de statut, pas d'auteur…).
  const characterId = text(body.characterId, 64);
  const versionId = text(body.versionId, 32);
  const [character, version] = await Promise.all([
    characterId ? prisma.character.findUnique({ where: { id: characterId }, select: { id: true } }) : null,
    versionId ? prisma.version.findUnique({ where: { id: versionId }, select: { id: true } }) : null,
  ]);
  if (characterId && !character) return NextResponse.json({ error: "Personnage introuvable" }, { status: 400 });

  const role = ROLES.includes(body.role as Role) ? (body.role as Role) : null;
  const etatVie = ETATS.includes(body.etatVie as EtatVie) ? (body.etatVie as EtatVie) : null;

  const suggestion = await prisma.suggestion.create({
    data: {
      clerkUserId: userId,
      characterId: character?.id ?? null,
      nom: text(body.nom, 200),
      groupe: text(body.groupe, 200),
      joueur: text(body.joueur, 200),
      lienReddif: text(body.lienReddif, 500),
      description: text(body.description),
      note: text(body.note, 2000),
      role,
      etatVie,
      versionId: version?.id ?? null,
    },
  });
  return NextResponse.json({ id: suggestion.id });
}
