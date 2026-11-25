"use client";

import GroupeFilterBar, {
  NO_CATEGORIE,
  type CategorieOption,
  type GroupeEtatFilter,
  type GroupeJuridictionFilter,
  type GroupeStatutFilter,
  type GroupeTypeFilter,
} from "@/app/_composents/groupes/GroupeFilterBar";
import type {
  SortOrder,
  VersionOption,
} from "@/app/_composents/characters/CharacterFilterBar";
import {
  CATEGORIE_TYPES,
  GROUPE_STATUT_LABEL,
  GROUPE_TYPE_META,
  type GroupeJuridiction,
  type GroupeStatut,
  type GroupeType,
} from "@/lib/groupe-types";
import { matchesSearch } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type AdminGroupeRow = {
  id: string;
  nom: string;
  slug: string;
  color: string | null;
  type: GroupeType;
  statut: GroupeStatut | null;
  juridiction: GroupeJuridiction | null;
  dissous: boolean;
  categorieId: string | null;
  categorieNom: string | null;
  members: number;
  versionIds: string[]; // triées de la plus ancienne à la plus récente
  grades: number;
};

type Initial = {
  q: string;
  type: GroupeTypeFilter;
  version: string;
  statut: GroupeStatutFilter;
  juridiction: GroupeJuridictionFilter;
  cat: string;
  etat: GroupeEtatFilter;
  sort: SortOrder;
};

