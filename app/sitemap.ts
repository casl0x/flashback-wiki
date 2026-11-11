import { prisma } from "@/lib/db";
import { groupeHref } from "@/lib/groupe-types";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

// Régénéré au plus toutes les heures : pas de requête DB à chaque passage de bot.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [characters, players, groupes] = await Promise.all([
    prisma.character.findMany({ select: { id: true, updatedAt: true } }),
    prisma.player.findMany({ select: { id: true, updatedAt: true } }),
    prisma.groupe.findMany({ select: { slug: true, type: true, updatedAt: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/personnages`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/classement`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/musiques`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/createurs`, changeFrequency: "weekly", priority: 0.6 },
  ];

  return [
    ...staticPages,
    ...characters.map((c) => ({
      url: `${SITE_URL}/personnages/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...groupes.map((g) => ({
      url: `${SITE_URL}${groupeHref(g)}`,
      lastModified: g.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...players.map((p) => ({
      url: `${SITE_URL}/joueurs/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
