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

export function authHeaders(token: string) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}
