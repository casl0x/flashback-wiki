import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const suggestion = await prisma.suggestion.create({
    data: {
      ...body,
      clerkUserId: userId ?? null,
    },
  });
  return NextResponse.json(suggestion);
}

export async function GET() {
  const suggestions = await prisma.suggestion.findMany({
    where: { status: "pending" },
    include: { character: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suggestions);
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json();

  const suggestion = await prisma.suggestion.update({
    where: { id },
    data: { status },
  });

  if (status === "accepted" && suggestion.clerkUserId) {
    const updated = await prisma.userProfile.upsert({
      where: { clerkUserId: suggestion.clerkUserId },
      create: {
        clerkUserId: suggestion.clerkUserId,
        totalPoints: 10,
        acceptedCount: 1,
        badges: computeBadges(1, 10),
      },
      update: {
        totalPoints: { increment: 10 },
        acceptedCount: { increment: 1 },
      },
    });
    await prisma.userProfile.update({
      where: { clerkUserId: suggestion.clerkUserId },
      data: {
        badges: computeBadges(
          updated.acceptedCount + 1,
          updated.totalPoints + 10,
        ),
      },
    });
  }

  return NextResponse.json(suggestion);
}

function computeBadges(acceptedCount: number, points: number): string[] {
  const badges: string[] = [];

  // Badges contribution → basés sur acceptedCount
  if (acceptedCount >= 1) badges.push("first-step");
  if (acceptedCount >= 5) badges.push("contributor");
  if (acceptedCount >= 15) badges.push("expert");
  if (acceptedCount >= 30) badges.push("legend");

  return badges;
}
