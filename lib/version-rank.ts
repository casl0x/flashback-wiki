// Numéro de version pour trier dans l'ordre chronologique (V1 < V2 < … ; le reste à la fin).
export function versionRank(id: string | null | undefined): number {
  const n = id?.match(/\d+/)?.[0];
  return n ? Number(n) : 999;
}
