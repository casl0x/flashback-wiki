import { prisma } from "@/lib/db";
import { parseClipInputs } from "@/lib/lore";
import LoreManager from "./LoreManager";

export const dynamic = "force-dynamic";

export default async function AdminLore({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; id?: string }>;
}) {
  const { v, id } = await searchParams;
  const [versions, events, characters, groupes] = await Promise.all([
    prisma.version.findMany({
      select: { id: true, label: true, color: true },
      orderBy: [{ ordre: "asc" }, { id: "asc" }],
    }),
    prisma.loreEvent.findMany({
      orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
      include: {
        characters: { select: { characterId: true } },
        groupes: { select: { groupeId: true } },
      },
    }),
    prisma.character.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.groupe.findMany({ select: { id: true, nom: true, type: true }, orderBy: { nom: "asc" } }),
  ]);

  // Même ordre que dans Admin > Versions et sur la page publique.
  const sorted = versions;
  const versionId = sorted.find((x) => x.id === v)?.id ?? sorted[0]?.id ?? "";
  const inVersion = events.filter((e) => e.versionId === versionId);
  const selected =
    id === "new" || id === "new-text" ? id : (inVersion.find((e) => e.id === id)?.id ?? inVersion[0]?.id ?? "new");

  return (
    <LoreManager
      key={`${versionId}:${selected}`}
      versionId={versionId}
      selected={selected}
      versions={sorted.map((x) => ({
        ...x,
        count: events.filter((e) => e.versionId === x.id).length,
      }))}
      events={inVersion.map((e) => ({
        id: e.id,
        kind: e.kind,
        titre: e.titre,
        resume: e.resume,
        contenu: e.contenu ?? "",
        major: e.major,
        versionId: e.versionId,
        clips: parseClipInputs(e.clips),
        characterIds: e.characters.map((c) => c.characterId),
        groupeIds: e.groupes.map((g) => g.groupeId),
      }))}
      characters={characters.map((c) => ({ value: c.id, label: c.nom }))}
      groupes={groupes.map((g) => ({ value: g.id, label: g.nom, hint: g.type }))}
    />
  );
}
