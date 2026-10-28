import { ButtonLink, PageHeader, TextInput } from "@/app/_composents/admin/ui";
import { prisma } from "@/lib/db";
import { versionRank } from "@/lib/version-rank";
import { GROUPE_TYPES, GROUPE_TYPE_META, type GroupeType } from "@/lib/groupe-types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminGroupes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: typeParam } = await searchParams;
  const type = GROUPE_TYPES.find((t) => t === typeParam) as GroupeType | undefined;
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (type) params.set("type", type);
  const backHref = params.size
    ? `/admin/groupes?${params.toString()}`
    : "/admin/groupes";
  const editHref = (id: string) =>
    `/admin/groupes/${id}?back=${encodeURIComponent(backHref)}`;
  const groupes = await prisma.groupe.findMany({
    where: {
      ...(q?.trim() ? { nom: { contains: q.trim(), mode: "insensitive" as const } } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { nom: "asc" },
    include: {
      categorie: { select: { nom: true } },
      _count: { select: { grades: true } },
      members: { select: { characterId: true, versionId: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Groupes"
        meta={`${groupes.length} groupe${groupes.length > 1 ? "s" : ""}`}
        actions={
          <ButtonLink href={editHref("new")} variant="primary">
            + Nouveau groupe
          </ButtonLink>
        }
      />
      <form role="search" className="flex gap-2.5">
        <select
          name="type"
          defaultValue={type ?? ""}
          aria-label="Type"
          className="min-h-10 rounded-lg border border-[#3A3E47] bg-[#15171B] px-2.5"
        >
          <option value="">Tous les types</option>
          {GROUPE_TYPES.map((t) => (
            <option key={t} value={t}>
              {GROUPE_TYPE_META[t].plural}
            </option>
          ))}
        </select>
        <TextInput
          name="q"
          defaultValue={q}
          placeholder="Rechercher un groupe…"
          aria-label="Rechercher"
          className="max-w-90"
        />
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-[#22252B] px-4 font-bold hover:bg-[#2B2E35]"
        >
          Rechercher
        </button>
      </form>
      <div className="overflow-x-auto rounded-[10px] border border-[#23262D]">
        <table className="w-full min-w-220 border-collapse text-left">
          <thead>
            <tr className="bg-[#1A1C21] text-[11px] uppercase tracking-widest text-[#A3A8B3]">
              <th scope="col" className="px-3 py-2.5">
                Nom
              </th>
              <th scope="col" className="px-3 py-2.5">
                Type
              </th>
              <th scope="col" className="px-3 py-2.5">
                Catégorie
              </th>
              <th scope="col" className="px-3 py-2.5">
                Slug
              </th>
              <th scope="col" className="px-3 py-2.5">
                Membres
              </th>
              <th scope="col" className="px-3 py-2.5">
                Versions
              </th>
              <th scope="col" className="px-3 py-2.5">
                Grades
              </th>
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groupes.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="bg-[#15171B] px-3 py-8 text-center text-[#9AA0AA]"
                >
                  Aucun groupe.
                </td>
              </tr>
            )}
            {groupes.map((g) => {
              const members = new Set(g.members.map((m) => m.characterId)).size;
              const versions = [
                ...new Set(
                  g.members
                    .map((m) => m.versionId)
                    .filter((v): v is string => !!v),
                ),
              ].sort((a, b) => versionRank(a) - versionRank(b));
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
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {GROUPE_TYPE_META[g.type].label}
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {g.categorie?.nom ?? (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#9AA0AA]">/{g.slug}</td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">{members}</td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {versions.join(", ") || (
                      <span className="text-[#6E7380]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#C4C7CF]">
                    {g._count.grades || (
                      <span className="text-[#6E7380]">—</span>
                    )}
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
