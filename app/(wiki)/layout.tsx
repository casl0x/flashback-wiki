import WikiLayout from "@/components/wiki/WikiLayout";
import { getWikiData } from "@/lib/wiki-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flashback WL — Wiki",
  description: "Répertoire des personnages du serveur RP Flashback WL",
};

export default async function WikiRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { versions, players, characters, counts } = await getWikiData();

  const totalRels = characters.reduce(
    (acc, character) => acc + (character.relations?.length || 0),
    0,
  );

  return (
    <WikiLayout
      totalChars={characters.length}
      totalPlayers={players.length}
      totalVersions={versions.length}
      versions={versions}
      counts={counts}
      totalRels={totalRels}
    >
      {children}
    </WikiLayout>
  );
}