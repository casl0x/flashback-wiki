import { Heart, Lock, Meh, Plane, Skull } from "lucide-react";
import { ComponentType } from "react";

type EtatVieConfig = {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
};

export const ETAT_VIE_CONFIG: EtatVieConfig[] = [
  {
    key: "EN_VIE",
    label: "En vie",
    description: "Ce personnage est actuellement en vie.",
    icon: Heart,
    color: "#22C55E",
  },
  {
    key: "MORT",
    label: "Mort",
    description: "Ce personnage est décédé.",
    icon: Skull,
    color: "#EF4444",
  },
  {
    key: "PARTI",
    label: "Parti",
    description: "Ce personnage a quitté le serveur.",
    icon: Plane,
    color: "#F59E0B",
  },
  {
    key: "DISPARU",
    label: "Disparu",
    description: "Ce personnage a disparu.",
    icon: Meh,
    color: "#A855F7",
  },
  {
    key: "PRISON",
    label: "En prison",
    description: "Ce personnage est actuellement incarcéré.",
    icon: Lock,
    color: "#64748B",
  },
];

export function LifeStateIcon({ etat }: { etat: string }) {
  const cfg = ETAT_VIE_CONFIG.find((c) => c.key === etat);
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <span
      className="flex items-center gap-1.5 text-[11px] font-medium capitalize border rounded-2xl px-2 py-0.5"
      style={{
        backgroundColor: `${cfg.color}1A`,
        color: cfg.color,
        borderColor: `${cfg.color}40`,
      }}
      title={cfg.description}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}
