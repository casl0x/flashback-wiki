import { KickIcon, TwitchIcon } from "@/app/_composents/icons/PlatformIcons";
import type { PlayerListItem } from "@/lib/player-page";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { LiveStatus } from "./useLiveStatus";

export type LivePlayer = {
  player: PlayerListItem;
  status: LiveStatus;
};

export default function LiveSection({ lives }: { lives: LivePlayer[] }) {
  if (lives.length === 0) return null;

  const sorted = [...lives].sort(
    (a, b) => b.status.viewerCount - a.status.viewerCount,
  );

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
        {sorted.map(({ player, status }) => {
          const PlatformIcon = player.platform === "kick" ? KickIcon : TwitchIcon;
          return (
            <Link
              key={player.id}
              href={`/joueurs/${player.id}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[#E5484D]/40 bg-[#15171B] hover:border-[#E5484D]/70"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-[#22252B]">
                {status.thumbnailUrl && (
                  <Image
                    src={status.thumbnailUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 260px"
                    className="object-cover"
                  />
                )}
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#E5484D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  EN LIVE
                </span>
                <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <PlatformIcon className="h-3 w-3 flex-none" />
                  {status.viewerCount.toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 p-3">
                <span className="truncate text-[14px] font-semibold text-[#ECECEE]">
                  {player.pseudo}
                </span>
                <span className="truncate text-[12px] text-[#A3A8B3]">
                  {status.gameName ?? "En direct"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
