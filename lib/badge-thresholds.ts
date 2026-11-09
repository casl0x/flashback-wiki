/** Badges de contribution selon le total de points. */
export const BADGE_THRESHOLDS = {
  "first-step": 10,
  contributor: 50,
  expert: 150,
  legend: 300,
} as const;

export function computeBadges(totalPoints: number): string[] {
  return Object.entries(BADGE_THRESHOLDS)
    .filter(([, min]) => totalPoints >= min)
    .map(([key]) => key);
}
