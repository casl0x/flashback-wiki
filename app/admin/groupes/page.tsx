import { ButtonLink, PageHeader } from "@/app/_composents/admin/ui";
import { prisma } from "@/lib/db";
import { versionRank } from "@/lib/version-rank";
import {
  GROUPE_JURIDICTIONS,
  GROUPE_STATUTS,
  GROUPE_TYPES,
  type GroupeJuridiction,
  type GroupeStatut,
  type GroupeType,
} from "@/lib/groupe-types";
import GroupesList from "./GroupesList";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  type?: string;
  version?: string;
  statut?: string;
  juridiction?: string;
  cat?: string;
  etat?: string;
  sort?: string;
};

export default async function AdminGroupes({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const [groupes, versions, categories] = await Promise.all([
    prisma.groupe.findMany({
      orderBy: { nom: "asc" },
      include: {
        categorie: { select: { nom: true } },
        _count: { select: { grades: true } },
        members: { select: { characterId: true, versionId: true } },
      },
    }),
    prisma.version.findMany({
      orderBy: [{ ordre: "asc" }, { id: "asc" }],
      select: { id: true, label: true, color: true, ordre: true },
    }),
    prisma.groupeCategorie.findMany({
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
      select: { id: true, nom: true, type: true },
    }),
  ]);

  const rows = groupes.map((g) => ({
    id: g.id,
    nom: g.nom,
    slug: g.slug,
    color: g.color,
    type: g.type,
    statut: g.statut,
    juridiction: g.juridiction,
    dissous: g.dissous,
    categorieId: g.categorieId,
    categorieNom: g.categorie?.nom ?? null,
    members: new Set(g.members.map((m) => m.characterId)).size,
    versionIds: [
      ...new Set(g.members.map((m) => m.versionId).filter((v): v is string => !!v)),
    ].sort((a, b) => versionRank(a) - versionRank(b)),
    grades: g._count.grades,
  }));

  // Seules les versions où au moins un groupe a eu des membres sont proposées en filtre.
  const used = new Set(rows.flatMap((r) => r.versionIds));
  const versionOptions = versions
    .filter((v) => used.has(v.id))
    .map((v) => ({ id: v.id, label: v.label, color: v.color, ordre: String(v.ordre) }));

  const pick = <T extends string>(list: readonly T[], v: string | undefined) =>
    (list as readonly string[]).includes(v ?? "") ? (v as T) : ("all" as const);

  return (
    <>
      <PageHeader
        title="Groupes"
        meta={`${groupes.length} groupe${groupes.length > 1 ? "s" : ""}`}
        actions={
          <ButtonLink href="/admin/groupes/new?back=%2Fadmin%2Fgroupes" variant="primary">
            + Nouveau groupe
          </ButtonLink>
        }
      />
      <GroupesList
        groupes={rows}
        versions={versionOptions}
        categories={categories}
        initial={{
          q: sp.q ?? "",
          type: pick<GroupeType>(GROUPE_TYPES, sp.type),
          version: used.has(sp.version ?? "") ? sp.version! : "all",
          statut: pick<GroupeStatut>(GROUPE_STATUTS, sp.statut),
          juridiction: pick<GroupeJuridiction>(GROUPE_JURIDICTIONS, sp.juridiction),
          cat: sp.cat && sp.cat.length > 0 ? sp.cat : "all",
          etat: pick(["actif", "dissous"] as const, sp.etat),
          sort: sp.sort === "z→a" ? "z→a" : "a→z",
        }}
      />
    </>
  );
}
