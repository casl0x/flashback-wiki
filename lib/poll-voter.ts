import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const COOKIE = "poll_vid";

// Identifiant du votant : userId Clerk si connecté, sinon id anonyme stocké en cookie.
// `create` ne doit être true que dans un handler POST (écriture de cookie).
export async function getVoterId(create = false): Promise<string | null> {
  const { userId } = await auth();
  if (userId) return userId;

  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return `anon:${existing}`;
  if (!create) return null;

  const id = crypto.randomUUID();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return `anon:${id}`;
}
