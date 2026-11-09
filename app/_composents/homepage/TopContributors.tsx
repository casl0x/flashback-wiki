import { getLeaderboard, type LeaderboardEntry } from "@/lib/public-profile";
import { cn, profileHref } from "@/lib/utils";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const RANK_COLOR = ["#F6C453", "#C9CCD3", "#D08A4E"] as const;

function Card({ e }: { e: LeaderboardEntry }) {
  return (
    <Link
      href={profileHref(e.pseudo)}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-border-mid"
    >
      <span
        className="w-8 flex-none text-center text-4xl font-bold leading-none"
        style={{ color: RANK_COLOR[e.rank - 1] }}
      >
        {e.rank}
      </span>
      <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-muted">
        {e.avatarUrl ? (
          <Image
            src={e.avatarUrl}
            width={48}
            height={48}
            alt=""
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-bold">{e.pseudo}</span>
        <span className="text-sm text-muted-foreground">{e.points} points</span>
      </span>
    </Link>
  );
}

/** Podium du classement pour l'accueil. N'affiche rien s'il est vide ou indisponible. */
export default async function TopContributors() {
  let top: LeaderboardEntry[] = [];
  try {
    top = (await getLeaderboard()).slice(0, 3);
  } catch {
    return null;
  }
  if (top.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 p-4 lg:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-3xl uppercase font-sans">Top contributeurs</h2>
        <Link
          href="/classement"
          className={cn(
            "text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
          )}
        >
          Voir le classement →
        </Link>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-3">
        {top.map((e) => (
          <Card key={e.pseudo} e={e} />
        ))}
      </div>
    </section>
  );
}
