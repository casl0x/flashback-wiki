import LoreTimeline from "@/app/_composents/lore/LoreTimeline";
import { getAdminLevel } from "@/lib/admin/auth";
import { anton } from "@/lib/fonts";
import { getLoreByVersion } from "@/lib/lore";
import { withTwitchPreviews } from "@/lib/lore-twitch";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lore – Flashback Wiki",
  description:
    "Les événements marquants de Flashback WL, version par version, avec les clips à revoir.",
};

export default async function LorePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  // Le lien vers l'admin n'est proposé qu'à l'équipe, quand il n'y a encore rien à afficher.
  const { userId } = await auth();
  const isTeam = (await getAdminLevel(userId)) !== null;

  const versions = await withTwitchPreviews(await getLoreByVersion());

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
            Aucun événement pour l’instant.
            {isTeam && (
              <>
                {" "}
                Ajoute-en depuis{" "}
                <Link href="/admin/lore" className="text-[#8AB4FF] hover:underline">
                  Admin → Lore
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <LoreTimeline versions={versions} initialId={v} />
        )}
      </div>
    </div>
  );
}
