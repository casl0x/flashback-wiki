import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Marque des notifications comme lues (corps `{ ids?: string[] }`).
 * Sans `ids` : tout marquer comme lu. Les annonces ne sont pas concernées
 * (voir /api/announcements/seen).
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

  await prisma.notification.updateMany({
    where: {
      userProfileId: profile.id,
      read: false,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
