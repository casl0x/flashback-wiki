import { visibleCharacter } from "@/lib/hidden-characters";
import { prisma } from "@/lib/db";

export type FavoriteItem = {
  kind: "PLAYER" | "CHARACTER";
  id: string;
  name: string;
  imageUrl: string | null;
};

/** Favoris d'un profil, résolus en fiches existantes (les plus récents d'abord). */
export async function loadFavoriteItems(userProfileId: string): Promise<FavoriteItem[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userProfileId },
    orderBy: { createdAt: "desc" },
  });
  const charIds = favorites.filter((f) => f.kind === "CHARACTER").map((f) => f.targetId);
  const playerIds = favorites.filter((f) => f.kind === "PLAYER").map((f) => f.targetId);

  const [characters, players] = await Promise.all([
    charIds.length
      ? prisma.character.findMany({
          where: { AND: [{ id: { in: charIds } }, visibleCharacter] },
          select: { id: true, nom: true, imageUrl: true },
        })
      : [],
    playerIds.length
      ? prisma.player.findMany({
          where: { id: { in: playerIds } },
          select: { id: true, pseudo: true, imageUrl: true },
        })
      : [],
  ]);
  const charById = new Map(characters.map((c) => [c.id, c]));
  const playerById = new Map(players.map((p) => [p.id, p]));

  const items: FavoriteItem[] = [];
  for (const f of favorites) {
    if (f.kind === "CHARACTER") {
      const c = charById.get(f.targetId);
      if (c) items.push({ kind: "CHARACTER", id: c.id, name: c.nom, imageUrl: c.imageUrl });
    } else {
      const p = playerById.get(f.targetId);
      if (p) items.push({ kind: "PLAYER", id: p.id, name: p.pseudo, imageUrl: p.imageUrl });
    }
  }
  return items;
}
