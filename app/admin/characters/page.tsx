import { ButtonLink, PageHeader } from "@/app/_composents/admin/ui";
import {
  characterListInclude,
  characterWhere,
  currentJob,
} from "@/lib/admin/character-list";
import { prisma } from "@/lib/db";
import AdminCharacterFilters from "../../_composents/admin/AdminCharacterFilters";
import CharactersTable from "./CharactersTable";

export const dynamic = "force-dynamic";
const PER_PAGE = 25;

type Props = {
  searchParams: Promise<{
    q?: string;
    version?: string;
    etat?: string;
    groupe?: string;
    role?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function AdminCharacters({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = characterWhere(sp);

  const [total, rows, versionRows] = await Promise.all([
    prisma.character.count({ where }),
    prisma.character.findMany({
      where,
      include: characterListInclude,
      orderBy: { nom: sp.sort === "z→a" ? "desc" : "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.version.findMany({
      orderBy: [{ ordre: "asc" }, { id: "asc" }],
      select: { id: true, label: true, color: true, ordre: true },
    }),
  ]);
  const versions = versionRows.map((v) => ({ ...v, ordre: String(v.ordre) }));

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["q", "version", "etat", "groupe", "role", "sort"] as const)
      if (sp[k]) params.set(k, sp[k]!);
    params.set("page", String(p));
    return `?${params}`;
  };
  const exportParams = new URLSearchParams();
  for (const k of ["q", "version", "etat", "groupe", "role", "sort"] as const)
    if (sp[k]) exportParams.set(k, sp[k]!);

  return (
    <>
      <PageHeader
        title="Personnages"
        meta={`${total} fiche${total > 1 ? "s" : ""}`}
        actions={
          <>
            <ButtonLink
              href={`/admin/characters/export?${exportParams}`}
              prefetch={false}
            >
              Exporter CSV
            </ButtonLink>
            <ButtonLink
              href={`/admin/characters/new?back=${encodeURIComponent(
                exportParams.toString()
                  ? `/admin/characters?${exportParams}`
                  : "/admin/characters",
              )}`}
              variant="primary"
            >
              + Nouveau personnage
            </ButtonLink>
          </>
        }
      />

      <AdminCharacterFilters versions={versions} resultCount={rows.length} />

      <CharactersTable
        versions={versions}
        rows={rows.map((c) => ({
          id: c.id,
          nom: c.nom,
          imageUrl: c.imageUrl,
          versions: c.versions,
          job: currentJob(c),
          player: c.player,
          etatVie: c.etatVie,
        }))}
      />

      <nav
        aria-label="Pagination"
        className="flex items-center justify-between gap-3 text-[13px] text-[#A3A8B3]"
      >
        <span>
          {total === 0
            ? "0"
            : `${(page - 1) * PER_PAGE + 1} – ${Math.min(page * PER_PAGE, total)}`}{" "}
          sur {total}
        </span>
        <span className="flex gap-2">
          {page > 1 && <ButtonLink href={qs(page - 1)}>← Précédent</ButtonLink>}
          {page < pages && (
            <ButtonLink href={qs(page + 1)}>Suivant →</ButtonLink>
          )}
        </span>
      </nav>
    </>
  );
}
