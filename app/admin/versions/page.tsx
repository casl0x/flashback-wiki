import { prisma } from "@/lib/db";
import VersionsManager from "./VersionsManager";

export const dynamic = "force-dynamic";

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function AdminVersions({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const versions = await prisma.version.findMany({
    orderBy: [{ ordre: "asc" }, { id: "asc" }],
    include: { _count: { select: { characters: true } } },
  });
  const selected = id === "new" ? "new" : (versions.find((v) => v.id === id)?.id ?? versions[0]?.id ?? "new");

  return (
    <VersionsManager
      key={selected}
      selected={selected}
      versions={versions.map((v) => ({
        id: v.id,
        label: v.label,
        color: v.color,
        description: v.description ?? "",
        imageUrl: v.imageUrl,
        dateDebut: day(v.dateDebut),
        dateFin: day(v.dateFin),
        enCours: v.enCours,
        count: v._count.characters,
      }))}
    />
  );
}
