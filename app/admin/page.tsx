import { prisma } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [totalChars, totalPlayers, totalVersions, totalRels, totalSuggestions, recentChangelog] =
    await Promise.all([
      prisma.character.count(),
      prisma.player.count(),
      prisma.version.count(),
      prisma.relation.count(),
      prisma.suggestion.count({ where: { status: "pending" } }),
      prisma.changelogEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <DashboardClient
      stats={{ totalChars, totalPlayers, totalVersions, totalRels, totalSuggestions }}
      recentChangelog={recentChangelog}
    />
  );
}