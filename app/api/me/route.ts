import { prisma } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const [profile, suggestions] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      include: {
        creatorRoles: {
          include: { socialLinks: true }, // ← liens dans le rôle
        },
      },
    }),
    prisma.suggestion.groupBy({
      by: ["status"],
      where: { clerkUserId: userId },
      _count: true,
    }),
  ]);

  const stats = {
    pending: suggestions.find((s) => s.status === "pending")?._count ?? 0,
    accepted: suggestions.find((s) => s.status === "accepted")?._count ?? 0,
    rejected: suggestions.find((s) => s.status === "rejected")?._count ?? 0,
  };

  return NextResponse.json({
    pseudo: user.username ?? user.firstName ?? "Anonyme",
    avatarUrl: user.imageUrl,
    points: profile?.totalPoints ?? 0,
    badges: profile?.badges ?? [],
    stats,
    creatorRoles:
      profile?.creatorRoles.map((r) => ({
        type: r.type,
        displayOnWiki: r.displayOnWiki,
        status: r.status,
        socialLinks: r.socialLinks.map((l) => ({
          platform: l.platform,
          url: l.url,
        })),
      })) ?? [],
  });
}
