// app/api/polls/[id]/options/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/poll-voter";

const MAX_LABEL = 80;
const MAX_OPTIONS = 30;

// POST /api/polls/[id]/options → proposer une option (si le sondage l'autorise)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim() : "";

  if (!label || label.length > MAX_LABEL) {
    return NextResponse.json(
      { error: `La proposition doit faire entre 1 et ${MAX_LABEL} caractères` },
      { status: 400 }
    );
  }

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { options: true },
  });

  if (!poll) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });

  if (!poll.allowProposals) {
    return NextResponse.json({ error: "Les propositions sont désactivées" }, { status: 403 });
  }

  if (!userId && !poll.isPublic) {
    return NextResponse.json({ error: "Connecte-toi pour proposer" }, { status: 401 });
  }

  if (!poll.active || (poll.endsAt && new Date() > poll.endsAt)) {
    return NextResponse.json({ error: "Ce sondage est terminé" }, { status: 403 });
  }

  const voterId = await getVoterId(true);
  if (!voterId) {
    return NextResponse.json({ error: "Votant introuvable" }, { status: 400 });
  }

  if (poll.options.length >= MAX_OPTIONS) {
    return NextResponse.json({ error: "Trop de propositions" }, { status: 409 });
  }

  if (poll.options.some((o) => o.proposedBy === voterId)) {
    return NextResponse.json({ error: "Tu as déjà fait une proposition" }, { status: 409 });
  }

  if (poll.options.some((o) => o.label.toLowerCase() === label.toLowerCase())) {
    return NextResponse.json({ error: "Cette option existe déjà" }, { status: 409 });
  }

  const option = await prisma.pollOption.create({
    data: { label, pollId: id, proposedBy: voterId },
  });

  return NextResponse.json(option, { status: 201 });
}
