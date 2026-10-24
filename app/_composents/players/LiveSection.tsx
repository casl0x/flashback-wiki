import { KickIcon, TwitchIcon } from "@/app/_composents/icons/PlatformIcons";
import type { PlayerListItem } from "@/lib/player-page";
import { initials } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { LiveStatus } from "./useLiveStatus";

export type LivePlayer = {
  player: PlayerListItem;
  status: LiveStatus;
};

const PLATFORM = {
  twitch: { label: "Twitch", color: "#9146FF" },
  kick: { label: "Kick", color: "#53FC18" },
} as const;

function channelUrl(player: PlayerListItem, username: string): string {
  return player.platform === "kick"
    ? `https://kick.com/${username}`
    : `https://twitch.tv/${username}`;
}

export default function LiveSection({ lives }: { lives: LivePlayer[] }) {
  if (lives.length === 0) return null;

  const sorted = [...lives].sort(
    (a, b) => b.status.viewerCount - a.status.viewerCount,
  );
  const [featured, ...others] = sorted;
  const featuredPlatform = PLATFORM[featured.player.platform ?? "twitch"];

  return (
    <section aria-labelledby="live-h" className="flex flex-col gap-3.5">
      <h2
        id="live-h"
        className={cn(
          anton.className,
          "m-0 text-[22px] font-normal uppercase tracking-[0.02em] text-[#ECECEE] sm:text-[26px]",
        )}
      >
        En live sur Flashback
      </h2>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-[999_1_480px] overflow-hidden rounded-[10px] border border-[#E5484D]/40 bg-[#15171B]">
          <div className="relative aspect-video w-full overflow-hidden bg-[#22252B]">
            {featured.status.thumbnailUrl && (
              <Image
                src={featured.status.thumbnailUrl}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-cover"
              />
            )}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#E5484D] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              EN LIVE
            </span>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[12px] font-semibold text-white">
              {featured.status.viewerCount.toLocaleString("fr-FR")} spectateurs
              · {featuredPlatform.label}
            </span>
          </div>
          <div className="flex items-center gap-3.5 p-4">
            <span className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-[#2B2E35] font-bold text-[#ECECEE] ring-3 ring-[#E5484D]">
              {featured.status.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.status.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(featured.player.pseudo)
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[18px] font-bold text-[#ECECEE]">
                {featured.player.pseudo}
              </span>
              <span className="truncate text-[14px] text-[#A3A8B3]">
                {featured.status.gameName ?? "En direct"}
              </span>
            </span>
            <span className="ml-auto flex flex-none flex-col items-end gap-1">
              <a
                href={channelUrl(featured.player, featured.player.username!)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-bold"
                style={{ background: featuredPlatform.color, color: "#0E0F12" }}
              >
                Regarder ↗
              </a>
              <Link
                href={`/joueurs/${featured.player.id}`}
                className="text-[12px] text-[#9AA0AA] hover:text-[#ECECEE]"
              >
                Voir la fiche
              </Link>
            </span>
          </div>
        </div>

        {others.length > 0 && (
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5">
            {others.map(({ player, status }) => {
              const PlatformIcon = player.platform === "kick" ? KickIcon : TwitchIcon;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2.5 rounded-lg border border-[#23262D] bg-[#15171B] p-2"
                >
                  <a
                    href={channelUrl(player, player.username!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <span className="relative h-18 w-32 flex-none overflow-hidden rounded-md bg-[#22252B]">
                      {status.thumbnailUrl && (
                        <Image
                          src={status.thumbnailUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="128px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] font-semibold text-[#ECECEE]">
                        {player.pseudo}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-[#A3A8B3]">
                        <PlatformIcon className="h-3 w-3 flex-none" />
                        {status.viewerCount.toLocaleString("fr-FR")} spectateurs
                      </span>
                    </span>
                  </a>
                  <Link
                    href={`/joueurs/${player.id}`}
                    aria-label={`Voir la fiche de ${player.pseudo}`}
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-md text-[#9AA0AA] hover:text-[#ECECEE]"
                  >
                    →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
