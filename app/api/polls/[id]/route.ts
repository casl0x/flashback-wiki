// app/api/polls/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVoterId } from "@/lib/poll-voter";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const voterId = await getVoterId();

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: {
        include: { votes: true },
      },
    },
  });

  if (!poll) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });

  const totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);

  const userVotedOptionId = voterId
    ? poll.options.find((o) => o.votes.some((v) => v.userId === voterId))?.id ?? null
    : null;

  const hasProposed = voterId
    ? poll.options.some((o) => o.proposedBy === voterId)
    : false;

  return NextResponse.json({
    id: poll.id,
    question: poll.question,
    active: poll.active,
    endsAt: poll.endsAt,
    isPublic: poll.isPublic,
    allowProposals: poll.allowProposals,
    hasProposed,
    totalVotes,
    userVotedOptionId,
    options: poll.options.map((o) => ({
      id: o.id,
      label: o.label,
      votes: o.votes.length,
      percent: totalVotes > 0 ? Math.round((o.votes.length / totalVotes) * 100) : 0,
    })),
  });
}