// app/api/polls/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin/auth";
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

async function requirePollAdmin() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await isAdminUser(userId, "polls"))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return null;
}

// PATCH /api/polls/[id] { active } → afficher / masquer le sondage sur l'accueil
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePollAdmin();
  if (denied) return denied;

  const { id } = await params;
  const { active } = await req.json();
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "active requis" }, { status: 400 });
  }

  const exists = await prisma.poll.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });

  // Un seul sondage actif à la fois : en afficher un masque les autres
  if (active) {
    await prisma.poll.updateMany({ where: { active: true, id: { not: id } }, data: { active: false } });
  }
  const poll = await prisma.poll.update({ where: { id }, data: { active } });
  return NextResponse.json({ id: poll.id, active: poll.active });
}

// DELETE /api/polls/[id] → supprimer le sondage (et ses votes)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requirePollAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.poll.deleteMany({ where: { id } });
  return NextResponse.json({ success: true });
}
