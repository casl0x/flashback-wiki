import { Character, Player, Version, prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    player: true;
    version: true;
    relationsA: { include: { personnageB: { include: { player: true } } } };
    relationsB: { include: { personnageA: { include: { player: true } } } };
  };
}>;

export type WikiData = {
  versions: Version[];
  players: Player[];
  characters: Character[];
  counts: Record<string, number>;
  totalRelations: number;
};

const normalizeReseaux = (value: Prisma.JsonValue): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
};

export async function fetchWikiData(): Promise<WikiData> {
  const emptyWikiData: WikiData = {
    versions: [],
    players: [],
    characters: [],
    counts: {},
    totalRelations: 0,
  };

  try {
    const [versions, players, characters] = await Promise.all([
      prisma.version.findMany({ orderBy: { id: "asc" } }),
      prisma.player.findMany({ orderBy: { pseudo: "asc" } }),
      prisma.character.findMany({
        orderBy: { nom: "asc" },
        include: {
          player: true,
          version: true,
          relationsA: {
            include: { personnageB: { include: { player: true } } },
          },
          relationsB: {
            include: { personnageA: { include: { player: true } } },
          },
        },
      }),
    ]);

    const normalizedVersions = versions.map((version) => ({
      ...version,
      createdAt: version.createdAt.toISOString(),
    }));

    const normalizedPlayers = players.map((player) => ({
      ...player,
      createdAt: player.createdAt.toISOString(),
      reseaux: normalizeReseaux(player.reseaux),
    }));

    const enrichedCharacters = characters.map(
      (character: CharacterWithRelations) => {
        const relations = [
          ...character.relationsA.map((relation) => ({
            id: relation.id,
            type_relation: relation.typeRelation,
            linked: {
              id: relation.personnageB.id,
              nom: relation.personnageB.nom,
              role: relation.personnageB.role,
              metier: relation.personnageB.metier,
              groupe: relation.personnageB.groupe,
              imageUrl: relation.personnageB.imageUrl,
              player_pseudo: relation.personnageB.player?.pseudo ?? null,
            },
          })),
          ...character.relationsB.map((relation) => ({
            id: relation.id,
            type_relation: relation.typeRelationInverse,
            linked: {
              id: relation.personnageA.id,
              nom: relation.personnageA.nom,
              role: relation.personnageA.role,
              metier: relation.personnageA.metier,
              groupe: relation.personnageA.groupe,
              imageUrl: relation.personnageA.imageUrl,
              player_pseudo: relation.personnageA.player?.pseudo ?? null,
            },
          })),
        ];

        const player = character.player
          ? {
              id: character.player.id,
              pseudo: character.player.pseudo,
              stream: character.player.stream,
              lienChaine: character.player.lienChaine,
              reseaux: normalizeReseaux(character.player.reseaux),
              badges: character.player.badges, // ← ajout
            }
          : null;

        const version = character.version
          ? {
              id: character.version.id,
              label: character.version.label,
              color: character.version.color,
            }
          : null;

        return {
          ...character,
          createdAt: character.createdAt.toISOString(),
          player,
          version,
          relations,
          imageUrl: character.imageUrl,
        } as Character;
      },
    );

    const counts: Record<string, number> = {};
    enrichedCharacters.forEach((character) => {
      if (character.versionId) {
        counts[character.versionId] = (counts[character.versionId] || 0) + 1;
      }
    });

    const totalRelations = enrichedCharacters.reduce(
      (accumulator, character) =>
        accumulator + (character.relations?.length || 0),
      0,
    );

    return {
      versions: normalizedVersions,
      players: normalizedPlayers,
      characters: enrichedCharacters,
      counts,
      totalRelations,
    };
  } catch (error) {
    console.error("Failed to load wiki data", error);
    return emptyWikiData;
  }
}

export const getCharacterById = unstable_cache(
  async (id: string) => {
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        player: true,
        version: true,
        relationsA: { include: { personnageB: { include: { player: true } } } },
        relationsB: { include: { personnageA: { include: { player: true } } } },
      },
    });

    if (!character) return null;

    // Normalisation identique à getWikiData
    return {
      ...character,
      createdAt: character.createdAt.toISOString(),
      player: character.player
        ? {
            id: character.player.id,
            pseudo: character.player.pseudo,
            stream: character.player.stream,
            lienChaine: character.player.lienChaine,
            reseaux: normalizeReseaux(character.player.reseaux),
            badges: character.player.badges,
          }
        : null,
      version: character.version
        ? {
            id: character.version.id,
            label: character.version.label,
            color: character.version.color,
          }
        : null,
      relations: [
        ...character.relationsA.map((r) => ({
          id: r.id,
          type_relation: r.typeRelation,
          linked: {
            id: r.personnageB.id,
            nom: r.personnageB.nom,
            role: r.personnageB.role,
            metier: r.personnageB.metier,
            groupe: r.personnageB.groupe,
            player_pseudo: r.personnageB.player?.pseudo ?? null,
            imageUrl: r.personnageB.imageUrl ?? null,
          },
        })),
        ...character.relationsB.map((r) => ({
          id: r.id,
          type_relation: r.typeRelationInverse,
          linked: {
            id: r.personnageA.id,
            nom: r.personnageA.nom,
            role: r.personnageA.role,
            metier: r.personnageA.metier,
            groupe: r.personnageA.groupe,
            player_pseudo: r.personnageA.player?.pseudo ?? null,
            imageUrl: r.personnageA.imageUrl ?? null,
          },
        })),
      ],
    } as Character;
  },
  ["character-by-id"],
  { revalidate: 300, tags: ["wiki-data"] },
);

export const getCharactersByPlayerId = unstable_cache(
  async (playerId: string) => {
    const chars = await prisma.character.findMany({
      where: { playerId },
      include: { player: true, version: true },
      orderBy: { nom: "asc" },
    });

    return chars.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      player: c.player
        ? {
            id: c.player.id,
            pseudo: c.player.pseudo,
            stream: c.player.stream,
            lienChaine: c.player.lienChaine,
            reseaux: normalizeReseaux(c.player.reseaux),
            badges: c.player.badges,
          }
        : null,
      version: c.version
        ? { id: c.version.id, label: c.version.label, color: c.version.color }
        : null,
      relations: [],
    })) as Character[];
  },
  ["characters-by-player"],
  { revalidate: 300, tags: ["wiki-data"] },
);

export const getWikiData = unstable_cache(fetchWikiData, ["wiki-data"], {
  revalidate: 300,
  tags: ["wiki-data"],
});