/** Liste des groupes de l'admin : mêmes filtres que la vue Groupes de l'Explorer public. */
export default function GroupesList({
  groupes,
  versions,
  categories,
  initial,
}: {
  groupes: AdminGroupeRow[];
  versions: VersionOption[];
  categories: CategorieOption[];
  initial: Initial;
}) {
  const [query, setQuery] = useState(initial.q);
  const [versionFilter, setVersionFilter] = useState(initial.version);
  const [typeFilter, setTypeFilter] = useState<GroupeTypeFilter>(initial.type);
  const [statutFilter, setStatutFilter] = useState<GroupeStatutFilter>(
    initial.statut,
  );
  const [juridictionFilter, setJuridictionFilter] =
    useState<GroupeJuridictionFilter>(initial.juridiction);
  const [catFilter, setCatFilter] = useState(initial.cat);
  const [etatFilter, setEtatFilter] = useState<GroupeEtatFilter>(initial.etat);
  const [sort, setSort] = useState<SortOrder>(initial.sort);
  const [showPanel, setShowPanel] = useState(
    initial.type !== "all" ||
      initial.version !== "all" ||
      initial.etat !== "all",
  );

  // Changer de type remet à zéro les sous-filtres qui ne le concernent plus.
  const onTypeChange = (t: GroupeTypeFilter) => {
    setTypeFilter(t);
    setStatutFilter("all");
    setJuridictionFilter("all");
    setCatFilter("all");
  };

  const categorieIds = useMemo(
    () => new Set(categories.map((c) => c.id)),
    [categories],
  );

  const filtered = useMemo(
    () =>
      groupes
        .filter(
          (g) =>
            (versionFilter === "all" || g.versionIds.includes(versionFilter)) &&
            (typeFilter === "all" || g.type === typeFilter) &&
            (statutFilter === "all" || g.statut === statutFilter) &&
            (juridictionFilter === "all" ||
              g.juridiction === juridictionFilter) &&
            (catFilter === "all" ||
              (catFilter === NO_CATEGORIE
                ? !g.categorieId || !categorieIds.has(g.categorieId)
                : g.categorieId === catFilter)) &&
            (etatFilter === "all" || g.dissous === (etatFilter === "dissous")) &&
            matchesSearch(g.nom, query),
        )
        .sort((a, b) =>
          sort === "a→z"
            ? a.nom.localeCompare(b.nom, "fr")
            : b.nom.localeCompare(a.nom, "fr"),
        ),
    [
      groupes,
      versionFilter,
      typeFilter,
      statutFilter,
      juridictionFilter,
      catFilter,
      etatFilter,
      query,
      sort,
      categorieIds,
    ],
  );

  // Les filtres vivent dans l'URL : on les retrouve en revenant d'une fiche (lien « retour »).
  const search = useMemo(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (typeFilter !== "all") p.set("type", typeFilter);
    if (versionFilter !== "all") p.set("version", versionFilter);
    if (statutFilter !== "all") p.set("statut", statutFilter);
    if (juridictionFilter !== "all") p.set("juridiction", juridictionFilter);
    if (catFilter !== "all") p.set("cat", catFilter);
    if (etatFilter !== "all") p.set("etat", etatFilter);
    if (sort !== "a→z") p.set("sort", sort);
    return p.toString();
  }, [
    query,
    typeFilter,
    versionFilter,
    statutFilter,
    juridictionFilter,
    catFilter,
    etatFilter,
    sort,
  ]);
  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      search ? `/admin/groupes?${search}` : "/admin/groupes",
    );
  }, [search]);
  const backHref = search ? `/admin/groupes?${search}` : "/admin/groupes";
  const editHref = (id: string) =>
    `/admin/groupes/${id}?back=${encodeURIComponent(backHref)}`;

  return (
    <>
      <GroupeFilterBar
        query={query}
        onQueryChange={setQuery}
        versions={versions}
        versionFilter={versionFilter}
        onVersionChange={setVersionFilter}
        typeFilter={typeFilter}
        onTypeChange={onTypeChange}
        categories={categories}
        catFilter={catFilter}
        onCatChange={setCatFilter}
        statutFilter={statutFilter}
        onStatutChange={setStatutFilter}
        juridictionFilter={juridictionFilter}
        onJuridictionChange={setJuridictionFilter}
        etatFilter={etatFilter}
        onEtatChange={setEtatFilter}
        sort={sort}
        onSortChange={setSort}
        showPanel={showPanel}
        onTogglePanel={() => setShowPanel((s) => !s)}
        resultCount={filtered.length}
      />
      <p className="m-0 text-[13px] text-[#9AA0AA]">
        {filtered.length} groupe{filtered.length > 1 ? "s" : ""}
      </p>
      <div className="overflow-x-auto rounded-[10px] border border-[#23262D]">
        <table className="w-full min-w-220 border-collapse text-left">
          <thead>
            <tr className="bg-[#1A1C21] text-[11px] uppercase tracking-widest text-[#A3A8B3]">
              {["Nom", "Type", "Catégorie", "Slug", "Membres", "Versions", "Grades"].map(
                (h) => (
                  <th key={h} scope="col" className="px-3 py-2.5">
                    {h}
                  </th>
                ),
              )}
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="bg-[#15171B] px-3 py-8 text-center text-[#9AA0AA]"
                >
                  Aucun groupe.
                </td>
              </tr>
            )}
            {filtered.map((g) => {
              const categorie =
                g.type === "GROUPE"
                  ? g.statut
                    ? GROUPE_STATUT_LABEL[g.statut]
                    : null
                  : CATEGORIE_TYPES.includes(g.type)
                    ? g.categorieNom
                    : null;
              return (
                <tr
                  key={g.id}
                  className="border-t border-[#23262D] bg-[#15171B] hover:bg-[#1A1D23]"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={editHref(g.id)}
                      className="flex items-center gap-2 font-semibold hover:underline"
                    >
                      <span
                        aria-hidden
                        className="h-3 w-3 flex-none rounded-[3px]"
                        style={{ background: g.color ?? "#6E7380" }}
                      />
                      {g.nom}
                      {g.dissous && (
                        <span className="text-[11px] font-normal uppercase tracking-wide text-[#9AA0AA]">
                          dissous
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {GROUPE_TYPE_META[g.type].label}
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {categorie ?? <span className="text-[#6E7380]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[#9AA0AA]">/{g.slug}</td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">{g.members}</td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {g.versionIds.join(", ") || (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {g.grades || <span className="text-[#6E7380]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={editHref(g.id)}
                      className="inline-flex min-h-8 items-center rounded-md border border-[#3A3E47] px-2.5 text-[13px] hover:bg-[#1F2228]"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
