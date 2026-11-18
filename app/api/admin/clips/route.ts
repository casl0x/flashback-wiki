import { NotAdminError, requireAdmin } from "@/lib/admin/auth";
import { twitchHelix } from "@/lib/twitch";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HelixUser = { id: string; login: string; display_name: string };
type HelixClip = {
  id: string;
  url: string;
  title: string;
  view_count: number;
  duration: number;
  created_at: string;
  creator_name: string;
  broadcaster_id: string;
  broadcaster_name: string;
  game_id: string;
  thumbnail_url: string;
};
type HelixGame = { id: string; name: string };

export type AdminClip = Omit<HelixClip, "game_id"> & { game: string | null };

const LOGIN = /^[a-z0-9_]{1,25}$/;
const MAX_LOGINS = 25;
const MAX_PAGES = 5; // 100 clips par page

/** GET ?logins=a,b&from=ISO&to=ISO&pages=2 — admins uniquement. */
export async function GET(req: Request) {
  try {
    await requireAdmin("clips");
  } catch (e) {
    if (e instanceof NotAdminError) return NextResponse.json({ error: "Interdit" }, { status: 403 });
    throw e;
  }

  const sp = new URL(req.url).searchParams;
  const logins = Array.from(
    new Set((sp.get("logins") ?? "").toLowerCase().split(",").map((l) => l.trim()).filter((l) => LOGIN.test(l))),
  ).slice(0, MAX_LOGINS);
  if (logins.length === 0) return NextResponse.json({ clips: [], unknown: [] });

  const from = sp.get("from");
  const to = sp.get("to");
  const pages = Math.min(MAX_PAGES, Math.max(1, Number(sp.get("pages")) || 1));

  try {
    const users = new Map<string, HelixUser>();
    const up = new URLSearchParams();
    logins.forEach((l) => up.append("login", l));
    const { data: found } = await twitchHelix<HelixUser>("users", up);
    (found ?? []).forEach((u) => users.set(u.id, u));
    const unknown = logins.filter((l) => !(found ?? []).some((u) => u.login === l));

    const perChannel = await Promise.all(
      [...users.keys()].map(async (id) => {
        const out: HelixClip[] = [];
        let cursor: string | undefined;
        for (let i = 0; i < pages; i++) {
          const p = new URLSearchParams({ broadcaster_id: id, first: "100" });
          if (from) p.set("started_at", new Date(from).toISOString());
          if (to) p.set("ended_at", new Date(to).toISOString());
          if (cursor) p.set("after", cursor);
          const r = await twitchHelix<HelixClip>("clips", p);
          out.push(...(r.data ?? []));
          cursor = r.pagination?.cursor;
          if (!cursor) break;
        }
        return out;
      }),
    );
    const raw = perChannel.flat();

    const gameIds = [...new Set(raw.map((c) => c.game_id).filter(Boolean))];
    const games = new Map<string, string>();
    for (let i = 0; i < gameIds.length; i += 100) {
      const gp = new URLSearchParams();
      gameIds.slice(i, i + 100).forEach((g) => gp.append("id", g));
      const { data } = await twitchHelix<HelixGame>("games", gp);
      (data ?? []).forEach((g) => games.set(g.id, g.name));
    }

    const clips: AdminClip[] = raw.map(({ game_id, ...c }) => ({
      ...c,
      game: games.get(game_id) ?? null,
    }));
    return NextResponse.json({ clips, unknown });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur Twitch" }, { status: 502 });
  }
}
