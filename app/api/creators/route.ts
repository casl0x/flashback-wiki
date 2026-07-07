import { prisma } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const roles = await prisma.creatorRole.findMany({
    where: {
      status: "approved",
      displayOnWiki: true,
    },
    orderBy: { createdAt: "asc" },
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

  // Grouper par userProfileId
  const grouped = new Map<
    string,
    {
      id: string;
      pseudo: string;
      avatarUrl: string | null;
      types: ("ARTISTE" | "EDITEUR")[];
      socialLinks: { platform: string; url: string }[];
    }
  >();

  for (const r of roles) {
    const profileId = r.userProfile.id;
    const clerkUser = userMap[r.userProfile.clerkUserId];

    if (!grouped.has(profileId)) {
      grouped.set(profileId, {
        id: profileId,
        pseudo: r.userProfile.pseudo ?? clerkUser?.username ?? "Anonyme",
        avatarUrl: clerkUser?.imageUrl ?? null,
        types: [],
        socialLinks: r.userProfile.socialLinks.map((l) => ({
          platform: l.platform,
          url: l.url,
        })),
      });
    }

    grouped.get(profileId)!.types.push(r.type);
  }

  return NextResponse.json([...grouped.values()]);
}
