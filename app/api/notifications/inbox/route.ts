import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Dernières notifications du compte connecté (lues ou non) + annonces actives,
 * pour la cloche du header. Contrairement à GET /api/notifications (pop-up),
 * cette route ne marque rien comme lu.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [] });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  const [notifications, announcements] = await Promise.all([
    profile
      ? prisma.notification.findMany({
          where: { userProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [],
    prisma.announcement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const items = [
    ...notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
    })),
    ...announcements.map((a) => ({
      id: `ann-${a.id}`,
      type: "announcement",
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  return NextResponse.json({ items });
}
