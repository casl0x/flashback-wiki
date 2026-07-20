import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  console.log("check-onboarding userId:", userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId ?? "" },
    select: { onboardingComplete: true },
  });

  console.log("check-onboarding profile:", profile);
  return NextResponse.json({ complete: profile?.onboardingComplete ?? false });
}
