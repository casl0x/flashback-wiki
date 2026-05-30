import { Character, Player, Version, prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

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

export async function getWikiData(): Promise<WikiData> {
  const normalizeReseaux = (
    value: Prisma.JsonValue,
  ): Record<string, string> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] => {
        return typeof entry[1] === "string";
      }),
    );
  };

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
