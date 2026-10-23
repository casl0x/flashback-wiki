const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const dtf = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/** « il y a 3 heures », « hier »… */
export function ago(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return "à l’instant";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  return dtf.format(d);
}

export function shortDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  return dtf.format(typeof iso === "string" ? new Date(iso) : iso);
}

export const CHANGELOG_STYLE: Record<string, { label: string; color: string }> = {
  add_global: { label: "ajouté", color: "#6EE7A0" },
  add_relation: { label: "nouvelle relation", color: "#8AB4FF" },
  add_lieu: { label: "lieu ajouté", color: "#F6B26B" },
  edit_info: { label: "infos modifiées", color: "#F6B26B" },
  edit_relation: { label: "relation modifiée", color: "#8AB4FF" },
  edit_lieu: { label: "lieu modifié", color: "#F6B26B" },
  version: { label: "nouvelle version", color: "#C9A8FF" },
  site: { label: "mise à jour du site", color: "#C4C7CF" },
};
