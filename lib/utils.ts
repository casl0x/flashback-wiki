import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
