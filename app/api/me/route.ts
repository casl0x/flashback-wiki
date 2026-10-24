import { prisma } from "@/lib/db";
import { versionRank } from "@/lib/version-rank";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const [profile, suggestions, suggestionStats] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      include: {
        player: { select: { id: true, pseudo: true } },
        playerLinkRequests: {
          where: { status: "pending" },
          include: { player: { select: { pseudo: true } } },
        },
        creatorRoles: {
          include: {
            socialLinks: true, // ← liens dans le rôle
            posts: {
              orderBy: { createdAt: "desc" },
              include: {
                characters: {
                  include: { character: { select: { id: true, nom: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.suggestion.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "desc" },
      include: { character: { select: { nom: true } } },
    }),
    prisma.suggestion.groupBy({
      by: ["status"],
      where: { clerkUserId: userId },
      _count: true,
    }),
  ]);

  const stats = {
    pending: suggestionStats.find((s) => s.status === "pending")?._count ?? 0,
    accepted: suggestionStats.find((s) => s.status === "accepted")?._count ?? 0,
    rejected: suggestionStats.find((s) => s.status === "rejected")?._count ?? 0,
  };

  const playerCharacters = profile?.playerId
    ? await prisma.character.findMany({
        where: { playerId: profile.playerId },
        orderBy: { nom: "asc" },
        select: {
          id: true,
          nom: true,
          imageUrl: true,
          etatVie: true,
          versions: { select: { id: true, color: true } },
        },
      })
    : [];

  return NextResponse.json({
    pseudo: user.username ?? user.firstName ?? "Anonyme",
    avatarUrl: user.imageUrl,
    provider: user.externalAccounts[0]?.provider ?? null,
    points: profile?.totalPoints ?? 0,
    badges: profile?.badges ?? [],
    stats,
    playerId: profile?.playerId ?? null,
    player: profile?.player ?? null,
    pendingLinkRequest: profile?.playerLinkRequests[0]
      ? { playerPseudo: profile.playerLinkRequests[0].player.pseudo }
      : null,
    playerCharacters: playerCharacters.map((c) => ({
      id: c.id,
      nom: c.nom,
      imageUrl: c.imageUrl,
      etatVie: c.etatVie,
      version: [...c.versions]
        .sort((a, b) => versionRank(a.id) - versionRank(b.id))
        .at(-1) ?? null,
    })),
    suggestions: suggestions.map((s) => ({
      id: s.id,
      nom: s.character?.nom ?? s.nom ?? "Personnage",
      createdAt: s.createdAt,
      status: s.status,
      rejectReason: s.rejectReason,
      moderatorMessage: s.moderatorMessage,
    })),
    creatorRoles:
      profile?.creatorRoles.map((r) => ({
        type: r.type,
        displayOnWiki: r.displayOnWiki,
        status: r.status,
        bio: r.bio,
        socialLinks: r.socialLinks.map((l) => ({
          platform: l.platform,
          url: l.url,
        })),
        posts: r.posts.map((p) => ({
          id: p.id,
          status: p.status,
          imageUrl: p.imageUrl,
          linkUrl: p.linkUrl,
          platform: p.platform,
          caption: p.caption,
          createdAt: p.createdAt,
          characters: p.characters.map((c) => c.character),
        })),
      })) ?? [],
  });
}
