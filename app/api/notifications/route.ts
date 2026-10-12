import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json([]);

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    create: { clerkUserId: userId },
    update: {},
  });

  const [unread, unseenAnnouncements] = await Promise.all([
    prisma.notification.findMany({
      where: { userProfileId: profile.id, read: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.announcement.findMany({
      where: {
        active: true,
        createdAt: { gt: profile.lastSeenAnnouncementAt ?? new Date(0) },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (unread.length) {
    await prisma.notification.updateMany({
      where: { id: { in: unread.map((n) => n.id) } },
      data: { read: true },
    });
  }

  if (unseenAnnouncements.length) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        lastSeenAnnouncementAt:
          unseenAnnouncements[unseenAnnouncements.length - 1].createdAt,
      },
    });
  }

  return NextResponse.json([
    ...unread.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      createdAt: n.createdAt,
    })),
    ...unseenAnnouncements.map((a) => ({
      id: `ann-${a.id}`,
      type: "announcement",
      message: a.message,
      createdAt: a.createdAt,
    })),
  ]);
}
