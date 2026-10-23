import { prisma } from "@/lib/db";

export type VersionBand = {
  id: string; // "V6"
  num: string; // "6"
  label: string; // "Version 6"
  color: string;
  imageUrl: string | null;
  periode: string | null; // "mars 2024 – juin 2025"
  count: number;
  enCours: boolean;
};

const moisAnnee = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

function formatPeriode(
  debut: Date | null,
  fin: Date | null,
  enCours: boolean,
): string | null {
  if (!debut) return null;
  if (enCours || !fin) return `depuis ${moisAnnee.format(debut)}`;
  return `${moisAnnee.format(debut)} – ${moisAnnee.format(fin)}`;
}

/** Bandes de l'explorateur de versions (accueil), dans l'ordre défini dans l'admin. */
export async function getVersionBands(): Promise<VersionBand[]> {
  const versions = await prisma.version.findMany({
    orderBy: [{ ordre: "asc" }, { id: "asc" }],
    include: { _count: { select: { characters: true } } },
  });

  return versions.map((v) => ({
    id: v.id,
    num: v.id.replace(/^V/i, ""),
    label: v.label,
    color: v.color,
    imageUrl: v.imageUrl,
    periode: formatPeriode(v.dateDebut, v.dateFin, v.enCours),
    count: v._count.characters,
    enCours: v.enCours,
  }));
}
