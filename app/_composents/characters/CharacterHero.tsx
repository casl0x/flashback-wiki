import type { CharacterPageData, EtatVie } from "@/lib/character-page";
import { cloudinaryUrl } from "@/lib/character-page";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { GROUPE_STATUT_LABEL, groupeHref } from "@/lib/groupe-types";
import Link from "next/link";

export const ETAT_BADGE: Record<
  Exclude<EtatVie, "EN_VIE">,
  { label: string; className: string }
> = {
  MORT: { label: "✝ Mort", className: "border-[#E5484D] text-[#FF8A8E]" },
  PARTI: { label: "Parti", className: "border-[#4A4E58] text-[#C4C7CF]" },
  DISPARU: { label: "Disparu", className: "border-[#B7791F] text-[#F6B26B]" },
  PRISON: { label: "En prison", className: "border-[#3B5BA5] text-[#8AB4FF]" },
};

/** Texte sombre sur les couleurs claires, blanc sur les foncées. */
export function textOn(hex: string | null | undefined): string {
  const m = hex
    ?.replace("#", "")
    .match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return "#FFFFFF";
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#121212" : "#FFFFFF";
}

const pill =
  "rounded px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.06em] leading-none";

export default function CharacterHero({ c }: { c: CharacterPageData }) {
  const dead = c.etatVie === "MORT";
  // Un perso peut avoir un métier légal (entreprise / service public) et un groupe illégal : un de chaque côté.
  const sides = [
    c.currentLegal && { step: c.currentLegal, label: "Métier" },
    c.currentIllegal && { step: c.currentIllegal, label: "Groupe" },
  ].filter((x): x is { step: NonNullable<typeof c.currentLegal>; label: string } => !!x);

  return (
    <section
      aria-label="En-tête du personnage"
      className="relative h-95 overflow-hidden bg-[repeating-linear-gradient(135deg,#1A1C21_0px,#1A1C21_14px,#17191D_14px,#17191D_28px)] sm:h-200"
    >
      {c.imageUrl && (
        <Image
          src={cloudinaryUrl(c.imageUrl, "w_1600,h_900,c_fill,g_face")}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={cn("object-cover object-top", dead && "grayscale")}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-[#0E0F12] from-10% to-transparent" />

      <div className="absolute inset-x-0 bottom-0 ">
        <div className="mx-auto max-w-295 px-4 pb-7 sm:px-5 sm:pb-9">
          <Link
            href="/personnages"
            className="mb-4 inline-block text-[13px] text-[#A3A8B3] hover:text-[#ECECEE]"
          >
            ← Retour aux personnages
          </Link>

          <div className="mb-3.5 flex flex-wrap gap-2">
            {c.versions.map((v) => (
              <span
                key={v.id}
                className={pill}
                style={{ background: v.color, color: textOn(v.color) }}
              >
                {v.id}
              </span>
            ))}
            {sides.map(({ step }) => (
              <Link
                key={step.key}
                href={groupeHref(step.groupe)}
                className={pill}
                style={{
                  background: step.groupe.color ?? "#2F6FEB",
                  color: textOn(step.groupe.color ?? "#2F6FEB"),
                }}
              >
                {step.groupe.nom}
              </Link>
            ))}
            {c.role && (
              <span
                className={cn(
                  pill,
                  "border border-[#4A4E58] font-semibold text-[#D5D7DD]",
                )}
              >
                {c.role === "civil" ? "Civil" : "Illégal"}
              </span>
            )}
            {c.etatVie !== "EN_VIE" && (
              <span
                className={cn(pill, "border", ETAT_BADGE[c.etatVie].className)}
              >
                {ETAT_BADGE[c.etatVie].label}
              </span>
            )}
          </div>

          <h1
            className={cn(
              anton.className,
              "m-0 text-[clamp(44px,9vw,112px)] uppercase leading-[0.95] tracking-[0.01em] text-[#ECECEE]",
            )}
          >
            {c.nom}
          </h1>

          {sides.length > 0 && (
            <div className="mt-3 flex flex-col gap-1 text-[16px] text-[#C4C7CF] sm:text-[18px]">
              {sides.map(({ step, label }) => {
                const detail = [step.grade, step.matricule]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <p key={step.key} className="m-0">
                    {sides.length > 1 && (
                      <span className="mr-2 text-[12px] font-bold uppercase tracking-widest text-[#9AA0AA]">
                        {label}
                      </span>
                    )}
                    {detail}
                    {detail && " — "}
                    <Link
                      href={groupeHref(step.groupe)}
                      className="font-semibold text-[#ECECEE] hover:underline"
                    >
                      {step.groupe.nom}
                    </Link>
                    {step.groupe.statut && (
                      <span className="ml-2 rounded border border-[#4A4E58] px-1.5 py-px text-[11px] font-bold uppercase tracking-wider text-[#D5D7DD]">
                        {GROUPE_STATUT_LABEL[step.groupe.statut]}
                      </span>
                    )}
                    {step.groupe.dissous && (
                      <span className="ml-2 text-[13px] text-[#9AA0AA]">
                        (dissous)
                      </span>
                    )}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
