// Liens audio / vidéo : plateforme, URL d'intégration (iframe) et miniature.

export type SoundPlatform = "youtube" | "soundcloud" | "spotify" | "other";

export const PLATFORM_STYLE: Record<
  SoundPlatform,
  { label: string; bg: string; fg: string }
> = {
  youtube: { label: "YouTube", bg: "#FF0033", fg: "#FFFFFF" },
  soundcloud: { label: "SoundCloud", bg: "#FF5500", fg: "#FFFFFF" },
  spotify: { label: "Spotify", bg: "#1DB954", fg: "#0E0F12" },
  other: { label: "Lien", bg: "#3A3E47", fg: "#ECECEE" },
};

const safeUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/** Le champ `platform` saisi en admin prime ; sinon on devine depuis l'URL. */
export function detectSoundPlatform(
  url: string,
  platform?: string | null,
): SoundPlatform {
  const p = platform?.toLowerCase().replace(/\s/g, "");
  if (p === "youtube" || p === "soundcloud" || p === "spotify") return p;
  const host = safeUrl(url)?.hostname ?? "";
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("soundcloud.com")) return "soundcloud";
  if (host.includes("spotify.com")) return "spotify";
  return "other";
}

export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = safeUrl(url);
  if (!u) return null;
  if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (!u.hostname.includes("youtube.com")) return null;
  const v = u.searchParams.get("v");
  if (v) return v;
  const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
  return m?.[1] ?? null;
}

function youtubePlaylistId(url: string): string | null {
  return safeUrl(url)?.searchParams.get("list") ?? null;
}

export type SoundEmbed = { src: string; height: number | "video" };

/** Renvoie l'iframe à afficher pour un son, ou null si la plateforme n'est pas intégrable. */
export function soundEmbed(url: string, platform: SoundPlatform): SoundEmbed | null {
  if (platform === "youtube") {
    const id = youtubeVideoId(url);
    if (id)
      return { src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, height: "video" };
    const list = youtubePlaylistId(url);
    if (list)
      return { src: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}&autoplay=1`, height: "video" };
    return null;
  }
  if (platform === "soundcloud") {
    return {
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&visual=false&color=%232f6feb`,
      height: 166,
    };
  }
  if (platform === "spotify") {
    const m = safeUrl(url)?.pathname.match(
      /(?:\/intl-[a-z]+)?\/(track|album|playlist|episode|artist)\/([A-Za-z0-9]+)/,
    );
    if (!m) return null;
    return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?autoplay=1`, height: 152 };
  }
  return null;
}

export function youtubeThumbnail(url: string | null | undefined): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
