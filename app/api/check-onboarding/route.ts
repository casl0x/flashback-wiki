import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ complete: false });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { onboardingComplete: true },
  });

  return NextResponse.json({ complete: profile?.onboardingComplete ?? false });
}
