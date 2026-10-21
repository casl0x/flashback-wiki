import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Normalise une chaîne pour la recherche : enlève les accents, met en
// minuscule et retire les espaces superflus, pour que "etienne" trouve
// "Étienne" et que "  Tony  " se comporte comme "Tony".
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Vrai si `haystack` contient `query` une fois les deux normalisés
// (insensible aux accents, à la casse et aux espaces superflus).
// Une query vide matche toujours.
export function matchesSearch(
  haystack: string | null | undefined,
  query: string,
): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  if (!haystack) return false;
  return normalizeSearch(haystack).includes(q);
}

export function statusBorderClass(status: string | null | undefined) {
  return (
    {
      Civil: "border-t-[#4ade80]",
      Illégal: "border-t-[#f87171]",
    }[status ?? ""] ?? "border-t-[var(--accent)]"
  );
}

export function statusBadgeClass(status: string) {
  return (
    {
      Civil: "bg-[#1a2e1a] text-[#4ade80] border-[#1a4a1a]",
      Illégal: "bg-[#2e1010] text-[#f87171] border-[#4a1a1a]",
    }[status] ??
    "bg-[var(--accent-bg)] text-[var(--accent-light)] border-[var(--border-accent)]"
  );
}

export function getAvatarColors(color: string) {
  return {
    bg: `${color}18`, // ~9% opacité
    fg: color,
    bd: `${color}40`, // ~25% opacité
  };
}

export type StreamPlatform = "twitch" | "kick";

// Un seul champ (lien chaîne) sert pour Twitch ou Kick — la plateforme
// se déduit du domaine présent dans l'URL stockée.
export function detectStreamPlatform(
  url: string | null | undefined,
): StreamPlatform | null {
  if (!url) return null;
  if (url.includes("twitch.tv")) return "twitch";
  if (url.includes("kick.com")) return "kick";
  return null;
}

export function extractStreamUsername(
  url: string | null | undefined,
): string | null {
  const platform = detectStreamPlatform(url);
  if (!platform || !url) return null;
  const marker = platform === "twitch" ? "twitch.tv/" : "kick.com/";
  const username = url.split(marker)[1]?.split("/")[0]?.split("?")[0];
  return username?.trim().toLowerCase() || null;
}

export function authHeaders(token: string) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}

// Mentions de personnages dans un texte libre (ex. description), au
// format @[Nom](id) — le nom est stocké dans le texte lui-même pour ne
// nécessiter aucune résolution supplémentaire à l'affichage.
export const MENTION_PATTERN = /@\[([^\]]+)\]\(([a-zA-Z0-9_-]+)\)/g;

// Remplace chaque mention par son nom en clair, sans lien — pour les
// aperçus en texte brut (ex. carte personnage) où un lien n'a pas sa place.
export function stripMentions(text: string): string {
  return text.replace(MENTION_PATTERN, "$1");
}
