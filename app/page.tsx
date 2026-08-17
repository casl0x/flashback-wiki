import WikiLayout from "@/components/wiki/WikiLayout";
import { getWikiData } from "@/lib/wiki-data";
import TopPages from "@/components/wiki/TopPages";
import {
  BookOpen,
  Clapperboard,
  Lightbulb,
  Music,
  Palette,
} from "lucide-react";

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
      <section className="space-y-4 p-4 lg:p-5">
        <div className="space-y-6 rounded-xl border border-border bg-card p-5 lg:p-8">
          {/* ... ton contenu existant ... */}
        </div>
      </section>

      {/* 👇 Nouveau bloc top personnages */}
      <section className="space-y-4 p-4 lg:p-5">
        <TopPages
          pathPrefix="/personnages"
          title="Personnages les plus consultés"
          limit={5}
          since="30d"
        />
      </section>

      <section className="space-y-4 p-4 lg:p-5">
        <div className="space-y-2 rounded-xl border border-border bg-card p-5 lg:p-8">
          <p className="font-medium text-muted-foreground bold">Sources :</p>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>discord et Instagram pour les images</li>
            <li>stream, best-of et discord divers pour les infos globales</li>
          </ul>
        </div>
      </section>
    </WikiLayout>
  );
}