import { PlayerBadges } from "@/components/admin/PlayerBadges";
import type { CharacterPageData } from "@/lib/character-page";
import { cloudinaryUrl, initials } from "@/lib/character-page";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { textOn } from "./CharacterHero";

const PLATFORM = {
  twitch: { label: "Twitch", color: "#9146FF" },
  kick: { label: "Kick", color: "#53FC18" },
} as const;

// Clés du JSON `reseaux` (voir RESEAUX_OPTIONS dans l'admin joueurs).
const RESEAUX: { key: string; label: string }[] = [
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X" },
];

type Player = NonNullable<CharacterPageData["player"]>;

export function PlayerPanel({ player }: { player: Player }) {
  const stream = player.platform ? PLATFORM[player.platform] : null;
  const band = stream?.color ?? "#2F6FEB";
  const streamer = player.badges.includes("streamer");
  const otherBadges = player.badges.filter((b) => b !== "streamer");
  const links = [
    ...(player.lienChaine
      ? [{ href: player.lienChaine, label: stream?.label ?? "Chaîne" }]
      : []),
    ...RESEAUX.filter((r) => player.reseaux[r.key]).map((r) => ({
      href: player.reseaux[r.key],
      label: r.label,
    })),
  ];

  return (
    <section
      aria-labelledby="player-h"
      className="overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B]"
    >
      <div className="h-16" style={{ background: band }} />
      <div className="flex flex-col gap-3 px-5 pb-5">
        <span
          aria-hidden
          className="-mt-7.5 flex h-15 w-15 items-center justify-center rounded-full border-[3px] border-[#15171B] bg-[#2B2F37] font-bold text-[#ECECEE]"
        >
          {initials(player.pseudo)}
        </span>
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#A3A8B3]">
            Joué par
          </span>
          <h2
            id="player-h"
            className="m-0 mt-0.5 text-[24px] font-bold text-[#ECECEE]"
          >
            {player.pseudo}
          </h2>
          <p className="m-0 mt-0.5 text-[14px] text-[#A3A8B3]">
            {player.totalCharacters} personnage
            {player.totalCharacters > 1 ? "s" : ""}
            {streamer && (
              <span className="text-[#6EE7A0]"> · ● Streamer actif</span>
            )}
          </p>
          {otherBadges.length > 0 && (
            <div className="mt-2">
              <PlayerBadges badges={otherBadges} size="md" />
            </div>
          )}
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.75 text-[13px] font-semibold",
                  i === 0 && stream
                    ? ""
                    : "bg-[#22252B] text-[#ECECEE] hover:bg-[#2B2E35]",
                )}
                style={
                  i === 0 && stream
                    ? { background: stream.color, color: textOn(stream.color) }
                    : undefined
                }
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function OtherCharacters({ player }: { player: Player }) {
  if (player.others.length === 0) return null;
  return (
    <section aria-labelledby="others-h" className="flex flex-col gap-3">
      <h2
        id="others-h"
        className="m-0 text-[12px] font-bold uppercase tracking-[0.12em] text-[#A3A8B3]"
      >
        Autres personnages de {player.pseudo}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {player.others.map((o) => (
          <Link
            key={o.id}
            href={`/personnages/${o.id}`}
            className="flex flex-col overflow-hidden rounded-lg border border-[#23262D] bg-[#15171B] hover:border-[#3A3E47]"
          >
            <span className="relative flex h-24 items-start justify-end bg-[#22252B] p-1.5">
              {o.imageUrl && (
                <Image
                  src={cloudinaryUrl(o.imageUrl, "w_320,h_200,c_fill,g_face")}
                  alt=""
                  fill
                  unoptimized
                  sizes="160px"
                  className={cn(
                    "object-cover",
                    o.etatVie === "MORT" && "grayscale",
                  )}
                />
              )}
              {o.version && (
                <span
                  className="relative rounded-[3px] bg-[#0E0F12] px-1.5 py-0.5 text-[11px] font-bold"
                  style={{ color: o.version.color }}
                >
                  {o.version.id}
                </span>
              )}
            </span>
            <span className="flex flex-col px-2.5 py-2">
              <span className="text-[13px] font-semibold leading-tight text-[#ECECEE]">
                {o.nom}
              </span>
              {o.job && (
                <span className="text-[12px] text-[#A3A8B3]">{o.job}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
