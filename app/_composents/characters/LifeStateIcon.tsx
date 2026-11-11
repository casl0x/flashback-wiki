import { ETAT_BADGE } from "@/app/_composents/characters/CharacterHero";
import { cn } from "@/lib/utils";
import { Heart, Lock, Meh, Plane, Skull } from "lucide-react";
import { ComponentType } from "react";

type EtatVieConfig = {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const ETAT_VIE_CONFIG: EtatVieConfig[] = [
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
  {
    key: "PRISON",
    label: "En prison",
    description: "Ce personnage est actuellement incarcéré.",
    icon: Lock,
  },
];

export function LifeStateIcon({ etat }: { etat: string }) {
  const cfg = ETAT_VIE_CONFIG.find((c) => c.key === etat);
  const badge = ETAT_BADGE[etat as keyof typeof ETAT_BADGE];
  if (!cfg || !badge) return null;

  // Même style que le badge d'état de la fiche personnage
  return (
    <span
      title={cfg.description}
      className={cn(
        "shrink-0 rounded border bg-[#0B0C0F]/85 px-2 py-0.5 text-[11px] font-bold uppercase leading-none tracking-[0.06em]",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}
