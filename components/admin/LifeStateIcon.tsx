import { Heart, LogOut, Skull } from "lucide-react";

const etatVieConfig = {
  EN_VIE: { icon: Heart, className: "text-green-500" },
  MORT: { icon: Skull, className: "text-red-500" },
  PARTI: { icon: LogOut, className: "text-gray-400" },
};

export function LifeStateIcon({ etat }: { etat: "EN_VIE" | "MORT" | "PARTI" }) {
  const { icon: Icon, className } = etatVieConfig[etat];
  return <Icon size={16} className={className} />;
}
