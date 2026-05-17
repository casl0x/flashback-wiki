import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Music, Star, Trophy, Tv } from "lucide-react";
import { ComponentType } from "react";

type BadgeConfig = {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

export const BADGES_CONFIG: BadgeConfig[] = [
  {
    key: "streamer",
    label: "Streamer actif",
    description: "Ce joueur stream un personnage présent sur le serveur.",
    icon: Tv,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
  },
  {
    key: "musicien",
    label: "Musicien",
    description: "Ce joueur fait de la musique (que ce soit en rp ou non).",
    icon: Music,
    color: "#ec4899",
    bg: "rgba(236,72,153,0.12)",
  },
  {
    key: "staff",
    label: "Staff",
    description:
      "Ce joueur fait partie de l'équipe d'admin ou de dev du serveur.",
    icon: Star,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  {
    key: "veteran",
    label: "Vétéran",
    description: "Ce joueur est présent sur le serveur depuis la V1.",
    icon: Trophy,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
  },
];

export type BadgeKey = (typeof BADGES_CONFIG)[number]["key"];

export function PlayerBadges({
  badges,
  size = "sm",
}: {
  badges: string[];
  size?: "sm" | "md";
}) {
  if (!badges?.length) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {badges.map((b) => {
          const cfg = BADGES_CONFIG.find((c) => c.key === b);
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <Tooltip key={b}>
              <TooltipTrigger>
                <span
                  style={{
                    color: cfg.color,
                    backgroundColor: cfg.bg,
                    border: `1px solid ${cfg.color}40`,
                  }}
                  className={`inline-flex items-center gap-1 rounded-full font-medium cursor-default ${
                    size === "sm"
                      ? "text-[10px] px-1.5 py-0.5"
                      : "text-[11px] px-2 py-0.5"
                  }`}
                >
                  <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
                  {size === "md" && <span>{cfg.label}</span>}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-center">
                <p className="text-xs text-muted-foreground">
                  {cfg.description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
