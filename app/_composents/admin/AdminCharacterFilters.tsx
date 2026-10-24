"use client";

import CharacterFilterBar, {
  RoleFilter,
  SortOrder,
  VersionOption,
} from "@/app/_composents/characters/CharacterFilterBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  versions: VersionOption[];
  resultCount: number;
};

/** Branche la barre de filtres publique sur les paramètres d'URL (filtrage côté serveur). */
export default function AdminCharacterFilters({ versions, resultCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") ?? "");
  const [showPanel, setShowPanel] = useState(false);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(sp);
    if (value && value !== "all") params.set(key, value);
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

  return (
    <CharacterFilterBar
      query={query}
      onQueryChange={setQuery}
      versions={versions}
      versionFilter={sp.get("version") || "all"}
      onVersionChange={(v) => setParam("version", v)}
      etatFilter={sp.get("etat") || "all"}
      onEtatChange={(v) => setParam("etat", v)}
      roleFilter={(sp.get("role") as RoleFilter) || "all"}
      onRoleChange={(v) => setParam("role", v)}
      sort={(sp.get("sort") as SortOrder) || "a→z"}
      onSortChange={(v) => setParam("sort", v === "a→z" ? "" : v)}
      showPanel={showPanel}
      onTogglePanel={() => setShowPanel((v) => !v)}
      resultCount={resultCount}
    />
  );
}
