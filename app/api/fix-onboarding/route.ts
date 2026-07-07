import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  await prisma.userProfile.update({
    where: { clerkUserId: userId },
    data: { onboardingComplete: true },
  });

  return NextResponse.json({ ok: true });
}
