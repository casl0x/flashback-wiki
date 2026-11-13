"use client";

import SectionTitle from "@/app/_composents/characters/SectionTitle";
import SoundList from "@/app/_composents/characters/SoundList";
import { cloudinaryUrl, initials } from "@/lib/cloudinary";
import type { MusicPlayer } from "@/lib/music";
import { cn, matchesSearch } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/** Recherche (titre, artiste, personnage, pseudo) + une carte par joueur avec ses musiques. */
export default function MusicExplorer({ players }: { players: MusicPlayer[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const searching = query.trim() !== "";

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => {
            const img = p.imageUrl ? cloudinaryUrl(p.imageUrl, "w_96,h_96,c_fill,g_face") : null;
            // Pendant une recherche, tout est déplié ; sinon à la demande.
            const open = searching || openId === p.id;
            const persos = [...new Set(p.tracks.map((t) => t.character.nom))];
            return (
              <article
                key={p.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-[#23262D] bg-[#15171B] p-3",
                  open && "sm:col-span-2 lg:col-span-3",
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === p.id ? null : p.id)}
                    aria-expanded={open}
                    disabled={searching}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#23262D] text-[13px] font-bold">
                        {initials(p.pseudo)}
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-bold">{p.pseudo}</span>
                      <span className="truncate text-[12px] text-[#9AA0AA]">
                        {p.tracks.length} son{p.tracks.length > 1 ? "s" : ""} · {persos.join(", ")}
                      </span>
                    </span>
                    {!searching && (
                      <ChevronDown
                        className={cn("h-4 w-4 flex-none text-[#9AA0AA] transition-transform", open && "rotate-180")}
                        aria-hidden
                      />
                    )}
                  </button>
                  <Link
                    href={`/joueurs/${p.id}`}
                    className="flex min-h-11 flex-none items-center text-[12px] font-semibold text-[#8AB4FF] hover:underline"
                  >
                    Fiche ↗
                  </Link>
                </div>
                {open && <SoundList sounds={p.tracks} />}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
