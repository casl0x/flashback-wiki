import { Music2 } from "lucide-react";

export default function page() {
  return (
    <main>
      <section className="px-4 lg:px-5">
        <div className="p-5 lg:p-8">
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
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
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

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-faint">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Spotify
              </p>
              <iframe
                style={{ borderRadius: "8px" }}
                src="https://open.spotify.com/embed/playlist/4DAL8IjF0txGmEKKeCsUN3?utm_source=generator&theme=0"
                width="100%"
                height="450"
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
    </main>
  );
}
