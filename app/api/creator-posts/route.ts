import { prisma } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import { CreatorType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const typeParam = req.nextUrl.searchParams.get("type");
  const type =
    typeParam === "ARTISTE" || typeParam === "EDITEUR"
      ? (typeParam as CreatorType)
      : undefined;

  const posts = await prisma.creatorPost.findMany({
    where: { status: "approved", ...(type ? { type } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      creatorRole: { include: { userProfile: true } },
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
        imageUrl: p.imageUrl,
        linkUrl: p.linkUrl,
        platform: p.platform,
        caption: p.caption,
        createdAt: p.createdAt,
        creator: {
          pseudo:
            p.creatorRole.userProfile.pseudo ?? clerkUser?.username ?? "Anonyme",
          avatarUrl: clerkUser?.imageUrl ?? null,
        },
      };
    }),
  );
}
