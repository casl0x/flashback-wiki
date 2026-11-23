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

// Une couleur par catégorie (perso, relation, lieu, version, joueur, groupe, lore, site) ;
// ajout / modification / suppression se distinguent par le libellé.
const C = {
  perso: "#4ADE80",
  relation: "#5B8DEF",
  lieu: "#FB923C",
  version: "#A78BFA",
  joueur: "#F472B6",
  groupe: "#FACC15",
  lore: "#22D3EE",
  site: "#A3A8B3",
};

export const CHANGELOG_STYLE: Record<string, { label: string; color: string }> = {
  add_global: { label: "ajouté", color: C.perso },
  edit_info: { label: "infos modifiées", color: C.perso },
  add_relation: { label: "nouvelle relation", color: C.relation },
  edit_relation: { label: "relation modifiée", color: C.relation },
  add_lieu: { label: "lieu ajouté", color: C.lieu },
  edit_lieu: { label: "lieu modifié", color: C.lieu },
  version: { label: "nouvelle version", color: C.version },
  add_player: { label: "joueur ajouté", color: C.joueur },
  edit_player: { label: "joueur modifié", color: C.joueur },
  delete_player: { label: "joueur supprimé", color: C.joueur },
  add_groupe: { label: "groupe ajouté", color: C.groupe },
  edit_groupe: { label: "groupe modifié", color: C.groupe },
  delete_groupe: { label: "groupe supprimé", color: C.groupe },
  add_lore: { label: "lore ajouté", color: C.lore },
  edit_lore: { label: "lore modifié", color: C.lore },
  delete_lore: { label: "lore supprimé", color: C.lore },
  site: { label: "mise à jour du site", color: C.site },
};
