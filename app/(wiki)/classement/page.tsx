import { BADGES_CONFIG } from "@/app/_composents/user/badges";
import { anton } from "@/lib/fonts";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/public-profile";
import { cn, profileHref } from "@/lib/utils";
import { User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Classement des contributeurs – Flashback Wiki",
  description:
    "Les membres qui font vivre le wiki : propositions validées et points.",
};

/** Palier le plus élevé atteint, d'après les badges de contribution. */
const TIERS = [
  { key: "legend", label: "Légende", color: "#F6C453" },
  { key: "expert", label: "Expert", color: "#34D399" },
  { key: "contributor", label: "Contributeur", color: "#9D93F5" },
  { key: "first-step", label: "Débutant", color: "#F59E0B" },
] as const;

function tierOf(badges: string[]) {
  return TIERS.find((t) => badges.includes(t.key)) ?? null;
}

const PODIUM = {
  1: { ring: "from-[#F6C453] to-[#E8590C]", box: "border-[#5A4716] bg-[#1C170B] text-[#F6C453]", h: "pt-20" },
  2: { ring: "from-[#C9CCD3] to-[#6E7380]", box: "border-[#3A3E47] bg-[#16181C] text-[#D5D7DD]", h: "pt-14" },
  3: { ring: "from-[#D08A4E] to-[#7A4A22]", box: "border-[#4A3320] bg-[#1A1410] text-[#D08A4E]", h: "pt-8" },
} as const;

function Avatar({ e, size }: { e: LeaderboardEntry; size: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center overflow-hidden rounded-full bg-[#22252B]"
      style={{ width: size, height: size }}
    >
      {e.avatarUrl ? (
        <Image
          src={e.avatarUrl}
          width={size}
          height={size}
          alt=""
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <User className="h-1/2 w-1/2 text-[#9AA0AA]" />
      )}
    </span>
  );
}

function TierTag({ badges }: { badges: string[] }) {
  const tier = tierOf(badges);
  if (!tier) return null;
  return (
    <span
      className="text-[11px] font-bold uppercase tracking-widest"
      style={{ color: tier.color }}
    >
      {tier.label}
    </span>
  );
}

function PodiumSpot({ e }: { e: LeaderboardEntry }) {
  const s = PODIUM[e.rank as 1 | 2 | 3];
  const size = e.rank === 1 ? 112 : 88;
  return (
    <Link
      href={profileHref(e.pseudo)}
      className={cn(
        "group flex min-w-0 flex-1 flex-col items-center gap-2",
        e.rank === 1 ? "order-2" : e.rank === 2 ? "order-1" : "order-3",
      )}
    >
      <span
        className={cn("rounded-full bg-gradient-to-br p-1", s.ring)}
        style={{ width: size + 8, height: size + 8 }}
      >
        <Avatar e={e} size={size} />
      </span>
      <span
        className={cn(
          anton.className,
          "max-w-full truncate text-[clamp(20px,3.5vw,34px)] leading-none text-[#ECECEE] group-hover:underline",
        )}
      >
        {e.pseudo}
      </span>
      <TierTag badges={e.badges} />
      <div
        className={cn(
          "mt-1 flex w-full flex-col items-center gap-1 rounded-t-xl border px-2 pb-4",
          s.box,
          s.h,
        )}
      >
        <span className="text-[13px] font-extrabold">#{e.rank}</span>
        <span className={cn(anton.className, "text-[clamp(26px,5vw,48px)] leading-none")}>
          {e.points}
        </span>
        <span className="text-[12px] text-[#9AA0AA]">points</span>
      </div>
    </Link>
  );
}

function Row({ e }: { e: LeaderboardEntry }) {
  const badges = BADGES_CONFIG.filter((b) => e.badges.includes(b.key));
  return (
    <li>
      <Link
        href={profileHref(e.pseudo)}
        className="flex items-center gap-3 rounded-xl border border-[#23262D] bg-[#15171B] px-3 py-3 hover:border-[#3A3E47] sm:gap-4 sm:px-4"
      >
        <span className="w-8 flex-none text-center text-[15px] font-bold text-[#9AA0AA]">
          {e.rank}
        </span>
        <Avatar e={e} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 text-[16px] font-semibold text-[#ECECEE]">
            <span className="truncate">{e.pseudo}</span>
            {badges.map((b) => (
              <span key={b.key} title={`${b.label} – ${b.description}`} className="text-[14px]">
                {b.icon}
              </span>
            ))}
          </span>
          <TierTag badges={e.badges} />
        </div>
        {/* Compteur d'ajouts validés en pause : il ne compte pas encore les contributions Discord. */}
        {e.creations > 0 && (
          <span className="hidden text-[12px] text-[#9AA0AA] sm:block">
            {e.creations} créations
          </span>
        )}
        <div className="flex w-20 flex-none flex-col items-end">
          <span className={cn(anton.className, "text-[24px] leading-none text-[#ECECEE]")}>
            {e.points}
          </span>
          <span className="text-[12px] text-[#9AA0AA]">points</span>
        </div>
      </Link>
    </li>
  );
}

export default async function ClassementPage() {
  const entries = await getLeaderboard();
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <main className="mx-auto flex max-w-225 flex-col gap-8 px-4 py-10 sm:px-5">
        <header className="flex flex-col gap-2">
          <h1
            className={cn(
              anton.className,
              "m-0 text-[clamp(40px,6vw,64px)] uppercase leading-[0.95]",
            )}
          >
            Classement
          </h1>
          <p className="m-0 text-[#A3A8B3]">
            Les membres qui font vivre le wiki. Chaque proposition validée
            rapporte 10 points.
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-[#3A3E47] px-5 py-10 text-center text-[#9AA0AA]">
            Personne n&apos;est encore classé. Propose un ajout sur une fiche
            pour ouvrir le bal !
          </p>
        ) : (
          <>
            <section aria-label="Podium" className="flex items-end gap-3 sm:gap-6">
              {podium.map((e) => (
                <PodiumSpot key={e.pseudo} e={e} />
              ))}
            </section>

            {rest.length > 0 && (
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {rest.map((e) => (
                  <Row key={e.pseudo} e={e} />
                ))}
              </ol>
            )}
          </>
        )}
      </main>
    </div>
  );
}
