import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Le compte connecté a vu les annonces : la modale ne les affichera plus.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.userProfile.updateMany({
    where: { clerkUserId: userId },
    data: { lastSeenAnnouncementAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
