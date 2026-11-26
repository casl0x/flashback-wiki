import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

// GET /api/polls → sondage actif pour la home
// GET /api/polls?all=1 → tous les sondages (admin), pour les gérer
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("all")) {
    const { userId } = await auth();
    if (!(await isAdminUser(userId, "polls"))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: { options: { include: { _count: { select: { votes: true } } } } },
    });
    return NextResponse.json(
      polls.map((p) => ({
        id: p.id,
        question: p.question,
        active: p.active,
        isPublic: p.isPublic,
        allowProposals: p.allowProposals,
        endsAt: p.endsAt,
        createdAt: p.createdAt,
        totalVotes: p.options.reduce((n, o) => n + o._count.votes, 0),
      })),
    );
  }

  const poll = await prisma.poll.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  if (!poll) return NextResponse.json(null);
  return NextResponse.json({ id: poll.id });
}


// POST /api/polls → créer un sondage (réservé aux admins de l'orga Clerk)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!(await isAdminUser(userId, "polls"))) {
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

  // Notifie tout le monde (cloche + toast, y compris les visiteurs) via une annonce
  await prisma.announcement
    .create({ data: { message: `📊 Nouveau sondage : ${question}` } })
    .catch((e) => console.error("Annonce du sondage non créée", e));

  return NextResponse.json(poll, { status: 201 });
}