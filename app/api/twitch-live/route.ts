import { prisma } from "@/lib/db";
import { twitchHelixGet, type TwitchUser } from "@/lib/twitch";
import { detectStreamPlatform, extractStreamUsername } from "@/lib/utils";
import { NextResponse } from "next/server";

export type TwitchLiveStatus = {
  username: string;
  isLive: boolean;
  viewerCount: number;
  gameName: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
};

function extractTwitchUsername(url: string | null | undefined) {
  return detectStreamPlatform(url) === "twitch"
    ? extractStreamUsername(url)
    : null;
}

type TwitchStream = {
  user_login: string;
  viewer_count: number;
  game_name: string | null;
  thumbnail_url: string | null;
};

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { badges: { has: "streamer" } },
      select: { chaines: true },
    });

    const usernames = Array.from(
      new Set(
        players
          .flatMap((p) => p.chaines)
          .map((url) => extractTwitchUsername(url))
          .filter((u): u is string => !!u),
      ),
    );

    if (usernames.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // L'API Helix accepte jusqu'à 100 user_login par requête
    const chunks: string[][] = [];
    for (let i = 0; i < usernames.length; i += 100) {
      chunks.push(usernames.slice(i, i + 100));
    }

    const liveByUsername = new Map<
      string,
      {
        viewerCount: number;
        gameName: string | null;
        thumbnailUrl: string | null;
      }
    >();
    const avatarByUsername = new Map<string, string | null>();

    for (const chunk of chunks) {
      const [streamsData, usersData] = await Promise.all([
        twitchHelixGet<TwitchStream>("streams", chunk),
        twitchHelixGet<TwitchUser>("users", chunk),
      ]);

      for (const stream of streamsData.data ?? []) {
        liveByUsername.set(stream.user_login.toLowerCase(), {
          viewerCount: stream.viewer_count,
          gameName: stream.game_name || null,
          thumbnailUrl:
            stream.thumbnail_url
              ?.replace("{width}", "320")
              .replace("{height}", "180") || null,
        });
      }

      for (const user of usersData.data ?? []) {
        avatarByUsername.set(
          user.login.toLowerCase(),
          user.profile_image_url || null,
        );
      }
    }

    const result: TwitchLiveStatus[] = usernames.map((username) => {
      const live = liveByUsername.get(username);
      return {
        username,
        isLive: !!live,
        viewerCount: live?.viewerCount ?? 0,
        gameName: live?.gameName ?? null,
        thumbnailUrl: live?.thumbnailUrl ?? null,
        avatarUrl: avatarByUsername.get(username) ?? null,
      };
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/twitch-live]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
