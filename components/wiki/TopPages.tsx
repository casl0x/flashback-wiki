// components/TopPages.tsx
// Server Component — appelle l'API Vercel côté serveur (token jamais exposé)
// Usage : <TopPages pathPrefix="/personnages" limit={10} since="30d" />

import TopPagesUI from "./TopPagesUI";

interface TopPagesProps {
  /** Filtre sur un préfixe de chemin, ex: "/personnages" */
  pathPrefix?: string;
  /** Nombre de pages à afficher (défaut : 10) */
  limit?: number;
  /** Fenêtre temporelle : "7d" | "30d" | "90d" (défaut : "30d") */
  since?: "7d" | "30d" | "90d";
  /** Titre affiché dans le composant */
  title?: string;
}

interface PageStat {
  path: string;
  views: number;
}

async function fetchTopPages(
  limit: number,
  since: string,
  pathPrefix?: string
): Promise<PageStat[]> {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    throw new Error(
      "Variables manquantes : VERCEL_API_TOKEN et VERCEL_PROJECT_ID sont requis."
    );
  }

  // Conversion de la durée relative en dates ISO
  const until = new Date();
  const sinceDate = new Date();
  const days = parseInt(since.replace("d", ""));
  sinceDate.setDate(sinceDate.getDate() - days);

  const params = new URLSearchParams({
      projectId,
      by: "requestPath",
      since: sinceDate.toISOString(),
      until: until.toISOString(),
      limit: "100", // on prend plus pour avoir assez à filtrer
      ...(teamId ? { teamId } : {}),
      // plus de filter: ici
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

  const data = await res.json();
  console.log("Vercel API response:", JSON.stringify(data, null, 2));
  const rows: { requestPath: string; count: number }[] = data.rows ?? [];

  return rows
    .map((r) => ({ path: r.requestPath, views: r.count }))
    .filter((r) => !pathPrefix || r.path.startsWith(pathPrefix)) // filtre JS
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export default async function TopPages({
  pathPrefix,
  limit = 10,
  since = "30d",
  title,
}: TopPagesProps) {
  // Titre par défaut selon le contexte
  const resolvedTitle =
    title ?? (pathPrefix ? `Top ${pathPrefix}` : "Pages les plus vues");

  let pages: PageStat[] = [];
  let errorMessage: string | null = null;

  try {
    pages = await fetchTopPages(limit, since, pathPrefix);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
  }

  return (
    <TopPagesUI
      pages={pages}
      error={errorMessage}
      title={resolvedTitle}
      since={since}
      pathPrefix={pathPrefix}
    />
  );
}