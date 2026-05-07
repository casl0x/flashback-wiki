type Status = "civil" | "illegal" | "fdo" | null | undefined;

type Props = { status: Status; small?: boolean };

const CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string; icon: string }
> = {
  civil: {
    label: "Civil",
    bg: "#1a2e1a",
    color: "#4ade80",
    border: "#1a4a1a",
    icon: "👤",
  },
  illegal: {
    label: "Illégal",
    bg: "#2e1010",
    color: "#f87171",
    border: "#4a1a1a",
    icon: "💀",
  },
  fdo: {
    label: "FDO",
    bg: "#1a2540",
    color: "#60a5fa",
    border: "#1e3a6e",
    icon: "🔵",
  },
};

export default function StatusBadge({ status, small = false }: Props) {
  if (!status) return null;
  const cfg = CONFIG[status];
  if (!cfg) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: small ? 9 : 10,
        fontWeight: 700,
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 99,
        background: cfg.bg,
        color: cfg.color,
        border: `0.5px solid ${cfg.border}`,
        fontFamily: "'Rajdhani', sans-serif",
        letterSpacing: ".4px",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
