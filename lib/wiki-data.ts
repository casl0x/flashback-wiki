import { Character, Groupe, Player, Version, prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

type CharacterWithRelations = Prisma.CharacterGetPayload<{
  include: {
    player: true;
    version: true;
    groupes: true;
    relationsA: {
      include: {
        personnageB: { include: { player: true; groupes: true } };
      };
    };
    relationsB: {
      include: {
        personnageA: { include: { player: true; groupes: true } };
      };
    };
  };
}>;

export type WikiData = {
  versions: Version[];
  players: Player[];
  characters: Character[];
  groupes: Groupe[];
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

const normalizeGroupes = (
  groupes: { id: string; slug: string; nom: string; color: string | null }[],
) =>
  groupes.map((g) => ({ id: g.id, slug: g.slug, nom: g.nom, color: g.color }));

const buildPlayerSummary = (
  player: {
    id: string;
    pseudo: string;
    stream: boolean;
    lienChaine: string | null;
    reseaux: Prisma.JsonValue;
    badges: string[];
  } | null,
) =>
  player
    ? {
        id: player.id,
        pseudo: player.pseudo,
        stream: player.stream,
        lienChaine: player.lienChaine,
        reseaux: normalizeReseaux(player.reseaux),
        badges: player.badges,
      }
    : null;

const buildVersionSummary = (
  version: {
    id: string;
    label: string;
    color: string | null;
    description: string | null;
  } | null,
) =>
  version
    ? {
        id: version.id,
        label: version.label,
        color: version.color,
        description: version.description,
      }
    : null;

const emptyWikiData: WikiData = {
  versions: [],
  players: [],
  characters: [],
  groupes: [],
  counts: {},
  totalRelations: 0,
};

// Payload léger (sans le détail des relations) utilisé par les pages publiques :
// avec le détail complet, le JSON dépasse la limite de 2 Mo du data cache de
// Next.js et unstable_cache refuse silencieusement de le mettre en cache.
export async function fetchWikiData(): Promise<WikiData> {
  try {
    const [versions, players, characters, groupes] = await Promise.all([
      prisma.version.findMany({ orderBy: { id: "asc" } }),
      prisma.player.findMany({ orderBy: { pseudo: "asc" } }),
      prisma.character.findMany({
        orderBy: { nom: "asc" },
        include: {
          player: true,
          version: true,
          groupes: true,
          _count: { select: { relationsA: true, relationsB: true } },
        },
      }),
      prisma.groupe.findMany({ orderBy: { nom: "asc" } }),
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

    const enrichedCharacters = characters.map((character) => ({
      ...character,
      createdAt: character.createdAt.toISOString(),
      player: buildPlayerSummary(character.player),
      version: buildVersionSummary(character.version),
      groupes: normalizeGroupes(character.groupes),
      relations: [],
      imageUrl: character.imageUrl,
    })) as Character[];

    const counts: Record<string, number> = {};
    enrichedCharacters.forEach((character) => {
      if (character.versionId) {
        counts[character.versionId] = (counts[character.versionId] || 0) + 1;
      }
    });

    const totalRelations = characters.reduce(
      (accumulator, character) =>
        accumulator +
        character._count.relationsA +
        character._count.relationsB,
      0,
    );

    return {
      versions: normalizedVersions,
      players: normalizedPlayers,
      characters: enrichedCharacters,
      groupes: groupes.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
      })),
      counts,
      totalRelations,
    };
  } catch (error) {
    console.error("Failed to load wiki data", error);
    return emptyWikiData;
  }
}

// Payload complet (avec le détail des relations par personnage), utilisé
// uniquement par l'admin. Non mis en cache via unstable_cache pour ne pas
// heurter la même limite de taille : /api/data est déjà appelée sans cache
// HTTP (cache: "no-store") et sert un usage à faible trafic.
export async function fetchWikiDataWithRelations(): Promise<WikiData> {
  try {
    const [versions, players, characters, groupes] = await Promise.all([
      prisma.version.findMany({ orderBy: { id: "asc" } }),
      prisma.player.findMany({ orderBy: { pseudo: "asc" } }),
      prisma.character.findMany({
        orderBy: { nom: "asc" },
        include: {
          player: true,
          version: true,
          groupes: true,
          relationsA: {
            include: {
              personnageB: { include: { player: true, groupes: true } },
            },
          },
          relationsB: {
            include: {
              personnageA: { include: { player: true, groupes: true } },
            },
          },
        },
      }),
      prisma.groupe.findMany({ orderBy: { nom: "asc" } }),
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
              groupes: normalizeGroupes(relation.personnageB.groupes),
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
              groupes: normalizeGroupes(relation.personnageA.groupes),
              imageUrl: relation.personnageA.imageUrl,
              player_pseudo: relation.personnageA.player?.pseudo ?? null,
            },
          })),
        ];

        return {
          ...character,
          createdAt: character.createdAt.toISOString(),
          player: buildPlayerSummary(character.player),
          version: buildVersionSummary(character.version),
          groupes: normalizeGroupes(character.groupes),
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
      groupes: groupes.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
      })),
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
        groupes: true,
        relationsA: {
          include: {
            personnageB: { include: { player: true, groupes: true } },
          },
        },
        relationsB: {
          include: {
            personnageA: { include: { player: true, groupes: true } },
          },
        },
      },
    });

    if (!character) return null;

    return {
      ...character,
      createdAt: character.createdAt.toISOString(),
      player: buildPlayerSummary(character.player),
      version: buildVersionSummary(character.version),
      groupes: normalizeGroupes(character.groupes),
      relations: [
        ...character.relationsA.map((r) => ({
          id: r.id,
          type_relation: r.typeRelation,
          linked: {
            id: r.personnageB.id,
            nom: r.personnageB.nom,
            role: r.personnageB.role,
            metier: r.personnageB.metier,
            groupes: normalizeGroupes(r.personnageB.groupes),
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
            groupes: normalizeGroupes(r.personnageA.groupes),
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
      include: { player: true, version: true, groupes: true },
      orderBy: { nom: "asc" },
    });

    return chars.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      player: buildPlayerSummary(c.player),
      version: buildVersionSummary(c.version),
      groupes: normalizeGroupes(c.groupes),
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
