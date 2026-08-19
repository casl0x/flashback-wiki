import { NextResponse } from "next/server";
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

// POST /api/polls → créer un sondage (protégé par middleware Clerk orga)
export async function POST(req: Request) {
  const { question, options, endsAt } = await req.json();

  const { question, options, endsAt } = await req.json();

  if (!question || !options || options.length < 2) {
    return NextResponse.json({ error: "Question et au moins 2 options requises" }, { status: 400 });
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
      options: {
        create: options.map((label: string) => ({ label })),
      },
    },
    include: { options: true },
  });

  return NextResponse.json(poll, { status: 201 });
}