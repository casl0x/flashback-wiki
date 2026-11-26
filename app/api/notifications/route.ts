import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const PAGE_SIZE = 30;

/**
 * Historique de notifications du compte connecté (lues ou non), pour la cloche
 * et la page "Toutes les notifications". Les annonces ont leur propre modale
 * (voir AnnouncementModal, /api/announcements/active). Ne marque
 * jamais rien comme lu : c'est POST /api/notifications/read qui s'en charge.
 *
 * Query params optionnels :
 * - cursor: ISO date, ne renvoie que les éléments plus anciens (pagination)
 * - unread=1: ne renvoie que les éléments non lus
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [], unread: 0 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const unreadOnly = searchParams.get("unread") === "1";
  const cursorDate = cursor ? new Date(cursor) : null;

  const [notifications, unreadNotifCount] = await Promise.all([
    profile
      ? prisma.notification.findMany({
          where: {
            userProfileId: profile.id,
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            ...(unreadOnly ? { read: false } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
        })
      : [],
    profile
      ? prisma.notification.count({
          where: { userProfileId: profile.id, read: false },
        })
      : Promise.resolve(0),
  ]);

  const items: Item[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  const nextCursor = items.length === PAGE_SIZE ? items[items.length - 1].createdAt : null;

  return NextResponse.json({
    items,
    unread: unreadNotifCount,
    nextCursor,
  });
}
