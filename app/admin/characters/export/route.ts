import { isAdminUser } from "@/lib/admin/auth";
import { characterListInclude, characterWhere, currentJob } from "@/lib/admin/character-list";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ETAT: Record<string, string> = { EN_VIE: "En vie", MORT: "Mort", PARTI: "Parti", DISPARU: "Disparu", PRISON: "En prison" };
const cell = (v: string | null | undefined) => `"${(v ?? "").replace(/"/g, '""')}"`;

/** Export CSV des persos (mêmes filtres que la liste). */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) return new Response("Non autorisé", { status: 403 });

  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const rows = await prisma.character.findMany({
    where: characterWhere(sp),
    include: characterListInclude,
    orderBy: { nom: "asc" },
  });

  const lines = [
    ["id", "nom", "versions", "groupe_metier", "joueur", "etat", "role", "lien_rediffusion"].join(";"),
    ...rows.map((c) =>
      [
        c.id,
        c.nom,
        c.versions.map((v) => v.id).join(" "),
        currentJob(c),
        c.player?.pseudo,
        ETAT[c.etatVie],
        c.role,
        c.lienReddif,
      ]
        .map(cell)
        .join(";"),
    ),
  ];

  // BOM pour qu'Excel lise bien les accents.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="personnages-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
