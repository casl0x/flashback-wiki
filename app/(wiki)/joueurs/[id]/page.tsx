import PlayerPage from "@/app/_composents/players/PlayerPage";
import { getPlayerPage } from "@/lib/player-page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPlayerPage(id);
  if (!p) return { title: "Joueur introuvable – Flashback Wiki" };
  return { title: `${p.pseudo} – Flashback Wiki` };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const player = await getPlayerPage(id);
  if (!player) notFound();
  return <PlayerPage p={player} />;
}
