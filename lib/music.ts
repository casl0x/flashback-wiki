import { prisma } from "@/lib/db";
import { detectSoundPlatform, type SoundPlatform } from "@/lib/media-embed";
import { unstable_cache } from "next/cache";

export type MusicTrack = {
  id: string;
  titre: string;
  artiste: string | null;
  url: string;
  platform: SoundPlatform;
  character: { id: string; nom: string };
};

export type MusicPlayer = {
  id: string;
  pseudo: string;
  imageUrl: string | null;
  tracks: MusicTrack[];
};

/** Sons d'un joueur = sons de tous ses persos. */
export const toTracks = (
  characters: {
    id: string;
    nom: string;
    sounds: { id: string; titre: string; artiste: string | null; url: string; platform: string | null }[];
  }[],
): MusicTrack[] =>
  characters.flatMap((c) =>
    c.sounds.map((s) => ({
      id: s.id,
      titre: s.titre,
      artiste: s.artiste,
      url: s.url,
      platform: detectSoundPlatform(s.url, s.platform),
      character: { id: c.id, nom: c.nom },
    })),
  );

async function loadMusicPlayers(): Promise<MusicPlayer[]> {
  try {
    const players = await prisma.player.findMany({
      where: { characters: { some: { sounds: { some: {} } } } },
      orderBy: { pseudo: "asc" },
      select: {
        id: true,
        pseudo: true,
        imageUrl: true,
        characters: {
          where: { sounds: { some: {} } },
          orderBy: { nom: "asc" },
          select: {
            id: true,
            nom: true,
            sounds: {
              orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
              select: { id: true, titre: true, artiste: true, url: true, platform: true },
            },
          },
        },
      },
    });
    return players.map((p) => ({
      id: p.id,
      pseudo: p.pseudo.trim() || "Joueur",
      imageUrl: p.imageUrl,
      tracks: toTracks(p.characters),
    }));
  } catch (error) {
    console.error("Failed to load music players", error);
    return [];
  }
}

export const getMusicPlayers = unstable_cache(loadMusicPlayers, ["music-players"], {
  revalidate: 300,
  tags: ["wiki-data"],
});
