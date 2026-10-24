import PlayersPageClient from "@/app/_composents/players/PlayersPageClient";
import { getPlayersList } from "@/lib/player-page";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Joueurs – Flashback Wiki",
};

export default async function JoueursPage() {
  const players = await getPlayersList();

  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <main className="mx-auto max-w-295 px-4 py-10 sm:px-5 sm:py-14">
        <PlayersPageClient players={players} />
      </main>
    </div>
  );
}
