import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json([]);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  });
  if (!profile) return NextResponse.json([]);

  const unread = await prisma.notification.findMany({
    where: { userProfileId: profile.id, read: false },
    orderBy: { createdAt: "asc" },
  });

  if (unread.length) {
    await prisma.notification.updateMany({
      where: { id: { in: unread.map((n) => n.id) } },
      data: { read: true },
    });
  }

  return NextResponse.json(
    unread.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      createdAt: n.createdAt,
    })),
  );
}
