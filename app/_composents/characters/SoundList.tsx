"use client";

import { PLATFORM_STYLE, detectSoundPlatform, soundEmbed } from "@/lib/media-embed";
import { cn } from "@/lib/utils";
import { Play, Square } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type SoundListItem = {
  id: string;
  titre: string;
  artiste: string | null;
  url: string;
  platform: ReturnType<typeof detectSoundPlatform>;
  /** Perso associé : affiché sous le titre (utile hors fiche perso). */
  character?: { id: string; nom: string };
};

/** Liste de sons ; ▶ ouvre le lecteur de la plateforme sous la ligne (un à la fois par liste). */
export default function SoundList({ sounds }: { sounds: SoundListItem[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <ol className="m-0 list-none overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B] p-0">
      {sounds.map((s) => {
        const style = PLATFORM_STYLE[s.platform];
        const embed = soundEmbed(s.url, s.platform);
        const open = playing === s.id && embed !== null;

        return (
          <li
            key={s.id}
            className={cn(
              "flex flex-col border-b border-[#23262D] last:border-b-0",
              open ? "bg-[#1A1F2B]" : "bg-[#15171B]",
            )}
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              {embed ? (
                <button
                  type="button"
                  onClick={() => setPlaying(open ? null : s.id)}
                  aria-pressed={open}
                  aria-label={`${open ? "Fermer le lecteur de" : "Écouter"} ${s.titre}`}
                  className={cn(
                    "flex h-11 w-11 flex-none items-center justify-center rounded-full border transition-colors",
                    open
                      ? "border-[#2F6FEB] bg-[#2F6FEB] text-white"
                      : "border-[#3A3E47] bg-transparent text-[#ECECEE] hover:border-[#6E7380]",
                  )}
                >
                  {open ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>
              ) : (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Écouter ${s.titre} (nouvel onglet)`}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-[#3A3E47] text-[#ECECEE] hover:border-[#6E7380]"
                >
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                </a>
              )}

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-bold text-[#ECECEE]">{s.titre}</span>
                {(s.artiste || s.character) && (
                  <span className="truncate text-[13px] text-[#9AA0AA]">
                    {s.artiste}
                    {s.artiste && s.character && " · "}
                    {s.character && (
                      <Link href={`/personnages/${s.character.id}`} className="hover:text-[#ECECEE] hover:underline">
                        {s.character.nom}
                      </Link>
                    )}
                  </span>
                )}
              </span>

              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ouvrir ${s.titre} sur ${style.label}`}
                className="flex-none rounded px-2 py-0.5 text-[11px] font-extrabold"
                style={{ background: style.bg, color: style.fg }}
              >
                {style.label} ↗
              </a>
            </div>

            {open && embed && (
              <div className="px-3 pb-3">
                <iframe
                  src={embed.src}
                  title={`Lecteur ${style.label} : ${s.titre}`}
                  loading="lazy"
                  allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                  allowFullScreen
                  className={cn(
                    "block w-full rounded-lg border-0 bg-[#0B0C0F]",
                    embed.height === "video" && "aspect-video",
                  )}
                  style={embed.height === "video" ? undefined : { height: embed.height }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
