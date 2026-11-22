import { anton } from "@/lib/fonts";
import type { LoreEventView, LoreVersionView } from "@/lib/lore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ClipRow from "./ClipRow";
import LoreText from "./LoreText";

const mix = (c: string, pct: number) =>
  `color-mix(in srgb, ${c} ${pct}%, transparent)`;

/** Page Lore : une section par version, frise verticale d'événements. */
export default function LoreTimeline({ versions }: { versions: LoreVersionView[] }) {
  return (
    <>
      <nav aria-label="Versions" className="sticky top-16 z-10 -mx-5 flex flex-wrap gap-2 bg-linear-to-b from-[#080808] from-80% to-transparent px-5 py-3.5">
        {versions.map((v) => (
          <a
            key={v.id}
            href={`#${v.id}`}
            className="rounded-full border border-[#2a2d35] px-3.5 py-1.5 text-[13px] font-semibold text-[#8D93A0] transition-colors hover:text-(--c)"
            style={{ "--c": v.color } as React.CSSProperties}
          >
            {v.id}
          </a>
        ))}
      </nav>

      {versions.map((v) => (
        <section
          key={v.id}
          id={v.id}
          className="mt-11 scroll-mt-32"
          style={{ "--c": v.color } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-4 border-b border-[#1c1e24] pb-3">
            <h2
              className={cn(anton.className, "m-0 text-[clamp(44px,7vw,72px)] font-normal uppercase leading-none text-(--c)")}
            >
              {v.id}
            </h2>
            <span className="text-[13px] uppercase tracking-[0.2em] text-[#8D93A0]">
              {countLabel(v.events)}
            </span>
          </div>
          <ol className="m-0 mt-6 ml-2.5 list-none border-l-2 border-(--c) p-0 pl-5 sm:pl-7">
            {v.events.map((e) =>
              e.kind === "TEXT" ? (
                <TextBlock key={e.id} event={e} />
              ) : (
                <EventCard key={e.id} event={e} color={v.color} />
              ),
            )}
          </ol>
        </section>
      ))}
    </>
  );
}

function countLabel(entries: LoreEventView[]) {
  const texts = entries.filter((e) => e.kind === "TEXT").length;
  const events = entries.length - texts;
  const parts: string[] = [];
  if (events > 0) parts.push(`${events} événement${events > 1 ? "s" : ""}`);
  if (texts > 0) parts.push(`${texts} texte${texts > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

/** Lore hors gameplay : texte mis en forme, sans point de frise, clips ni étiquettes. */
function TextBlock({ event: e }: { event: LoreEventView }) {
  return (
    <li className="relative mb-5">
      <article className="rounded-xl border border-dashed border-[#2a2d35] p-4 sm:px-5 sm:py-5">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-(--c)">
          Lore
        </span>
        <h3
          className={cn(
            anton.className,
            "m-0 mt-1.5 mb-3 text-[clamp(22px,3.4vw,30px)] font-normal uppercase leading-tight text-[#ECECEE]",
          )}
        >
          {e.titre}
        </h3>
        {e.contenu && <LoreText text={e.contenu} />}
      </article>
    </li>
  );
}

function EventCard({ event: e, color }: { event: LoreEventView; color: string }) {
  return (
    <li className="relative mb-5">
      <span
        aria-hidden
        className={cn(
          "absolute top-5.5 -left-[29px] h-3.5 w-3.5 rounded-full border-2 border-(--c) sm:-left-[37px]",
          e.major ? "bg-(--c)" : "bg-[#080808]",
        )}
        style={e.major ? { boxShadow: `0 0 0 5px ${mix(color, 25)}` } : undefined}
      />
      <article
        className={cn(
          "rounded-xl border p-4 sm:px-5",
          e.major ? "border-[#1c1e24]" : "border-[#1c1e24] bg-[#0f1014]",
        )}
        style={
          e.major
            ? {
                borderColor: `color-mix(in srgb, ${color} 55%, #1c1e24)`,
                background: `linear-gradient(135deg, color-mix(in srgb, ${color} 10%, #0f1014), #0f1014 60%)`,
              }
            : undefined
        }
      >
        {e.major && (
          <span className="inline-block rounded-full bg-(--c) px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#0b0b0e]">
            Majeur
          </span>
        )}
        <h3
          className={cn(
            anton.className,
            "m-0 font-normal uppercase leading-tight text-[#ECECEE]",
            e.major ? "mt-2 text-[clamp(22px,3.4vw,30px)]" : "text-[clamp(18px,2.6vw,22px)]",
          )}
        >
          {e.titre}
        </h3>
        <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-[#B7BBC6]">{e.resume}</p>

        {(e.characters.length > 0 || e.groupes.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {e.characters.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="flex items-center gap-1.5 rounded-full border border-[#2a2d35] bg-[#16181d] px-2.5 py-0.5 text-[12px] text-[#d7d9e0] hover:border-[#4ade80]"
              >
                <i className="h-[7px] w-[7px] rounded-full bg-[#4ade80]" />
                {c.nom}
              </Link>
            ))}
            {e.groupes.map((g) => (
              <Link
                key={g.id}
                href={g.href}
                className="flex items-center gap-1.5 rounded-full border border-[#2a2d35] bg-[#16181d] px-2.5 py-0.5 text-[12px] text-[#d7d9e0] hover:border-[#9D93F5]"
              >
                <i className="h-[7px] w-[7px] rounded-[2px] bg-[#9D93F5]" />
                {g.nom}
              </Link>
            ))}
          </div>
        )}

        <ClipRow clips={e.clips} color={color} />
      </article>
    </li>
  );
}
