import { Badge } from "@/components/ui/badge";
import { Heart, Meh, Plane, Skull } from "lucide-react";
import { ComponentType } from "react";

type EtatVieConfig = {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const ETAT_VIE_CONFIG: EtatVieConfig[] = [
  {
    key: "EN_VIE",
    label: "En vie",
    description: "Ce personnage est actuellement en vie.",
    icon: Heart,
  },
  {
    key: "MORT",
    label: "Mort",
    description: "Ce personnage est décédé.",
    icon: Skull,
  },
  {
    key: "PARTI",
    label: "Parti",
    description: "Ce personnage a quitté le serveur.",
    icon: Plane,
  },
  {
    key: "DISPARU",
    label: "Disparu",
    description: "Ce personnage a disparu.",
    icon: Meh,
  },
];

export function LifeStateIcon({ etat }: { etat: string }) {
  const cfg = ETAT_VIE_CONFIG.find((c) => c.key === etat);
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1.5 text-[11px] font-medium capitalize"
      title={cfg.description}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </Badge>
  );
}
