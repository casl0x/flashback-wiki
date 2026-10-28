import { prisma } from "@/lib/db";
import { versionRank } from "@/lib/version-rank";
import { notFound } from "next/navigation";
import CharacterEditor, { type EditorCharacter } from "./CharacterEditor";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ player?: string; back?: string }>;
};

export default async function EditCharacterPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { player, back } = await searchParams;
  const isNew = id === "new";

  const [c, players, versions, groupes, characters] = await Promise.all([
    isNew
      ? null
      : prisma.character.findUnique({
          where: { id },
          include: {
            versions: { select: { id: true } },
            groupes: { orderBy: { ordre: "asc" } },
            sounds: { orderBy: { ordre: "asc" } },
            relationsA: true,
            relationsB: true,
          },
        }),
    prisma.player.findMany({ orderBy: { pseudo: "asc" }, select: { id: true, pseudo: true } }),
    prisma.version.findMany({ orderBy: [{ ordre: "asc" }, { id: "asc" }], select: { id: true, label: true, color: true } }),
    prisma.groupe.findMany({
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, color: true, grades: { orderBy: { ordre: "asc" }, select: { id: true, nom: true } } },
    }),
    prisma.character.findMany({
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, player: { select: { pseudo: true } } },
    }),
  ]);

  if (!isNew && !c) notFound();

  const initial: EditorCharacter = c
    ? {
        id: c.id,
        nom: c.nom,
        role: c.role,
        etatVie: c.etatVie,
        description: c.description ?? "",
        lienReddif: c.lienReddif ?? "",
        imageUrl: c.imageUrl,
        playerId: c.playerId,
        versionIds: c.versions.map((v) => v.id),
        locationX: c.locationX,
        locationY: c.locationY,
        createdAt: c.createdAt.toISOString(),
        memberships: c.groupes.map((m) => ({
          key: m.id,
          groupeId: m.groupeId,
          versionId: m.versionId,
          gradeId: m.gradeId,
          matricule: m.matricule ?? "",
        })),
        sounds: c.sounds.map((s) => ({ key: s.id, titre: s.titre, artiste: s.artiste ?? "", url: s.url })),
        // Point de vue de ce perso (voir lib/character-page.ts).
        relations: [
          ...c.relationsA.map((r) => ({ key: r.id, otherId: r.personnageBId, type: r.typeRelation ?? "", inverse: r.typeRelationInverse ?? "" })),
          ...c.relationsB.map((r) => ({ key: r.id, otherId: r.personnageAId, type: r.typeRelationInverse ?? "", inverse: r.typeRelation ?? "" })),
        ],
      }
    : {
        id: null,
        nom: "",
        role: null,
        etatVie: "EN_VIE",
        description: "",
        lienReddif: "",
        imageUrl: null,
        playerId: player && players.some((p) => p.id === player) ? player : null,
        versionIds: [],
        locationX: null,
        locationY: null,
        createdAt: null,
        memberships: [],
        sounds: [],
        relations: [],
      };

  const backHref = back && back.startsWith("/admin/") ? back : "/admin/characters";

  return (
    <CharacterEditor
      key={initial.id ?? "new"}
      initial={initial}
      backHref={backHref}
      players={players}
      versions={[...versions].sort((a, b) => versionRank(a.id) - versionRank(b.id))}
      groupes={groupes}
      characters={characters.map((x) => ({ id: x.id, nom: x.nom, pseudo: x.player?.pseudo ?? null }))}
    />
  );
}
