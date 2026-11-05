import "server-only";

// Cache en mémoire du token App Access — évite de régénérer un token à
// chaque requête (limite de rate Twitch). Un token client_credentials
// est valide plusieurs semaines.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string> {
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

export type TwitchUser = {
  login: string;
  profile_image_url: string | null;
};

export async function twitchHelixGet<T>(
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

/** Avatar de profil Twitch d'un pseudo, ou null si introuvable. */
export async function getTwitchAvatar(login: string): Promise<string | null> {
  const { data } = await twitchHelixGet<TwitchUser>("users", [login]);
  return data?.[0]?.profile_image_url || null;
}
