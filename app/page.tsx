import WikiLayout from "@/components/wiki/WikiLayout";
import { getWikiData } from "@/lib/wiki-data";
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
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">Wiki Flashback WL</p>
            </div>
          </div>

          <p className="border-l-2 border-border pl-4 text-sm leading-7 text-muted-foreground">
            Bienvenue sur le wiki{" "}
            <span className="font-bold">non officiel</span> de tous les
            personnages de Flashback WL !
          </p>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-s font-medium underline tracking-wide text-muted-foreground">
              Ce que tu peux retrouver ici :
            </p>
            {[
              {
                icon: Lightbulb,
                label:
                  "Tous les personnages qui ont été joués sur le serveur ainsi que leurs joueurs.  ",
              },
              {
                icon: Music,
                label:
                  "Des playlists avec les sons des joueurs (en lien avec leurs personnages bien sûr)",
              },
              {
                icon: Clapperboard,
                label:
                  "Pour certains personnages, retrouve aussi les playlists de rediffusion pour voir ou revoir leurs aventures.",
              },
              {
                icon: Palette,
                label: "Ainsi que les créations de la communauté Flashback.",
              },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="pt-1 text-sm leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
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
