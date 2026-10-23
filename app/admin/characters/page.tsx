import {
  ButtonLink,
  PageHeader,
  Select,
  TextInput,
} from "@/app/_composents/admin/ui";
import {
  characterListInclude,
  characterWhere,
  currentJob,
} from "@/lib/admin/character-list";
import { prisma } from "@/lib/db";
import Link from "next/link";
import CharactersTable from "./CharactersTable";

export const dynamic = "force-dynamic";
const PER_PAGE = 25;

type Props = {
  searchParams: Promise<{
    q?: string;
    version?: string;
    etat?: string;
    groupe?: string;
    page?: string;
  }>;
};

export default async function AdminCharacters({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = characterWhere(sp);

  const [total, rows, versions, groupes] = await Promise.all([
    prisma.character.count({ where }),
    prisma.character.findMany({
      where,
      include: characterListInclude,
      orderBy: { nom: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.version.findMany({
      orderBy: [{ ordre: "asc" }, { id: "asc" }],
      select: { id: true, label: true },
    }),
    prisma.groupe.findMany({
      orderBy: { nom: "asc" },
      select: { id: true, nom: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["q", "version", "etat", "groupe"] as const)
      if (sp[k]) params.set(k, sp[k]!);
    params.set("page", String(p));
    return `?${params}`;
  };
  const exportParams = new URLSearchParams();
  for (const k of ["q", "version", "etat", "groupe"] as const)
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
            <ButtonLink href="/admin/characters/new" variant="primary">
              + Nouveau personnage
            </ButtonLink>
          </>
        }
      />

      <form className="flex flex-wrap gap-2.5" role="search">
        <TextInput
          name="q"
          defaultValue={sp.q}
          placeholder="Nom, métier, joueur…"
          aria-label="Rechercher"
          className="max-w-90 flex-[1_1_240px]"
        />
        <Select
          name="version"
          defaultValue={sp.version ?? ""}
          aria-label="Version"
          className="w-auto"
        >
          <option value="">Toutes versions</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
          <option value="none">Sans version</option>
        </Select>
        <Select
          name="etat"
          defaultValue={sp.etat ?? ""}
          aria-label="État"
          className="w-auto"
        >
          <option value="">Tous états</option>
          <option value="EN_VIE">En vie</option>
          <option value="MORT">Mort</option>
          <option value="PARTI">Parti</option>
          <option value="DISPARU">Disparu</option>
          <option value="PRISON">En prison</option>
        </Select>
        <Select
          name="groupe"
          defaultValue={sp.groupe ?? ""}
          aria-label="Groupe"
          className="w-auto max-w-55"
        >
          <option value="">Tous groupes</option>
          {groupes.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nom}
            </option>
          ))}
          <option value="none">Sans groupe</option>
        </Select>
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-[#22252B] px-4 font-bold text-[#ECECEE] hover:bg-[#2B2E35]"
        >
          Filtrer
        </button>
        {(sp.q || sp.version || sp.etat || sp.groupe) && (
          <Link
            href="/admin/characters"
            className="self-center text-[13px] text-[#A3A8B3] underline"
          >
            Effacer
          </Link>
        )}
      </form>

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
