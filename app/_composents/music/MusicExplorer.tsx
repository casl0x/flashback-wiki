"use client";

import SectionTitle from "@/app/_composents/characters/SectionTitle";
import SoundList from "@/app/_composents/characters/SoundList";
import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import type { MusicPlayer } from "@/lib/music";
import { matchesSearch } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

/** Recherche (titre, artiste, personnage, pseudo) + une carte par joueur avec ses musiques. */
export default function MusicExplorer({ players }: { players: MusicPlayer[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () =>
      players
        .map((p) => {
          // Si le pseudo correspond, on garde toutes les musiques du joueur.
          if (matchesSearch(p.pseudo, query)) return p;
          const tracks = p.tracks.filter(
            (t) =>
              matchesSearch(t.titre, query) ||
              matchesSearch(t.artiste, query) ||
              matchesSearch(t.character.nom, query),
          );
          return { ...p, tracks };
        })
        .filter((p) => p.tracks.length > 0),
    [players, query],
  );
  const total = results.reduce((n, p) => n + p.tracks.length, 0);

  return (
    <section aria-labelledby="joueurs-h" className="flex flex-col gap-4">
      <SectionTitle id="joueurs-h">Musiques des joueurs</SectionTitle>

      <label className="block">
        <span className="sr-only">Rechercher une musique, un artiste, un personnage ou un joueur</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre, un artiste, un perso, un joueur…"
          className="h-11 w-full rounded-lg border border-[#23262D] bg-[#15171B] px-3.5 text-[14px] text-[#ECECEE] placeholder:text-[#6E7380] focus:border-[#3A3E47] focus:outline-none"
        />
      </label>

      <p className="m-0 text-[13px] text-[#9AA0AA]" aria-live="polite">
        {total} son{total > 1 ? "s" : ""} · {results.length} joueur{results.length > 1 ? "s" : ""}
      </p>

      {results.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed border-[#3A3E47] p-8 text-center text-[#9AA0AA]">
          Aucune musique ne correspond à « {query} ».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {results.map((p) => {
            const img = p.imageUrl ? cloudinaryUrl(p.imageUrl, "w_96,h_96,c_fill,g_face") : null;
            return (
              <article key={p.id} className="flex flex-col gap-3 rounded-xl border border-[#23262D] bg-[#0E0F12]">
                <Link
                  href={`/joueurs/${p.id}`}
                  className="flex items-center gap-3 px-1 pt-1 hover:underline"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-10 w-10 flex-none rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#23262D] text-[13px] font-bold">
                      {initials(p.pseudo)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[16px] font-bold">{p.pseudo}</span>
                  <span className="flex-none text-[13px] text-[#9AA0AA]">
                    {p.tracks.length} son{p.tracks.length > 1 ? "s" : ""}
                  </span>
                </Link>
                <SoundList sounds={p.tracks} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
