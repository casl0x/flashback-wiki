import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ accepted: false });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { creatorRulesAcceptedAt: true },
  });
  return NextResponse.json({ accepted: !!profile?.creatorRulesAcceptedAt });
}
