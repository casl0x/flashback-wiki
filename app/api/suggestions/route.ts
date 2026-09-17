import { invalidateWikiCache } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

import { auth, clerkClient } from "@clerk/nextjs/server";

async function isAdmin(userId: string | null) {
  if (!userId) return false;
  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({
    userId,
  });
  return memberships.data.some(
    (m) => m.organization.id === process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID,
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const suggestion = await prisma.suggestion.create({
    data: {
      ...body,
      clerkUserId: userId ?? null,
    },
  });
  return NextResponse.json(suggestion);
}

export async function GET() {
  const suggestions = await prisma.suggestion.findMany({
    where: { status: "pending" },
    include: { character: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suggestions);
}

type AcceptedSuggestion = NonNullable<
  Awaited<ReturnType<typeof prisma.suggestion.update>>
>;

// Applique une suggestion acceptée : écrit ses champs sur le personnage
// (visé, ou nouvellement créé) et attribue les points à son auteur.
// Isolée de PATCH pour rester testable sans le contexte Clerk.
export async function applyAcceptedSuggestion(suggestion: AcceptedSuggestion) {
  const [groupe, joueur] = await Promise.all([
    suggestion.groupe
      ? prisma.groupe.findFirst({
          where: { nom: { equals: suggestion.groupe, mode: "insensitive" } },
        })
      : null,
    suggestion.joueur
      ? prisma.player.findFirst({
          where: { pseudo: { equals: suggestion.joueur, mode: "insensitive" } },
        })
      : null,
  ]);

  const fieldUpdates = {
    ...(suggestion.metier ? { metier: suggestion.metier } : {}),
    ...(suggestion.description ? { description: suggestion.description } : {}),
    ...(suggestion.lienReddif ? { lienReddif: suggestion.lienReddif } : {}),
    ...(suggestion.role ? { role: suggestion.role } : {}),
    ...(suggestion.etatVie ? { etatVie: suggestion.etatVie } : {}),
    ...(suggestion.versionId ? { versionId: suggestion.versionId } : {}),
    ...(groupe ? { groupes: { connect: { id: groupe.id } } } : {}),
    ...(joueur ? { playerId: joueur.id } : {}),
  };

  let characterMutated = false;

  if (suggestion.characterId) {
    await prisma.character.update({
      where: { id: suggestion.characterId },
      data: {
        ...(suggestion.nom ? { nom: suggestion.nom } : {}),
        ...fieldUpdates,
      },
    });
    characterMutated = true;
  } else if (suggestion.nom) {
    const character = await prisma.character.create({
      data: { nom: suggestion.nom, ...fieldUpdates },
    });
    await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { characterId: character.id },
    });
    characterMutated = true;
  }

  if (suggestion.clerkUserId) {
    const updated = await prisma.userProfile.upsert({
      where: { clerkUserId: suggestion.clerkUserId },
      create: {
        clerkUserId: suggestion.clerkUserId,
        totalPoints: 10,
        acceptedCount: 1,
        badges: computeBadges(1, 10),
      },
      update: {
        totalPoints: { increment: 10 },
        acceptedCount: { increment: 1 },
      },
    });
    await prisma.userProfile.update({
      where: { clerkUserId: suggestion.clerkUserId },
      data: {
        badges: computeBadges(
          updated.acceptedCount + 1,
          updated.totalPoints + 10,
        ),
      },
    });
  }

  if (characterMutated) await invalidateWikiCache();
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!(await isAdmin(userId)))
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id, status } = await req.json();

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data: { status },
  });

  if (status === "accepted") {
    await applyAcceptedSuggestion(suggestion);
  }

  return NextResponse.json(suggestion);
}

function computeBadges(acceptedCount: number, points: number): string[] {
  const badges: string[] = [];

  // Badges contribution → basés sur acceptedCount
  if (acceptedCount >= 1) badges.push("first-step");
  if (acceptedCount >= 5) badges.push("contributor");
  if (acceptedCount >= 15) badges.push("expert");
  if (acceptedCount >= 30) badges.push("legend");

  return badges;
}
