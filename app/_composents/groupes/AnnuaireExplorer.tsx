"use client";

import { textOn } from "@/app/_composents/characters/CharacterHero";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn, matchesSearch } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type AnnuaireItem = {
  id: string;
  href: string;
  nom: string;
  color: string | null;
  imageUrl: string | null;
  members: number;
  categorieId: string | null;
};

export type AnnuaireCategorie = { id: string; nom: string };

const NONE = "__none__";

/** Annuaire (entreprises / services publics) : recherche, puces de catégorie, une section par catégorie. */
export default function AnnuaireExplorer({
  items,
  categories,
  emptyLabel,
}: {
  items: AnnuaireItem[];
  categories: AnnuaireCategorie[];
  emptyLabel: string;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const sections = useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const all = [
      ...categories.map((c) => ({ key: c.id, label: c.nom })),
      { key: NONE, label: "Autres" },
    ];
    return all
      .map((s) => ({
        ...s,
        items: items.filter(
          (i) =>
            (s.key === NONE
              ? !i.categorieId || !known.has(i.categorieId)
              : i.categorieId === s.key) &&
            (!q.trim() || matchesSearch(i.nom, q)),
        ),
      }))
      .filter((s) => s.items.length > 0 && (!cat || cat === s.key));
  }, [items, categories, q, cat]);

  const chips = [
    ...categories.map((c) => ({ key: c.id, label: c.nom })),
    ...(items.some(
      (i) => !i.categorieId || !categories.some((c) => c.id === i.categorieId),
    )
      ? [{ key: NONE, label: "Autres" }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          aria-label="Rechercher"
          className="min-h-11 w-full max-w-md rounded-lg border border-[#3A3E47] bg-[#15171B] px-3.5 text-[15px] text-[#ECECEE] placeholder:text-[#6E7380]"
        />
        {chips.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {[{ key: null as string | null, label: "Toutes" }, ...chips].map(
              (c) => {
                const on = cat === c.key;
                return (
                  <button
                    key={c.key ?? "all"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCat(c.key)}
                    className={cn(
                      "min-h-9 rounded-full border px-3.5 text-[13px] font-bold",
                      on
                        ? "border-[#ECECEE] bg-[#ECECEE] text-[#0E0F12]"
                        : "border-[#3A3E47] text-[#C4C7CF] hover:border-[#6E7380]",
                    )}
                  >
                    {c.label}
                  </button>
                );
              },
            )}
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <p className="m-0 rounded-xl border border-dashed border-[#3A3E47] p-8 text-center text-[#9AA0AA]">
          {emptyLabel}
        </p>
      )}

      {sections.map((s) => (
        <section key={s.key} aria-labelledby={`cat-${s.key}`} className="flex flex-col gap-3.5">
          <h2
            id={`cat-${s.key}`}
            className={cn(
              anton.className,
              "m-0 flex items-baseline gap-3 text-[26px] font-normal uppercase sm:text-[30px]",
            )}
          >
            {s.label}
            <span className="font-sans text-[13px] font-medium normal-case text-[#9AA0AA]">
              {s.items.length}
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
            {s.items.map((i) => {
              const accent = i.color ?? "#2F6FEB";
              return (
                <Link
                  key={i.id}
                  href={i.href}
                  className="group flex min-h-24 items-center gap-3.5 rounded-xl border border-l-4 border-[#23262D] bg-[#15171B] p-3.5 hover:bg-[#1A1D23]"
                  style={{ borderLeftColor: accent }}
                >
                  <span
                    className="relative flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: accent, color: textOn(accent) }}
                  >
                    {i.imageUrl ? (
                      <Image
                        src={cloudinaryUrl(
                          i.imageUrl,
                          "w_120,h_120,c_pad,b_transparent",
                        )}
                        alt=""
                        fill
                        unoptimized
                        sizes="56px"
                        className="object-contain p-1.5"
                      />
                    ) : (
                      <span className={cn(anton.className, "text-[20px] opacity-80")}>
                        {i.nom.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[16px] font-bold leading-tight group-hover:underline">
                      {i.nom}
                    </span>
                    <span className="text-[13px] text-[#9AA0AA]">
                      {i.members} membre{i.members > 1 ? "s" : ""}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
