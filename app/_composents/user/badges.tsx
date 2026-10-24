export const BADGES_CONFIG = [
  {
    key: "first-step",
    label: "Premier pas",
    description: "Première suggestion acceptée",
    icon: "⭐",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
  },
  {
    key: "contributor",
    label: "Contributeur",
    description: "5 suggestions acceptées",
    icon: "🔷",
    color: "#7F77DD",
    bg: "rgba(127,119,221,0.12)",
    border: "rgba(127,119,221,0.3)",
  },
  {
    key: "expert",
    label: "Expert",
    description: "15 suggestions acceptées",
    icon: "💎",
    color: "#1d9e75",
    bg: "rgba(29,158,117,0.12)",
    border: "rgba(29,158,117,0.3)",
  },
  {
    key: "legend",
    label: "Légende",
    description: "30 suggestions acceptées",
    icon: "👑",
    color: "#e11d48",
    bg: "rgba(225,29,72,0.12)",
    border: "rgba(225,29,72,0.3)",
  },
  {
    key: "first-creation",
    label: "Première création",
    description: "Première publication (fan art ou edit)",
    icon: "🎨",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.12)",
    border: "rgba(236,72,153,0.3)",
  },
  {
    key: "active-creator",
    label: "Créateur actif",
    description: "5 publications",
    icon: "🖌️",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.3)",
  },
  {
    key: "prolific-creator",
    label: "Créateur prolifique",
    description: "15 publications",
    icon: "🌟",
    color: "#eab308",
    bg: "rgba(234,179,8,0.12)",
    border: "rgba(234,179,8,0.3)",
  },
  {
    key: "versatile-creator",
    label: "Polyvalent",
    description: "A publié un fan art et un edit",
    icon: "🎭",
    color: "#f97316",
    bg: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.3)",
  },
] as const;

export type BadgeKey = (typeof BADGES_CONFIG)[number]["key"];

export function BadgePill({ badgeKey }: { badgeKey: string }) {
  const cfg = BADGES_CONFIG.find((b) => b.key === badgeKey);
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
      title={cfg.description}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
