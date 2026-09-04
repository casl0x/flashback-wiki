import { prisma } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const posts = await prisma.creatorPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creatorRole: { include: { userProfile: true } },
      characters: { include: { character: { select: { id: true, nom: true } } } },
    },
  });

  const client = await clerkClient();
  const clerkIds = [
    ...new Set(posts.map((p) => p.creatorRole.userProfile.clerkUserId)),
  ];
  const users = await Promise.all(
    clerkIds.map((id) => client.users.getUser(id)),
  );
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json(
    posts.map((p) => {
      const clerkUser = userMap[p.creatorRole.userProfile.clerkUserId];
      return {
        id: p.id,
        type: p.type,
        status: p.status,
        imageUrl: p.imageUrl,
        linkUrl: p.linkUrl,
        platform: p.platform,
        caption: p.caption,
        createdAt: p.createdAt,
        characters: p.characters.map((c) => c.character),
        user: {
          pseudo: p.creatorRole.userProfile.pseudo,
          avatarUrl: clerkUser?.imageUrl ?? null,
          clerkUsername: clerkUser?.username ?? clerkUser?.firstName ?? "Anonyme",
        },
      };
    }),
  );
}
