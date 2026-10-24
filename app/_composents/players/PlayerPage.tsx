import type { PlayerPageData } from "@/lib/player-page";
import PlayerHero from "./PlayerHero";
import PlayerVersionRows from "./PlayerVersionRows";

export default function PlayerPage({ p }: { p: PlayerPageData }) {
  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <PlayerHero p={p} />

      <main className="mx-auto flex max-w-295 flex-col gap-8 px-4 pb-16 pt-8 sm:px-5">
        {p.rows.length === 0 ? (
          <p className="m-0 rounded-xl border border-dashed border-[#3A3E47] p-8 text-center text-[#9AA0AA]">
            Ce joueur n’a pas encore de personnage.
          </p>
        ) : (
          <PlayerVersionRows rows={p.rows} />
        )}
      </main>
    </div>
  );
}
