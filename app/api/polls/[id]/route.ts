// app/api/polls/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

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

  const userVotedOptionId = userId
    ? poll.options.find((o) => o.votes.some((v) => v.userId === userId))?.id ?? null
    : null;

  return NextResponse.json({
    id: poll.id,
    question: poll.question,
    active: poll.active,
    endsAt: poll.endsAt,
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