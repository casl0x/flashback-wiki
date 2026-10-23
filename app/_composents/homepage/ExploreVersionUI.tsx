"use client";

import type { VersionBand } from "@/lib/version-bands";
import { Anton } from "next/font/google";
import Link from "next/link";
import { useState, type MouseEvent } from "react";

const anton = Anton({ weight: "400", subsets: ["latin"] });

type Props = {
  versions: VersionBand[];
  title?: string;
};

/**
 * Explorateur par version : une bande par version, celle survolée (ou focus,
 * ou touchée sur mobile) s'élargit et montre l'image d'ambiance + infos.
 * Desktop : bandes côte à côte. Mobile : bandes empilées.
 */
export default function ExploreVersionUI({
  versions,
  title = "Explorer par version",
}: Props) {
  const defaultOpen =
    versions.find((v) => v.enCours)?.id ?? versions.at(-1)?.id ?? null;
  const [open, setOpen] = useState<string | null>(defaultOpen);

  if (versions.length === 0) return null;

  // Sur écran tactile, le premier tap ouvre la bande, le second suit le lien.
  function handleClick(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (open !== id) {
      e.preventDefault();
      setOpen(id);
    }
  }

  return (
    <section aria-labelledby="versions-h" className="flex flex-col gap-4">
      <h2
        id="versions-h"
        className={`text-sans text-3xl uppercase tracking-wide md:text-4xl`}
      >
        {title}
      </h2>

      <div className="flex h-140 flex-col gap-2 md:h-100 md:flex-row">
        {versions.map((v) => {
          const isOpen = v.id === open;
          return (
            <Link
              key={v.id}
              href={`/personnages?version=${encodeURIComponent(v.id)}`}
              onMouseEnter={() => setOpen(v.id)}
              onFocus={() => setOpen(v.id)}
              onClick={(e) => handleClick(e, v.id)}
              aria-label={`${v.label} · ${v.count} personnages`}
              style={{
                flexGrow: isOpen ? 8 : 1,
                borderTopColor: v.color,
              }}
              className="relative min-h-11 basis-0 overflow-hidden rounded-[10px] border border-t-4 border-border bg-card text-foreground no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-[flex-grow] motion-safe:duration-500 motion-safe:ease-out md:min-w-16"
            >
              {isOpen ? (
                <>
                  {v.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-muted" />
                  )}
                  <span className="absolute inset-0" />
                  <span className="absolute inset-x-5 bottom-5 flex flex-col gap-1.5 md:inset-x-6">
                    <span
                      className={`${anton.className} text-7xl leading-[0.85] md:text-[110px]`}
                      style={{ color: v.color }}
                    >
                      {v.num}
                    </span>
                    <span className="text-xl font-bold md:text-2xl">
                      {v.label}
                      {v.enCours && (
                        <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 align-middle text-xs font-bold text-emerald-300">
                          en cours
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {[v.periode, `${v.count} personnages`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: v.color }}
                    >
                      Voir les personnages →
                    </span>
                  </span>
                </>
              ) : (
                <span
                  className={`${anton.className} absolute inset-y-0 left-4 flex items-center text-2xl leading-none md:inset-x-0 md:inset-y-auto md:bottom-4 md:left-0 md:justify-center md:text-[34px]`}
                  style={{ color: v.color }}
                >
                  {v.num}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
