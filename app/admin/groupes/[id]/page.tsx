import { versionRank } from "@/lib/version-rank";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import GroupeEditor from "./GroupeEditor";

export const dynamic = "force-dynamic";

export default async function EditGroupePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [g, others, versions] = await Promise.all([
    isNew
      ? null
      : prisma.groupe.findUnique({
          where: { id },
          include: {
            grades: { orderBy: { ordre: "asc" }, include: { _count: { select: { members: true } } } },
            members: { select: { characterId: true, versionId: true } },
          },
        }),
    prisma.groupe.findMany({ where: isNew ? {} : { NOT: { id } }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
    prisma.version.findMany({ select: { id: true, color: true } }),
  ]);
  if (!isNew && !g) notFound();

  const color = new Map(versions.map((v) => [v.id, v.color]));
  const perVersion = new Map<string, Set<string>>();
  for (const m of g?.members ?? []) {
    if (!m.versionId) continue;
    if (!perVersion.has(m.versionId)) perVersion.set(m.versionId, new Set());
    perVersion.get(m.versionId)!.add(m.characterId);
  }
  const presence = [...perVersion.entries()]
    .sort(([a], [b]) => versionRank(b) - versionRank(a))
    .map(([v, s]) => ({ id: v, color: color.get(v) ?? "#C4C7CF", count: s.size }));

  return (
    <GroupeEditor
      key={g?.id ?? "new"}
      initial={{
        id: g?.id ?? null,
        nom: g?.nom ?? "",
        slug: g?.slug ?? "",
        color: g?.color ?? "#2F6FEB",
        description: g?.description ?? "",
        imageUrl: g?.imageUrl ?? null,
        grades: (g?.grades ?? []).map((gr) => ({ key: gr.id, id: gr.id, nom: gr.nom, niveau: gr.niveau ?? "", members: gr._count.members })),
      }}
      members={g ? new Set(g.members.map((m) => m.characterId)).size : 0}
      presence={presence}
      others={others}
    />
  );
}
