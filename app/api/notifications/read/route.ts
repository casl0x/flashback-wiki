import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Marque des notifications comme lues (corps `{ ids?: string[] }`).
 * Sans `ids` : tout marquer comme lu, annonces incluses (via
 * `lastSeenAnnouncementAt = now`). Avec `ids` : seulement ceux-là ; les ids
 * d'annonces sont préfixés `ann-` et font aussi avancer `lastSeenAnnouncementAt`
 * (la lecture des annonces n'est pas trackée par élément).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : undefined;

  if (!ids) {
    await Promise.all([
      prisma.notification.updateMany({
        where: { userProfileId: profile.id, read: false },
        data: { read: true },
      }),
      prisma.userProfile.update({
        where: { id: profile.id },
        data: { lastSeenAnnouncementAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const notifIds = ids.filter((id) => !id.startsWith("ann-"));
  const hasAnnouncement = ids.some((id) => id.startsWith("ann-"));

  await Promise.all([
    notifIds.length
      ? prisma.notification.updateMany({
          where: { id: { in: notifIds }, userProfileId: profile.id },
          data: { read: true },
        })
      : Promise.resolve(),
    hasAnnouncement
      ? prisma.userProfile.update({
          where: { id: profile.id },
          data: { lastSeenAnnouncementAt: new Date() },
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
