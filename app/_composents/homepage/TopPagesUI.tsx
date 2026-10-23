"use client";

import Image from "next/image";

interface PageStat {
  path: string;
  name: string;
  views: number;
  version: string;
  versionId: string;
  versionColor: string;
  image: string;
}

interface TopPagesUIProps {
  pages: PageStat[];
  error: string | null;
  title: string;
  since: string;
}

const sinceLabel: Record<string, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
};

export default function TopPagesUI({
  pages,
  error,
  title,
  since,
}: TopPagesUIProps) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <strong>Erreur :</strong> {error}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Aucune donnée disponible pour cette période.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* En-tête */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-3xl uppercase font-sans">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {sinceLabel[since] ?? since}
        </span>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
        {pages.map((page, index) => {
          return (
            <div
              key={page.path}
              className="relative flex flex-col justify-end gap-1.5 rounded-lg border border-border bg-card h-60"
            >
              {/* Rang */}
              <span className="absolute z-10 top-2 left-2 text-5xl text-muted-foreground">
                {index + 1}
              </span>

              <span
                className="absolute z-10 top-2 right-2 rounded-sm px-2 py-0.5 text-xs"
                style={{ backgroundColor: page.versionColor, color: "white" }}
              >
                {page.versionId}
              </span>

              {/* Image */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
                <Image
                  src={page.image}
                  alt={page.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 190px"
                  className="object-cover"
                  quality={100}
                />
              </div>

              {/* Nom + barre */}
              <div
                className="relative z-10 flex flex-col w-full rounded-b-lg p-2 text-base/4 backdrop-blur-sm font-sans"
                style={{
                  backgroundColor: page.versionColor,
                  color: "white",
                  opacity: 0.9,
                }}
              >
                <a
                  href={page.path}
                  className="text-md uppercase hover:underline"
                  title={page.name}
                >
                  {page.name}
                </a>
                <span className="text-sm text-white/80">
                  {page.views.toLocaleString("fr-FR")} vues
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
