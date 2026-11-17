import { prisma } from "@/lib/db";
import { kickPublicGet, type KickChannel } from "@/lib/kick";
import { detectStreamPlatform, extractStreamUsername } from "@/lib/utils";
import { NextResponse } from "next/server";

export type KickLiveStatus = {
  username: string;
  isLive: boolean;
  viewerCount: number;
  gameName: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
};

function extractKickUsername(url: string | null | undefined) {
  return detectStreamPlatform(url) === "kick"
    ? extractStreamUsername(url)
    : null;
}

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { badges: { has: "streamer" } },
      select: { chaines: true },
    });

    const slugs = Array.from(
      new Set(
        players
          .flatMap((p) => p.chaines)
          .map((url) => extractKickUsername(url))
          .filter((s): s is string => !!s),
      ),
    );

    if (slugs.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Limite de chaînes par requête non confirmée pour l'API Kick — on
    // chunk par 50 par précaution (contre 100 chez Twitch).
    const chunks: string[][] = [];
    for (let i = 0; i < slugs.length; i += 50) {
      chunks.push(slugs.slice(i, i + 50));
    }

    const channelBySlug = new Map<string, KickChannel>();
    for (const chunk of chunks) {
      const channels = await kickPublicGet<KickChannel>(
        "channels",
        "slug",
        chunk,
      );
      for (const channel of channels) {
        if (channel?.slug) {
          channelBySlug.set(channel.slug.toLowerCase(), channel);
        }
      }
    }

    const result: KickLiveStatus[] = slugs.map((username) => {
      const channel = channelBySlug.get(username);
      const stream = channel?.stream;
      const thumbnail =
        typeof stream?.thumbnail === "string"
          ? stream.thumbnail
          : (stream?.thumbnail?.url ?? channel?.banner_picture ?? null);

      return {
        username,
        isLive: !!stream?.is_live,
        viewerCount: stream?.viewer_count ?? 0,
        gameName: channel?.category?.name ?? null,
        thumbnailUrl: thumbnail ?? null,
        avatarUrl: null,
      };
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/kick-live]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
