import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-flex items-center justify-center rounded-full bg-elevated border border-border p-0.5 cursor-default">
            <Icon className="w-2.5 h-2.5 text-text-muted" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs font-medium">{cfg.label}</p>
          <p className="text-xs text-muted-foreground">{cfg.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
