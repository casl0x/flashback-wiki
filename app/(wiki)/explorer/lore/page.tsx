import LoreTimeline from "@/app/_composents/lore/LoreTimeline";
import { getAdminLevel } from "@/lib/admin/auth";
import { anton } from "@/lib/fonts";
import { getLoreByVersion } from "@/lib/lore";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";

// Avant-première : pas indexé tant que la page n'est pas publique.
export const metadata: Metadata = {
  title: "Lore – Flashback Wiki",
  robots: { index: false, follow: false },
};

export default async function LorePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const { userId } = await auth();
  // Admins et éditeurs (membres de l'organisation) voient la vraie page Lore.
  const isAdmin = (await getAdminLevel(userId)) !== null;

  // Tant que le Lore n'est pas public, seuls les admins et éditeurs voient la vraie page.
  if (!isAdmin) return <ComingSoon />;

  const versions = await getLoreByVersion();

  return (
    <div className="bg-[#080808] text-[#ECECEE]">
      <div className="mx-auto max-w-245 px-5 pb-20">
        <header className="pt-10 pb-3 sm:pt-12">
          <Link
            href="/explorer"
            className="text-[12px] uppercase tracking-[0.3em] text-[#8D93A0] hover:text-white"
          >
            ← Explorer
          </Link>
          <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.5em] text-[#E63946] opacity-85">
            Histoire
          </p>
          <h1
            className={cn(
              anton.className,
              "m-0 mt-1.5 text-[clamp(56px,10vw,110px)] font-normal uppercase leading-[0.95] text-[#E63946]",
            )}
          >
            Lore
          </h1>
          <p className="mt-3 max-w-140 text-[15px] text-[#8D93A0]">
            Les événements marquants du serveur, version par version, avec les clips à revoir.
          </p>
        </header>

        {versions.length === 0 ? (
          <p className="mt-16 text-[#8D93A0]">
            Aucun événement pour l’instant. Ajoute-en depuis{" "}
            <Link href="/admin/lore" className="text-[#8AB4FF] hover:underline">
              Admin → Lore
            </Link>
            .
          </p>
        ) : (
          <LoreTimeline versions={versions} initialId={v} />
        )}
      </div>
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 bg-[#080808] px-6 text-center text-[#E63946]">
      <span className="text-[13px] font-medium uppercase tracking-[0.5em] opacity-80">Histoire</span>
      <h1
        className={cn(
          anton.className,
          "m-0 text-[clamp(40px,8vw,120px)] font-normal uppercase leading-none",
        )}
      >
        Lore
      </h1>
      <p className="text-[clamp(10px,1.3vw,14px)] font-bold uppercase tracking-[0.4em] opacity-75">
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
