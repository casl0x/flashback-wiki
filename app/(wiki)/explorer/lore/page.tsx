import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lore – Flashback Wiki",
};

export default function LorePage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 bg-[#080808] px-6 text-center text-[#E63946]">
      <span className="text-[13px] font-medium uppercase tracking-[0.5em] opacity-80">
        Histoire
      </span>
      <h1
        className={cn(
          anton.className,
          "m-0 text-[clamp(40px,8vw,120px)] uppercase leading-none",
        )}
      >
        Lore
      </h1>
      <p className="text-[clamp(11px,1.6vw,16px)] font-bold uppercase tracking-[0.55em] opacity-75">
        Bientôt
      </p>
      <Link
        href="/explorer"
        className="mt-6 text-[13px] uppercase tracking-[0.3em] text-[#A3A8B3] hover:text-white"
      >
        ← Retour
      </Link>
    </div>
  );
}
