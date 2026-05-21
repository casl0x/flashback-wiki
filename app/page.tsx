import WikiLayout from "@/components/wiki/WikiLayout";
import { getWikiData } from "@/lib/wiki-data";
import {
  BookOpen,
  Filter,
  Music2,
  PlayCircle,
  Search,
  User,
} from "lucide-react";

export default async function HomePage() {
  const { versions, players, characters, counts } = await getWikiData();

  const totalRels = characters.reduce(
    (acc, c) => acc + (c.relations?.length || 0),
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
      <section className="p-4 lg:p-5 space-y-4">
        {/* Bloc d'explication */}
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
            Bienvenue sur le wiki de tous les personnages de Flashback WL ! Tu
            peux parcourir les fiches personnages, retrouver leurs joueurs et
            ouvrir les pages de versions depuis la sidebar.
          </p>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Comment explorer
            </p>
            {[
              { icon: Search, label: "Recherche par nom, joueur ou métier" },
              { icon: Filter, label: "Choisis une version depuis la sidebar" },
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

        {/* Bloc playlists */}
        <div className="rounded-xl border border-border bg-card p-5 lg:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
              <Music2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-medium">Playlists</p>
              <p className="text-xs text-muted-foreground">
                Musiques des personnages du serveur
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* YouTube */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-faint flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                YouTube
              </p>
              <div
                className="relative w-full overflow-hidden rounded-lg border border-border"
                style={{ paddingTop: "56.25%" }}
              >
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src="https://www.youtube.com/embed/videoseries?si=xsTmP1YLwGkJA0Tq&list=PLsGGz_zU8Au-32jM7d3a7fW8NEri9CtP8"
                  title="Playlist YouTube Flashback WL"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Spotify */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-faint flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Spotify
              </p>
              <iframe
                style={{ borderRadius: "8px" }}
                src="https://open.spotify.com/embed/playlist/4DAL8IjF0txGmEKKeCsUN3?utm_source=generator&theme=0"
                width="100%"
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Playlist Spotify Flashback WL"
              />
            </div>
          </div>
        </div>
      </section>
    </WikiLayout>
  );
}
