import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export type KickLiveStatus = {
  username: string;
  isLive: boolean;
  viewerCount: number;
  gameName: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
};

// Cache en mémoire du token App Access Kick (client_credentials), même
// principe que pour Twitch.
let cachedToken: { value: string; expiresAt: number } | null = null;

function extractKickUsername(url: string | null | undefined) {
  if (!url) return null;
  const username = url.split("kick.com/")[1]?.split("/")[0]?.split("?")[0];
  return username?.trim().toLowerCase() || null;
}

async function getAppAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("KICK_CLIENT_ID / KICK_CLIENT_SECRET manquants");
  }

  const res = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Kick token error (${res.status})`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

type KickChannel = {
  slug: string;
  stream?: {
    is_live?: boolean;
    viewer_count?: number;
    thumbnail?: string | { url?: string } | null;
  } | null;
  category?: { name?: string } | null;
  banner_picture?: string | null;
};

async function fetchChannels(
  slugs: string[],
  retry = true,
): Promise<KickChannel[]> {
  const token = await getAppAccessToken();

  const params = new URLSearchParams();
  slugs.forEach((s) => params.append("slug", s));

  const res = await fetch(
    `https://api.kick.com/public/v1/channels?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (res.status === 401 && retry) {
    cachedToken = null;
    return fetchChannels(slugs, false);
  }

  if (!res.ok) {
    throw new Error(`Kick channels error (${res.status})`);
  }

  const json = await res.json();
  // La forme exacte de la réponse (wrapping dans "data" ou tableau brut)
  // n'a pas pu être vérifiée en direct au moment de l'implémentation —
  // on gère les deux cas défensivement.
  return Array.isArray(json) ? json : (json.data ?? []);
}

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { badges: { has: "streamer" } },
      select: { reseaux: true },
    });

    const slugs = Array.from(
      new Set(
        players
          .map((p) => {
            const reseaux = p.reseaux;
            const kickUrl =
              reseaux && typeof reseaux === "object" && !Array.isArray(reseaux)
                ? (reseaux as Record<string, unknown>).kick
                : null;
            return extractKickUsername(
              typeof kickUrl === "string" ? kickUrl : null,
            );
          })
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
      const channels = await fetchChannels(chunk);
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
