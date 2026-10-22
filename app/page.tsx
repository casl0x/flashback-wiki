import TopPages from "@/components/wiki/TopPages";
import { getWikiData } from "@/lib/wiki-data";

export default async function HomePage() {
  const { characters, players, versions } = await getWikiData();

  const totalChars = characters.length;
  const totalPlayers = players.length;
  const totalVersions = versions.length;

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center height-160px background: linear-gradient(to top, #0E0F12 10%, rgba(14,15,18,0));"></div>
        {/* <Button className="absolute inset-0 flex items-center justify-center">
          Commencer
        </Button> */}
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-2 my-0 px-4 py-8">
          <p className="uppercase text-sm font-medium text-text-muted tracking-widest">
            wiki non officiel - flashback wl
          </p>
          <h1 className="uppercase text-4xl font-bold text-text-primary sm:text-5xl lg:text-6xl">
            Tous les visages de Flashback WL
          </h1>
          <p className="text-sm text-text-secondary sm:text-base lg:text-lg max-w-0 lg:max-w-3xl">
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
    </main>
  );
}
