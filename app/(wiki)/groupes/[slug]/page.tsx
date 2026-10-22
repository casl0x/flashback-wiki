import BackButton from "@/components/BackButton";
import CharactersGrid from "@/components/wiki/CharactersGrid";
import { Character, prisma } from "@/lib/db";
import { buildCurrentGroupes, buildCurrentVersion } from "@/lib/wiki-data";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function GroupePage({ params }: Props) {
  const { slug } = await params;

  const groupe = await prisma.groupe.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          character: {
            include: {
              player: true,
              versions: true,
              groupes: { include: { groupe: true } },
            },
          },
        },
        orderBy: { character: { nom: "asc" } },
      },
    },
  });

  if (!groupe) notFound();

  const characters = groupe.members.map((m) => {
    const version = buildCurrentVersion(m.character.versions);
    return {
      ...m.character,
      createdAt: m.character.createdAt.toISOString(),
      player: m.character.player,
      version,
      versionId: version?.id ?? null,
      groupes: buildCurrentGroupes(m.character.groupes),
      relations: [],
    } as unknown as Character;
  });

  type VersionGroup = {
    version: { id: string; label: string; color: string | null } | null;
    chars: typeof characters;
  };

  const byVersion: Record<string, VersionGroup> = {};
  for (const c of characters) {
    const key = c.versionId ?? "__none__";
    if (!byVersion[key])
      byVersion[key] = { version: c.version ?? null, chars: [] };
    byVersion[key].chars.push(c);
  }

  const versionGroups = Object.entries(byVersion).sort(([a], [b]) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    return a.localeCompare(b);
  });

  const totalPlayers = new Set(
    characters.map((c) => c.playerId).filter(Boolean),
  ).size;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        <div className="flex-1 p-4 lg:p-5">
          <BackButton />
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              {groupe.color && (
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: groupe.color }}
                />
              )}
              <h1 className="font-display font-bold text-xl text-text-primary tracking-wide">
                {groupe.nom}
              </h1>
            </div>
            {groupe.description && (
              <p className="mt-2 text-xs text-text-secondary leading-relaxed max-w-2xl">
                {groupe.description}
              </p>
            )}
          </div>

          {/* Sections par version */}
          <div className="flex flex-col gap-8">
            {versionGroups.map(([key, { version, chars }]) => (
              <div key={key}>
                {/* Séparateur version */}
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: version?.color ?? "var(--accent)",
                    }}
                  />
                  <div className="h-px flex-1 bg-border" />
                  {versionGroups.length > 1 && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest shrink-0"
                      style={{ color: version?.color ?? "var(--accent)" }}
                    >
                      {version?.label ?? "Sans version"} · {chars.length} membre
                      {chars.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <CharactersGrid chars={chars} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
