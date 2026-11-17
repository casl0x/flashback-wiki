import type { ActeurLink } from "@/lib/character-page";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import Link from "next/link";

/**
 * Sélecteur d'acteur : affiché seulement si le personnage a plusieurs fiches
 * (une par joueur). Chaque bouton ouvre la fiche du joueur correspondant.
 */
export default function ActeurSwitch({ acteurs }: { acteurs: ActeurLink[] }) {
  if (acteurs.length < 2) return null;

  return (
    <nav
      aria-label="Acteurs du personnage"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-[#23262D] bg-[#15171B] px-3 py-2.5"
    >
      <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-[#9AA0AA]">
        <Users className="h-3.5 w-3.5" aria-hidden />
        Joué par
      </span>
      {acteurs.map((a) =>
        a.current ? (
          <span
            key={a.id}
            aria-current="page"
            className="rounded-md bg-[#2F6FEB] px-3 py-1 text-[13px] font-semibold text-white"
          >
            {a.pseudo}
          </span>
        ) : (
          <Link
            key={a.id}
            href={`/personnages/${a.id}`}
            className={cn(
              "rounded-md border border-[#3A3E47] px-3 py-1 text-[13px] font-medium text-[#D5D7DD]",
              "hover:border-[#2F6FEB] hover:text-white",
            )}
          >
            {a.pseudo}
          </Link>
        ),
      )}
    </nav>
  );
}
