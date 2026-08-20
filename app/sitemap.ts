import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db' 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [characters, players] = await Promise.all([
    prisma.character.findMany({
      select: { id: true, createdAt: true },
    }),
    prisma.player.findMany({
      select: { id: true, createdAt: true },
    }),
  ])

  const characterUrls = characters.map((c) => ({
    url: `https://flashback-wiki.vercel.app/personnages/${c.id}`,
    lastModified: c.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const playerUrls = players.map((p) => ({
    url: `https://flashback-wiki.vercel.app/joueurs/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: 'https://flashback-wiki.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://flashback-wiki.vercel.app/personnages',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://flashback-wiki.vercel.app/musiques',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://flashback-wiki.vercel.app/createurs',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...characterUrls,
    ...playerUrls,
  ]
}
