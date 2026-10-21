import TopPages from "@/components/wiki/TopPages";
import WikiLayout from "@/components/wiki/WikiLayout";
import { getWikiData } from "@/lib/wiki-data";
import { Button } from "@base-ui/react";

export default async function HomePage() {
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center height-160px background: linear-gradient(to top, #0E0F12 10%, rgba(14,15,18,0));"></div>
        <Button className="absolute inset-0 flex items-center justify-center">
          Commencer
        </Button>
      </section>
      {/* <section className="space-y-4 p-4 lg:p-5">
        <Poll />
      </section> */}
      <section className="space-y-4 p-4 lg:p-5">
        <TopPages
          title="Personnages les plus consultés"
          limit={5}
          since="30d"
        />
      </section>
    </WikiLayout>
  );
}
