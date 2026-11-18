import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explorer – Flashback Wiki",
};

const SIDES = [
  {
    href: "/explorer/lore",
    kicker: "Histoire",
    title: "Lore",
    hint: "Événements marquants et clips",
    color: "#E63946",
  },
  {
    href: "/personnages",
    kicker: "Univers",
    title: "Personnages",
    hint: "Personnages et groupes",
    color: "#9D93F5",
  },
] as const;

export default function ExplorerPage() {
  return (
    <div className="bg-[#080808] text-[#ECECEE]">
      <div
        className={cn(
          "relative mx-auto grid min-h-[calc(100dvh-4rem)] grid-rows-2 md:grid-cols-2 md:grid-rows-1",
          // Au survol d'un côté, l'autre s'assombrit.
          "[&:hover>a:not(:hover)]:opacity-40",
        )}
      >
        {SIDES.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "group flex flex-col items-center justify-center gap-3 px-4 text-center transition-opacity duration-300",
              i === 0
                ? "border-b border-white/5 md:border-b-0 md:border-r"
                : "",
            )}
            style={{ color: s.color }}
          >
            <span className="text-[13px] font-medium uppercase tracking-[0.5em] opacity-80">
              {s.kicker}
            </span>
            <span
              className={cn(
                anton.className,
                "text-[clamp(40px,8vw,120px)] uppercase leading-none transition-transform duration-300 group-hover:scale-105",
              )}
            >
              {s.title}
            </span>
            <span className="text-[clamp(10px,1.3vw,14px)] font-bold uppercase tracking-[0.4em] opacity-75">
              {s.hint}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
