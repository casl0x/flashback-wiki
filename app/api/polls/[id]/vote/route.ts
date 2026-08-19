// app/api/polls/[id]/vote/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Connecte-toi pour voter" }, { status: 401 });
  }

  const { optionId } = await req.json();

  if (!optionId) {
    return NextResponse.json({ error: "Option manquante" }, { status: 400 });
  }

  const option = await prisma.pollOption.findFirst({
    where: { id: optionId, pollId: id },
    include: { poll: true },
  });

  if (!option) {
    return NextResponse.json({ error: "Option invalide" }, { status: 404 });
  }

  if (!option.poll.active) {
    return NextResponse.json({ error: "Ce sondage est terminé" }, { status: 403 });
  }

  if (option.poll.endsAt && new Date() > option.poll.endsAt) {
    return NextResponse.json({ error: "Ce sondage est expiré" }, { status: 403 });
  }

  const existingVote = await prisma.pollVote.findFirst({
    where: {
      userId,
      option: { pollId: id },
    },
  });

  if (existingVote) {
    return NextResponse.json({ error: "Tu as déjà voté" }, { status: 409 });
  }

  await prisma.pollVote.create({
    data: { userId, optionId },
  });

  return NextResponse.json({ success: true });
}