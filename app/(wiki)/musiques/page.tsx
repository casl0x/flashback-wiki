import SectionTitle from "@/app/_composents/characters/SectionTitle";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Musiques – Flashback Wiki",
};

const PLATFORMS = {
  youtube: { label: "YouTube", bg: "#FF0033", fg: "#FFFFFF" },
  spotify: { label: "Spotify", bg: "#1DB954", fg: "#0E0F12" },
} as const;

export default function MusiquesPage() {
  return (
    <div className="min-h-full bg-[#0E0F12] text-[15px] leading-normal text-[#ECECEE]">
      <header className="mx-auto max-w-295 px-4 pt-10 pb-4 sm:px-5 sm:pt-14">
        <h1
          className={cn(
            anton.className,
            "m-0 text-[clamp(48px,9vw,80px)] uppercase leading-[0.95]",
          )}
        >
          Musiques
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] text-[#A3A8B3]">
          Les sons des joueurs, liés à leurs personnages. Écoute la playlist
          complète du serveur.
        </p>
      </header>

      <main className="mx-auto flex max-w-295 flex-col gap-6 px-4 pb-16 sm:px-5">
        <section aria-labelledby="playlists-h" className="flex flex-col gap-4">
          <SectionTitle id="playlists-h">
            Les playlists du serveur
          </SectionTitle>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PlaylistCard
              platform="youtube"
              title="Musiques des personnages du serveur"
              openHref="https://www.youtube.com/playlist?list=PLsGGz_zU8Au-32jM7d3a7fW8NEri9CtP8"
            >
              <div
                className="relative w-full overflow-hidden rounded-[10px]"
                style={{ paddingTop: "56.25%" }}
              >
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src="https://www.youtube.com/embed/videoseries?si=xsTmP1YLwGkJA0Tq&list=PLsGGz_zU8Au-32jM7d3a7fW8NEri9CtP8"
                  title="Playlist YouTube Flashback WL"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </PlaylistCard>

            <PlaylistCard
              platform="spotify"
              title="Musiques des personnages du serveur"
              openHref="https://open.spotify.com/playlist/4DAL8IjF0txGmEKKeCsUN3"
            >
              <iframe
                className="w-full rounded-[10px] border-0"
                src="https://open.spotify.com/embed/playlist/4DAL8IjF0txGmEKKeCsUN3?utm_source=generator&theme=0"
                height={352}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                title="Playlist Spotify Flashback WL"
              />
            </PlaylistCard>
          </div>
        </section>
      </main>
    </div>
  );
}

function PlaylistCard({
  platform,
  title,
  openHref,
  children,
}: {
  platform: keyof typeof PLATFORMS;
  title: string;
  openHref: string;
  children: React.ReactNode;
}) {
  const style = PLATFORMS[platform];
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide"
            style={{ background: style.bg, color: style.fg }}
          >
            {style.label}
          </span>
          <span className="text-[14px] font-semibold text-[#ECECEE]">
            {title}
          </span>
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-none items-center text-[13px] font-semibold text-[#8AB4FF] hover:underline"
        >
          Ouvrir ↗
        </a>
      </div>
      {children}
    </div>
  );
}
