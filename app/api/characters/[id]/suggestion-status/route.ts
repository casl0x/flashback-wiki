import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * Statut de la dernière proposition de l'utilisateur connecté sur ce perso,
 * pour les bandeaux de la fiche. Non mis en cache (dépend de l'auteur).
 */
export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ pending: false, rejected: null });

  const { id } = await params;

  const last = await prisma.suggestion.findFirst({
    where: { clerkUserId: userId, characterId: id },
    orderBy: { createdAt: "desc" },
    select: { status: true, rejectReason: true, moderatorMessage: true },
  });

  return NextResponse.json({
    pending: last?.status === "pending",
    rejected:
      last?.status === "rejected"
        ? { rejectReason: last.rejectReason, moderatorMessage: last.moderatorMessage }
        : null,
  });
}
