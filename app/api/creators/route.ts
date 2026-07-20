import { prisma } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type GroupedCreator = {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  types: ("ARTISTE" | "EDITEUR")[];
  roles: {
    type: "ARTISTE" | "EDITEUR";
    socialLinks: { platform: string; url: string }[];
  }[];
};

export async function GET() {
  const roles = await prisma.creatorRole.findMany({
    where: { status: "approved", displayOnWiki: true },
    orderBy: { createdAt: "asc" },
    include: {
      userProfile: true,
      socialLinks: true,
    },
  });

  const client = await clerkClient();
  const clerkIds = [...new Set(roles.map((r) => r.userProfile.clerkUserId))];
  const users = await Promise.all(
    clerkIds.map((id) => client.users.getUser(id)),
  );
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const grouped = new Map<string, GroupedCreator>();

  for (const r of roles) {
    const profileId = r.userProfile.id;
    const clerkUser = userMap[r.userProfile.clerkUserId];

    if (!grouped.has(profileId)) {
      grouped.set(profileId, {
        id: profileId,
        pseudo: r.userProfile.pseudo ?? clerkUser?.username ?? "Anonyme",
        avatarUrl: clerkUser?.imageUrl ?? null,
        types: [],
        roles: [],
      });
    }

    const entry = grouped.get(profileId)!;
    entry.types.push(r.type);
    entry.roles.push({
      type: r.type,
      socialLinks: r.socialLinks.map((l) => ({
        platform: l.platform,
        url: l.url,
      })),
    });
  }

  return NextResponse.json([...grouped.values()]);
}
