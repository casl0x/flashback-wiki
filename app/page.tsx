import TopPages from "@/app/_composents/homepage/TopPages";
import { Button } from "@/components/ui/button";
import { getWikiData } from "@/lib/wiki-data";
import Link from "next/link";
import ExploreVersion from "./_composents/homepage/ExploreVersion";

export default async function HomePage() {
  const { characters, players, versions } = await getWikiData();

  const totalChars = characters.length;
  const totalPlayers = players.length;
  const totalVersions = versions.length;

  return (
    <main className="max-w-6xl mx-auto flex flex-col gap-8 px-4 py-8 lg:gap-12 lg:px-5 lg:py-12">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center height-160px "></div>
        {/* <Button className="absolute inset-0 flex items-center justify-center">
          Commencer
        </Button> */}
        <div className="relative mx-auto flex w-full flex-col gap-2 my-0 px-4 py-8">
          <p className="uppercase text-sm font-medium text-text-muted tracking-widest">
            wiki non officiel - flashback wl
          </p>
          <h1 className="uppercase text-4xl font-bold text-text-primary sm:text-5xl lg:text-6xl">
            Tous les visages de Flashback WL
          </h1>
          <p className="text-sm text-text-secondary sm:text-base lg:text-lg sm:max-w-3xl">
            Tous les personnages joués sur le serveur et leurs joueurs, les
            playlists liées aux persos, les rediffusions et les créations de la
            communauté.
          </p>
          <div className="flex flex-wrap gap-6 text-text-primary">
            <p className="flex flex-col text-2xl font-bold uppercase">
              {totalChars ?? 0}{" "}
              <span className="text-sm font-normal">Personnages</span>
            </p>
            <p className="flex flex-col text-2xl font-bold uppercase">
              {totalPlayers ?? 0}{" "}
              <span className="text-sm font-normal">Joueurs</span>
            </p>
            <p className="flex flex-col text-2xl font-bold uppercase">
              {totalVersions ?? 0}{" "}
              <span className="text-sm font-normal">Versions</span>
            </p>
          </div>
        </div>
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
      <section className="space-y-4 p-4 lg:p-5">
        <ExploreVersion />
      </section>
      <section className="space-y-4 p-4 lg:p-5">
        <div className="flex flex-col gap-2">
          <h2
            id="versions-h"
            className={`text-sans text-3xl uppercase tracking-wide md:text-4xl`}
          >
            Ce que tu trouves ici
          </h2>
          <div className="grid grid-cols-auto gap-4 w-max-full md:grid-cols-3">
            <div className="bg-muted flex flex-col gap-2 p-4 rounded-md">
              <h3 className="font-bold">Personnages & Joueurs</h3>
              <p className="text-sm text-muted-foreground">
                Chaque perso joué sur le serveur, ses relations et la personne
                qui l’incarne.
              </p>
            </div>
            <div className="bg-muted flex flex-col gap-2 p-4 rounded-md">
              <h3 className="font-bold">Playlists musicales</h3>
              <p className="text-sm text-muted-foreground">
                Les sons des joueurs, en lien avec leurs personnages.
              </p>
            </div>
            <div className="bg-muted flex flex-col gap-2 p-4 rounded-md">
              <h3 className="font-bold">Versions</h3>
              <p className="text-sm text-muted-foreground">
                Revoir les aventures de certains persos et découvrir les
                créations de la communauté.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="space-y-4 p-4 lg:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-primary p-6 rounded-md">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sans uppercase text-lg ">
              Une erreur, un perso manquant ?
            </h3>
            <p className="text-sm">
              Propose une modification depuis une fiche, ou rejoins le Discord
              de la communauté.
            </p>
          </div>
          <Link href="https://discord.gg/9B5dn8EVsw" target="_blank">
            <Button variant="secondary" size="lg">
              Rejoindre le Discord
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
