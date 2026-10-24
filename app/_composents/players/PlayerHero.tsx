"use client";

import { PlayerBadges } from "@/app/_composents/admin/PlayerBadges";
import { textOn } from "@/app/_composents/characters/CharacterHero";
import { anton } from "@/lib/fonts";
import {
  cloudinaryUrl,
  initials,
  type PlayerPageData,
} from "@/lib/player-page";
import { RESEAUX_OPTIONS } from "@/lib/reseaux";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { CSSProperties } from "react";
import { liveStatusFor, useLiveStatus } from "./useLiveStatus";

const PLATFORM = {
  twitch: { label: "Twitch", color: "#9146FF" },
  kick: { label: "Kick", color: "#53FC18" },
} as const;

export default function PlayerHero({ p }: { p: PlayerPageData }) {
  const { twitch, kick } = useLiveStatus();
  const status = liveStatusFor(p.platform, p.username, twitch, kick);
  const isLive = !!status?.isLive;
  const stream = p.platform ? PLATFORM[p.platform] : null;
  const lineColor = isLive ? "#E5484D" : (stream?.color ?? "#3A3E47");
  const ringColor = stream?.color ?? "#4A4E58";
  const streamerActive = !isLive && p.badges.includes("streamer");
  const badgesWithoutStreamer = p.badges.filter((b) => b !== "streamer");

  const links = [
    ...(p.lienChaine
      ? [
          {
            href: p.lienChaine,
            label: stream?.label ?? "Chaîne",
            color: stream?.color ?? null,
          },
        ]
      : []),
    ...RESEAUX_OPTIONS.filter((r) => p.reseaux[r.key]).map((r) => ({
      href: p.reseaux[r.key],
      label: r.label,
      color: null as string | null,
    })),
  ];

  return (
    <>
      <section
        aria-label="Bannière du joueur"
        className="relative h-55 overflow-hidden bg-[#15171B] sm:h-85"
      >
        {isLive && status ? (
          <>
            {status.thumbnailUrl && (
              <Image
                src={status.thumbnailUrl}
                alt=""
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-[#0E0F12] via-[#0E0F12]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 px-4 pb-6 sm:px-5">
              <div className="flex flex-col gap-1">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#E5484D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  EN LIVE
                </span>
                <span className="text-[14px] font-semibold text-[#ECECEE]">
                  {stream ? `sur ${stream.label}` : "En direct"} ·{" "}
                  {status.viewerCount.toLocaleString("fr-FR")} spectateurs
                </span>
                {status.gameName && (
                  <span className="text-[13px] text-[#C4C7CF]">
                    {status.gameName}
                  </span>
                )}
              </div>
              <a
                href={p.lienChaine!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-md px-4 text-[14px] font-bold"
                style={{
                  background: stream?.color ?? "#E5484D",
                  color: "#0E0F12",
                }}
              >
                Regarder sur {stream?.label ?? "la chaîne"} ↗
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-full" aria-hidden>
              {p.bannerCharacters.length === 0 ? (
                <div className="flex-1 bg-[repeating-linear-gradient(135deg,#1A1C21_0px,#1A1C21_14px,#17191D_14px,#17191D_28px)]" />
              ) : (
                p.bannerCharacters.map((c) => (
                  <span
                    key={c.id}
                    className="relative flex-1 overflow-hidden bg-[#22252B]"
                  >
                    {c.imageUrl && (
                      <Image
                        src={cloudinaryUrl(
                          c.imageUrl,
                          "w_400,h_700,c_fill,g_face",
                        )}
                        alt=""
                        fill
                        unoptimized
                        sizes="200px"
                        className={cn(
                          "object-cover",
                          c.etatVie === "MORT" && "grayscale",
                        )}
                      />
                    )}
                    {c.version && (
                      <span
                        className="absolute left-1 top-1 rounded-[3px] bg-[#0E0F12]/80 px-1.5 py-0.5 text-[11px] font-bold"
                        style={{ color: c.version.color }}
                      >
                        {c.version.id}
                      </span>
                    )}
                  </span>
                ))
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-[#0E0F12] to-transparent" />
          </>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: lineColor }}
        />
      </section>

      <div className="mx-auto max-w-295 px-4 sm:px-5">
        <div className="-mt-16 flex flex-col gap-3 sm:-mt-20">
          <span
            className="relative flex h-33 w-33 flex-none items-center justify-center overflow-hidden rounded-full border-4 border-[#0E0F12] bg-[#2B2E35] text-[34px] font-bold text-[#ECECEE] ring-3"
            style={{ "--tw-ring-color": ringColor } as CSSProperties}
          >
            {isLive && status?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={status.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{initials(p.pseudo)}</span>
            )}
          </span>

          {(isLive || streamerActive) && (
            <p
              className={cn(
                "m-0 text-[14px] font-semibold",
                isLive ? "text-[#FF8A8E]" : "text-[#6EE7A0]",
              )}
            >
              <span aria-hidden>●</span>{" "}
              {isLive ? "En live maintenant" : "Streameur actif"}
            </p>
          )}

          <h1
            className={cn(
              anton.className,
              "m-0 text-[clamp(56px,10vw,92px)] uppercase leading-[0.95] text-[#ECECEE]",
            )}
          >
            {p.pseudo}
          </h1>

          <div className="flex gap-7">
            <div className="flex flex-col">
              <span
                className={cn(
                  anton.className,
                  "text-[36px] leading-none text-[#ECECEE]",
                )}
              >
                {p.characterCount}
              </span>
              <span className="text-[12px] uppercase tracking-widest text-[#9AA0AA]">
                Persos
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  anton.className,
                  "text-[36px] leading-none text-[#ECECEE]",
                )}
              >
                {p.versionCount}
              </span>
              <span className="text-[12px] uppercase tracking-widest text-[#9AA0AA]">
                Versions
              </span>
            </div>
          </div>

          {badgesWithoutStreamer.length > 0 && (
            <PlayerBadges badges={badgesWithoutStreamer} size="md" />
          )}

          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-3.5 text-[14px] font-semibold",
                    i === 0 && l.color
                      ? ""
                      : "bg-[#22252B] text-[#ECECEE] hover:bg-[#2B2E35]",
                  )}
                  style={
                    i === 0 && l.color
                      ? { background: l.color, color: textOn(l.color) }
                      : undefined
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
