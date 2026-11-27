import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explorer – Flashback Wiki",
};

const ENTRIES = [
  {
    href: "/explorer/lore",
    title: "Lore",
    description:
      "Les événements marquants du serveur, avec les clips à revoir.",
    tags: ["Événements", "Clips", "Chronologie"],
    color: "#E63946",
  },
  {
    href: "/personnages",
    title: "Personnages",
    description: "Tous les personnages et groupes du serveur.",
    tags: ["Fiches", "Groupes"],
    color: "#9D93F5",
  },
] as const;

export default function ExplorerPage() {
  return (
    <div className="bg-[#080808] text-[#ECECEE]">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-295 flex-col justify-center py-4">
        {ENTRIES.map((e, i) => (
          <Link
            key={e.href}
            href={e.href}
            style={{ "--c": e.color } as React.CSSProperties}
            className="group grid grid-cols-[44px_1fr] items-center gap-4 border-b border-[#1c1e24] px-5 py-8 transition-[background,padding] duration-200 last:border-b-0 hover:bg-[#0f1014] sm:grid-cols-[90px_1fr_auto] sm:gap-6 sm:px-11 sm:py-10 sm:hover:pl-14"
          >
            <span
              className={cn(
                anton.className,
                "text-[20px] tracking-[0.1em] text-[#8D93A0] transition-colors group-hover:text-(--c)",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2
                className={cn(
                  anton.className,
                  "m-0 text-[clamp(40px,9vw,112px)] font-normal uppercase leading-[0.95] transition-colors group-hover:text-(--c)",
                )}
              >
                {e.title}
              </h2>
              {/* Mobile : toujours visible. Écran large : révélée au survol. */}
              <p className="mt-2.5 max-w-130 text-[14px] text-[#8D93A0] sm:max-h-0 sm:overflow-hidden sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:max-h-16 sm:group-hover:opacity-100">
                {e.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#2a2d35] px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] text-[#8D93A0]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span
              aria-hidden
              className="hidden text-[34px] text-[#8D93A0] transition-all duration-200 group-hover:translate-x-2 group-hover:text-(--c) sm:block"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
