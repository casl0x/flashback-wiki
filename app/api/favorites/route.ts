import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Favoris du compte connecté (ids seulement), pour l'état des boutons cœur. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [] });

  const items = await prisma.favorite.findMany({
    where: { userProfile: { clerkUserId: userId } },
    select: { kind: true, targetId: true },
  });
  return NextResponse.json({ items });
}
