import WikiLayout from "@/components/wiki/WikiLayout";
import { getWikiData } from "@/lib/wiki-data";
import { BookOpen, Filter, PlayCircle, Search, User } from "lucide-react";

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
      <>
        <section className="space-y-4 p-4 lg:p-5">
          <div className="space-y-6 rounded-xl border border-border bg-card p-5 lg:p-8">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">Wiki Flashback WL</p>
                <p className="text-sm text-muted-foreground">
                  Fiches personnages · Joueurs · Versions
                </p>
              </div>
            </div>

            <p className="border-l-2 border-border pl-4 text-sm leading-7 text-muted-foreground">
              Bienvenue sur le wiki{" "}
              <span className="font-bold">non officiel</span> de tous les
              personnages de Flashback WL ! Tu peux parcourir les fiches
              personnages et retrouver leurs joueurs.
            </p>

            <div className="space-y-4 border-t border-border pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comment explorer
              </p>
              {[
                { icon: Search, label: "Recherche par nom, joueur ou métier" },
                {
                  icon: Filter,
                  label: "Choisis une version depuis la sidebar",
                },
                {
                  icon: User,
                  label:
                    "Ouvre une fiche détaillée en cliquant sur un personnage",
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

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
              <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pour certains personnages, retrouve aussi les playlists de
                rediffusion pour voir ou revoir leurs aventures.
              </p>
            </div>
          </div>
        </section>
      </>
    </WikiLayout>
  );
}
