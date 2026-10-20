import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// GET /api/polls → sondage actif pour la home
export async function GET() {
  const poll = await prisma.poll.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  if (!poll) return NextResponse.json(null);
  return NextResponse.json({ id: poll.id });
}

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

// POST /api/polls → créer un sondage (réservé aux admins de l'orga Clerk)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { question, options = [], endsAt, isPublic, allowProposals } = await req.json();

  if (!question || !Array.isArray(options)) {
    return NextResponse.json({ error: "Question requise" }, { status: 400 });
  }

  // Sans propositions des votants, il faut au moins 2 choix prédéfinis
  if (!allowProposals && options.length < 2) {
    return NextResponse.json({ error: "Au moins 2 options requises" }, { status: 400 });
  }

  // Désactive les anciens sondages actifs
  await prisma.poll.updateMany({
    where: { active: true },
    data: { active: false },
  });

  const poll = await prisma.poll.create({
    data: {
      question,
      endsAt: endsAt ? new Date(endsAt) : null,
      isPublic: !!isPublic,
      allowProposals: !!allowProposals,
      options: {
        create: options.map((label: string) => ({ label })),
      },
    },
    include: { options: true },
  });

  return NextResponse.json(poll, { status: 201 });
}