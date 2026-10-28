import type { EtatVie, ParcoursStep } from "@/lib/character-page";
import { groupeHref } from "@/lib/groupe-types";
import Link from "next/link";
import { textOn } from "./CharacterHero";
import SectionTitle from "./SectionTitle";

type Props = { steps: ParcoursStep[]; etatVie: EtatVie };

/** Groupes du perso, version par version ; la dernière étape est l'actuelle. */
export default function CharacterParcours({ steps, etatVie }: Props) {
  if (steps.length === 0) return null;
  const lastLabel =
    etatVie === "EN_VIE" ? "actuel" : "dernier";

  return (
    <section aria-labelledby="parcours-h" className="flex flex-col gap-3.5">
      <SectionTitle id="parcours-h">Parcours</SectionTitle>
      <ol className="m-0 list-none rounded-[10px] border border-[#23262D] bg-[#15171B] px-4 py-4 sm:px-5">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          const detail = [
            s.grade,
            s.matricule ? `matricule ${s.matricule}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={s.key}
              className={`relative flex items-start gap-3.5 ${last ? "" : "pb-4"}`}
            >
              {!last && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-5.25 top-6.5 w-0.5 bg-[#2C3038]"
                />
              )}
              <span
                className="flex h-6 w-11 flex-none items-center justify-center rounded text-[12px] font-bold"
                style={{
                  background: s.version?.color ?? "#3A3E47",
                  color: textOn(s.version?.color ?? "#3A3E47"),
                }}
                title={s.version?.label}
              >
                {s.version?.id ?? "—"}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ background: s.groupe.color ?? "#6E7380" }}
                  />
                  <Link
                    href={groupeHref(s.groupe)}
                    className="text-[16px] font-bold text-[#ECECEE] hover:underline"
                  >
                    {s.groupe.nom}
                  </Link>
                  {last && (
                    <span className="rounded-full bg-[#11281C] px-2 py-px text-[11px] font-bold text-[#6EE7A0]">
                      {lastLabel}
                    </span>
                  )}
                </span>
                {detail && (
                  <span className="text-[13px] text-[#9AA0AA]">{detail}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
