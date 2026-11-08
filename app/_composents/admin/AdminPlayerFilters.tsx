"use client";

import { BADGES_CONFIG } from "@/app/_composents/admin/PlayerBadges";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const YES_NO = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

const GROUPS: { key: string; title: string; options: { value: string; label: string }[] }[] = [
  {
    key: "badge",
    title: "Badge",
    options: [
      ...BADGES_CONFIG.map((b) => ({ value: b.key, label: b.label })),
      { value: "none", label: "Aucun badge" },
    ],
  },
  { key: "chaine", title: "Chaîne de stream", options: YES_NO },
  { key: "compte", title: "Compte lié", options: YES_NO },
  { key: "persos", title: "A des personnages", options: YES_NO },
];

/** Barre de recherche + filtres des joueurs, synchronisée avec l'URL (filtrage côté serveur). */
export default function AdminPlayerFilters({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") ?? "");
  const [showPanel, setShowPanel] = useState(false);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(sp);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params}`);
  };

  // Recherche : on attend la fin de la frappe avant de recharger.
  useEffect(() => {
    if (query === (sp.get("q") ?? "")) return;
    const t = setTimeout(() => setParam("q", query.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = GROUPS.flatMap((g) => {
    const v = sp.get(g.key);
    const o = g.options.find((x) => x.value === v);
    return o ? [{ key: g.key, label: `${g.title} : ${o.label}` }] : [];
  });

  const resetAll = () => {
    const params = new URLSearchParams(sp);
    for (const g of GROUPS) params.delete(g.key);
    params.delete("page");
    router.replace(`${pathname}?${params}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-55 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E7380]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un joueur, un compte, un perso..."
            aria-label="Rechercher"
            className="h-9 w-full rounded-lg border border-[#2C3038] bg-[#15171B] py-1 pl-9 pr-3 text-sm text-white placeholder:text-[#6E7380] focus:outline-none focus:ring-2 focus:ring-[#2F6FEB]/40"
            suppressHydrationWarning
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPanel((v) => !v)}
          aria-expanded={showPanel}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
            showPanel || active.length
              ? "border-[#2F6FEB] bg-[#2F6FEB]/10 text-[#8AB4FF]"
              : "border-[#2C3038] bg-[#15171B] text-[#C4C7CF] hover:bg-[#1F2228]"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
          {active.length > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2F6FEB] px-1 text-[10px] font-semibold text-white">
              {active.length}
            </span>
          )}
        </button>
        <select
          aria-label="Tri"
          value={sp.get("sort") || "a→z"}
          onChange={(e) => setParam("sort", e.target.value === "a→z" ? "" : e.target.value)}
          className="h-9 rounded-lg border border-[#2C3038] bg-[#15171B] px-2 text-sm text-white"
        >
          <option value="a→z">A → Z</option>
          <option value="z→a">Z → A</option>
          <option value="persos">Plus de persos</option>
          <option value="recent">Plus récents</option>
        </select>
      </div>

      {showPanel && (
        <div className="space-y-4 rounded-md border border-[#2C3038] p-4">
          {GROUPS.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6E7380]">
                {g.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map((o) => {
                  const selected = sp.get(g.key) === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setParam(g.key, selected ? "" : o.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "border-[#2F6FEB] bg-[#2F6FEB]/10 text-[#8AB4FF]"
                          : "border-[#2C3038] bg-[#15171B] text-[#C4C7CF] hover:bg-[#1F2228]"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#23262D] px-3 py-2 text-xs">
          {active.map((a) => (
            <span
              key={a.key}
              className="flex items-center gap-1 rounded-full border border-[#2F6FEB] bg-[#2F6FEB]/10 px-2 py-0.5 font-medium text-[#8AB4FF]"
            >
              {a.label}
              <button type="button" onClick={() => setParam(a.key, "")} aria-label={`Retirer le filtre ${a.label}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="text-[#6E7380] underline-offset-2 hover:text-white hover:underline"
          >
            Tout effacer
          </button>
          <span className="ml-auto text-[#6E7380]">
            {resultCount} résultat{resultCount !== 1 ? "s" : ""} sur cette page
          </span>
        </div>
      )}
    </div>
  );
}
