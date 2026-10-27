import { ETAT_BADGE } from "@/app/_composents/characters/CharacterHero";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// Morceaux communs à /profil (aperçu perso) et /profil/[pseudo] (profil public).

export type ProfileCharacter = {
  id: string;
  nom: string;
  imageUrl: string | null;
  etatVie: "EN_VIE" | "MORT" | "PARTI" | "DISPARU" | "PRISON";
  version: { id: string; color: string } | null;
};

export function ProfilePill({
  bg,
  color,
  children,
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-0.75 text-[12px] font-bold"
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </span>
  );
}

export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          anton.className,
          "text-[32px] leading-none text-[#ECECEE]",
        )}
      >
        {value}
      </span>
      <span className="text-[12px] uppercase tracking-widest text-[#A3A8B3]">
        {label}
      </span>
    </div>
  );
}

export function ProfileSectionTitle({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn(
        anton.className,
        "m-0 text-[28px] uppercase tracking-[0.02em]",
      )}
    >
      {children}
    </h2>
  );
}

/** Section « Ses personnages » : les persos de la fiche joueur liée au compte. */
export function ProfileCharacters({
  playerId,
  characters,
}: {
  playerId: string;
  characters: ProfileCharacter[];
}) {
  return (
    <section aria-labelledby="persos-h" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <ProfileSectionTitle id="persos-h">Ses personnages</ProfileSectionTitle>
        <Link
          href={`/joueurs/${playerId}`}
          className="text-[13px] font-semibold text-[#8AB4FF] hover:underline"
        >
          Voir sa fiche joueur →
        </Link>
      </div>
      {characters.length === 0 ? (
        <p className="text-[13px] text-[#9AA0AA]">
          Aucun personnage lié pour l&apos;instant.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {characters.map((c) => {
            const dead = c.etatVie === "MORT";
            const etat = c.etatVie !== "EN_VIE" ? ETAT_BADGE[c.etatVie] : null;
            return (
              <Link
                key={c.id}
                href={`/personnages/${c.id}`}
                className="relative flex h-50 flex-col justify-end overflow-hidden rounded-[10px] border border-[#23262D] bg-[#15171B] hover:border-[#3A3E47]"
              >
                {c.imageUrl && (
                  <Image
                    src={cloudinaryUrl(c.imageUrl, "w_400,h_500,c_fill,g_face")}
                    alt=""
                    fill
                    unoptimized
                    sizes="200px"
                    className={cn("object-cover", dead && "grayscale")}
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-[#0E0F12] from-10% to-transparent" />
                {etat && (
                  <span
                    className={cn(
                      "absolute right-2 top-2 rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      etat.className,
                    )}
                  >
                    {etat.label}
                  </span>
                )}
                {c.version && (
                  <span
                    className="absolute left-2 top-2 rounded bg-[#0E0F12]/80 px-1.5 py-0.5 text-[11px] font-bold"
                    style={{ color: c.version.color }}
                  >
                    {c.version.id}
                  </span>
                )}
                <div className="relative flex flex-col px-3 pb-3">
                  <span className="text-[16px] font-bold leading-tight text-[#ECECEE]">
                    {c.nom}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
