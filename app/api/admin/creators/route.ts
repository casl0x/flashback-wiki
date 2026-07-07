import { prisma } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const roles = await prisma.creatorRole.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userProfile: {
        include: { socialLinks: true },
      },
    },
  });

  const client = await clerkClient();
  const clerkIds = [...new Set(roles.map((r) => r.userProfile.clerkUserId))];
  const users = await Promise.all(
    clerkIds.map((id) => client.users.getUser(id)),
  );
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json(
    roles.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      displayOnWiki: r.displayOnWiki,
      createdAt: r.createdAt,
      user: {
        pseudo: r.userProfile.pseudo,
        avatarUrl: userMap[r.userProfile.clerkUserId]?.imageUrl ?? null,
        clerkUsername:
          userMap[r.userProfile.clerkUserId]?.username ??
          userMap[r.userProfile.clerkUserId]?.firstName ??
          "Anonyme",
      },
      socialLinks: r.userProfile.socialLinks.map((l) => ({
        platform: l.platform,
        url: l.url,
      })),
    })),
  );
}
