// components/TopPages.tsx
import TopPagesUI from "./TopPagesUI";
import { getWikiData } from "@/lib/wiki-data";

interface TopPagesProps {
  limit?: number;
  since?: "7d" | "30d" | "90d";
  title?: string;
}

interface PageStat {
  path: string;
  name: string;
  views: number;
}

async function fetchTopPersonnages(limit: number, since: string): Promise<PageStat[]> {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    throw new Error("Variables manquantes : VERCEL_API_TOKEN et VERCEL_PROJECT_ID sont requis.");
  }

  const until = new Date();
  const sinceDate = new Date();
  const days = parseInt(since.replace("d", ""));
  sinceDate.setDate(sinceDate.getDate() - days);

  const params = new URLSearchParams({
    projectId,
    by: "requestPath",
    since: sinceDate.toISOString(),
    until: until.toISOString(),
    limit: "100",
    ...(teamId ? { teamId } : {}),
  });

  const res = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vercel API error ${res.status}: ${error}`);
  }

  const json = await res.json();

  // Vraie structure : { data: [{ requestPath, pageviews, visitors }] }
  const rows: { requestPath: string; pageviews: number }[] = json.data ?? [];

  // On garde uniquement les pages /personnages/<uuid>
  const personnageRows = rows
    .filter((r) => /^\/personnages\/[a-z0-9-]{36}$/.test(r.requestPath))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);

  // Résolution UUID → nom via getWikiData
  const { characters } = await getWikiData();
  const charMap = new Map(characters.map((c: any) => [c.id, c.name]));

  return personnageRows.map((r) => {
    const uuid = r.requestPath.replace("/personnages/", "");
    return {
      path: r.requestPath,
      name: charMap.get(uuid) ?? uuid, // fallback sur l'UUID si pas trouvé
      views: r.pageviews,
    };
  });
}

export default async function TopPages({
  limit = 10,
  since = "30d",
  title = "Personnages les plus consultés",
}: TopPagesProps) {
  let pages: PageStat[] = [];
  let errorMessage: string | null = null;

  try {
    pages = await fetchTopPersonnages(limit, since);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
  }

  return <TopPagesUI pages={pages} error={errorMessage} title={title} since={since} />;
}