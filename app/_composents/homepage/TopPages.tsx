// components/TopPages.tsx
import { getWikiData } from "@/lib/wiki-data";
import TopPagesUI from "./TopPagesUI";

interface TopPagesProps {
  limit?: number;
  since?: "7d" | "30d" | "90d";
  title?: string;
}

interface PageStat {
  path: string;
  name: string;
  image: string;
  views: number;
  version: string;
  versionId: string;
  versionColor: string;
}

export async function fetchTopPersonnages(
  limit: number,
  since: string,
): Promise<PageStat[]> {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    throw new Error(
      "Variables manquantes : VERCEL_API_TOKEN et VERCEL_PROJECT_ID sont requis.",
    );
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
    },
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Vercel API error ${res.status}: ${error}`);
  }

  const json = await res.json();

  // Vraie structure : { data: [{ requestPath, pageviews, visitors }] }
  const rows: { requestPath: string; pageviews: number }[] = json.data ?? [];

  // Le cache Next.js peut refuser les données du wiki lorsqu'elles dépassent 2 Mo.
  // Dans ce cas, les analytics restent affichables avec l'UUID comme fallback.
  type CharacterMeta = {
    name: string;
    image: string;
    version: string;
    versionId: string;
    versionColor: string;
  };
  let charMap = new Map<string, CharacterMeta>();
  let wikiDataUnavailable = false;

  try {
    const { characters } = await getWikiData();
    charMap = new Map(
      characters.map((c) => [
        c.id,
        {
          name: c.nom,
          image: (() => {
            const character = c as typeof c & {
              image_url?: string | null;
              imageUrl?: string | null;
              image?: string | { url?: string | null } | null;
              avatar?: string | null;
            };

            if (character.imageUrl) {
              return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_480,c_fill,g_face,q_auto/${character.imageUrl}`;
            }
            if (typeof character.image === "string") return character.image;
            return (
              character.image_url ??
              character.imageUrl ??
              character.image?.url ??
              character.avatar ??
              ""
            );
          })(),
          version: c.version?.label ?? "",
          versionId:
            (c.version as typeof c.version & { id?: string })?.id ?? "",
          versionColor:
            (c.version as typeof c.version & { color?: string })?.color ?? "",
        },
      ]),
    );
  } catch {
    wikiDataUnavailable = true;
  }

  // Les analytics peuvent contenir le slug seul ou une URL complète. Utiliser
  // uniquement des personnages connus évite de générer des liens invalides.
  const personnageRows = rows
    .map((row) => {
      const rawPath = row.requestPath.trim().replace(/\/+$/, "");
      const uuid = rawPath.split("/").pop() ?? "";

      if (
        !uuid ||
        (!wikiDataUnavailable && !charMap.has(uuid)) ||
        !Number.isFinite(row.pageviews)
      ) {
        return null;
      }

      return { ...row, uuid };
    })
    .filter(
      (row): row is { requestPath: string; pageviews: number; uuid: string } =>
        row !== null,
    )
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, limit);

  return personnageRows.map((r) => {
    const uuid = r.uuid;
    return {
      path: `/personnages/${uuid}`,
      name: charMap.get(uuid)?.name ?? uuid, // fallback sur l'UUID si pas trouvé
      image: charMap.get(uuid)?.image ?? "",
      views: r.pageviews,
      version: charMap.get(uuid)?.version ?? "",
      versionId: charMap.get(uuid)?.versionId ?? "",
      versionColor: charMap.get(uuid)?.versionColor ?? "",
    };
  });
}

export default async function TopPages({
  limit = 10,
  since = "30d",
  title = "Les plus consultés",
}: TopPagesProps) {
  let pages: PageStat[] = [];
  let errorMessage: string | null = null;

  try {
    pages = await fetchTopPersonnages(limit, since);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
  }

  return (
    <TopPagesUI
      pages={pages}
      error={errorMessage}
      title={title}
      since={since}
    />
  );
}
