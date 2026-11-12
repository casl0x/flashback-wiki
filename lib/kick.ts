import "server-only";

// Cache en mémoire du token App Access Kick (client_credentials), même
// principe que pour Twitch.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string> {
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

export type KickChannel = {
  slug: string;
  broadcaster_user_id?: number;
  stream?: {
    is_live?: boolean;
    viewer_count?: number;
    thumbnail?: string | { url?: string } | null;
  } | null;
  category?: { name?: string } | null;
  banner_picture?: string | null;
};

export type KickUser = {
  user_id?: number;
  profile_picture?: string | null;
};

/**
 * Requête authentifiée vers l'API publique Kick. La forme exacte de la
 * réponse (wrapping dans "data" ou tableau brut) n'a pas pu être vérifiée
 * en direct au moment de l'implémentation — on gère les deux cas
 * défensivement.
 */
export async function kickPublicGet<T>(
  path: "channels" | "users",
  paramName: "slug" | "id",
  values: (string | number)[],
  retry = true,
): Promise<T[]> {
  const token = await getAppAccessToken();

  const params = new URLSearchParams();
  values.forEach((v) => params.append(paramName, String(v)));

  const res = await fetch(
    `https://api.kick.com/public/v1/${path}?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (res.status === 401 && retry) {
    cachedToken = null;
    return kickPublicGet<T>(path, paramName, values, false);
  }

  if (!res.ok) {
    throw new Error(`Kick ${path} error (${res.status})`);
  }

  const json = await res.json();
  return Array.isArray(json) ? json : (json.data ?? []);
}

/**
 * Avatar de profil Kick d'un slug de chaîne, ou null si introuvable.
 * L'API publique Kick n'expose pas l'avatar sur /channels : il faut
 * d'abord récupérer le broadcaster_user_id du channel, puis interroger
 * /users avec cet id pour obtenir profile_picture.
 */
export async function getKickAvatar(slug: string): Promise<string | null> {
  const [channel] = await kickPublicGet<KickChannel>("channels", "slug", [
    slug,
  ]);
  const userId = channel?.broadcaster_user_id;
  if (!userId) return null;

  const [user] = await kickPublicGet<KickUser>("users", "id", [userId]);
  return user?.profile_picture || null;
}
