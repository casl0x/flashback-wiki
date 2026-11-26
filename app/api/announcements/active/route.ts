import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Annonces actives à afficher en modale. Connecté : seulement celles postérieures
// à lastSeenAnnouncementAt (suivi en base). Visiteur : toutes les actives, le
// filtrage « déjà vu » se fait côté client via localStorage.
export async function GET() {
  const { userId } = await auth();
  const profile = userId
    ? await prisma.userProfile.findUnique({
        where: { clerkUserId: userId },
        select: { lastSeenAnnouncementAt: true },
      })
    : null;

  const announcements = await prisma.announcement.findMany({
    where: {
      active: true,
      ...(profile?.lastSeenAnnouncementAt
        ? { createdAt: { gt: profile.lastSeenAnnouncementAt } }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    announcements.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt,
    })),
  );
}
