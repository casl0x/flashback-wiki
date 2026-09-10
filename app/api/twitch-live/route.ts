import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export type TwitchLiveStatus = {
  username: string;
  isLive: boolean;
  viewerCount: number;
  gameName: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
};

// Cache en mémoire du token App Access — évite de régénérer un token à
// chaque requête (limite de rate Twitch). Un token client_credentials
// est valide plusieurs semaines.
let cachedToken: { value: string; expiresAt: number } | null = null;

function extractTwitchUsername(url: string | null | undefined) {
  if (!url) return null;
  const username = url.split("twitch.tv/")[1]?.split("/")[0]?.split("?")[0];
  return username?.trim().toLowerCase() || null;
}

async function getAppAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET manquants");
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Twitch token error (${res.status})`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    // On rafraîchit un peu avant l'expiration réelle
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

type TwitchStream = {
  user_login: string;
  viewer_count: number;
  game_name: string | null;
  thumbnail_url: string | null;
};

type TwitchUser = {
  login: string;
  profile_image_url: string | null;
};

async function twitchHelixGet<T>(
  endpoint: "streams" | "users",
  usernames: string[],
  retry = true,
): Promise<{ data?: T[] }> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const token = await getAppAccessToken();

  const paramName = endpoint === "streams" ? "user_login" : "login";
  const params = new URLSearchParams();
  usernames.forEach((u) => params.append(paramName, u));

  const res = await fetch(
    `https://api.twitch.tv/helix/${endpoint}?${params.toString()}`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (res.status === 401 && retry) {
    cachedToken = null;
    return twitchHelixGet<T>(endpoint, usernames, false);
  }

  if (!res.ok) {
    throw new Error(`Twitch ${endpoint} error (${res.status})`);
  }

  return res.json();
}

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { lienChaine: { not: null }, badges: { has: "streamer" } },
      select: { lienChaine: true },
    });

    const usernames = Array.from(
      new Set(
        players
          .map((p) => extractTwitchUsername(p.lienChaine))
          .filter((u): u is string => !!u),
      ),
    );

    if (usernames.length === 0) {
      return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
    }

    // L'API Helix accepte jusqu'à 100 user_login par requête
    const chunks: string[][] = [];
    for (let i = 0; i < usernames.length; i += 100) {
      chunks.push(usernames.slice(i, i + 100));
    }

    const liveByUsername = new Map<
      string,
      { viewerCount: number; gameName: string | null; thumbnailUrl: string | null }
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
