// Rattrapage UNIQUE : les points ajoutés à la main avant l'ajout de la case
// « Compter comme un ajout validé » n'ont pas fait avancer acceptedCount ni les badges.
// Ce script compte chaque ancienne entrée (PointEntry) comme un ajout validé.
//
//   DATABASE_URL=<url prod> node scripts/backfill-contributions.mjs --before=2026-11-09T00:00:00Z          (simulation)
//   DATABASE_URL=<url prod> node scripts/backfill-contributions.mjs --before=2026-11-09T00:00:00Z --apply  (écrit)
//
// --before = date de mise en ligne du correctif : seules les entrées créées avant sont
// comptées (celles d'après le sont déjà). À ne lancer qu'UNE fois avec --apply, sinon
// les entrées seraient comptées deux fois.
import { PrismaClient } from "@prisma/client";

const BADGES = [
  { key: "first-step", min: 1, icon: "⭐", label: "Premier pas" },
  { key: "contributor", min: 5, icon: "🔷", label: "Contributeur" },
  { key: "expert", min: 15, icon: "💎", label: "Expert" },
  { key: "legend", min: 30, icon: "👑", label: "Légende" },
];

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const apply = process.argv.includes("--apply");
const before = new Date(arg("before") ?? "");
if (Number.isNaN(before.getTime())) {
  console.error("Indique --before=<date ISO>, ex. --before=2026-11-09T00:00:00Z");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const groups = await prisma.pointEntry.groupBy({
    by: ["userProfileId"],
    where: { createdAt: { lt: before } },
    _count: { _all: true },
  });
  console.log(`${apply ? "APPLICATION" : "SIMULATION"} : ${groups.length} membre(s) concerné(s), entrées avant ${before.toISOString()}\n`);

  for (const g of groups) {
    const n = g._count._all;
    const profile = await prisma.userProfile.findUnique({
      where: { id: g.userProfileId },
      select: { pseudo: true, acceptedCount: true, badges: true },
    });
    if (!profile) continue;
    const newCount = profile.acceptedCount + n;
    const earned = BADGES.filter((b) => newCount >= b.min && !profile.badges.includes(b.key));
    console.log(
      `${profile.pseudo ?? g.userProfileId} : ${profile.acceptedCount} → ${newCount} ajouts` +
        (earned.length ? ` | badges : ${earned.map((b) => b.label).join(", ")}` : ""),
    );
    if (!apply) continue;

    await prisma.userProfile.update({
      where: { id: g.userProfileId },
      data: {
        acceptedCount: { increment: n },
        badges: [...new Set([...profile.badges, ...BADGES.filter((b) => newCount >= b.min).map((b) => b.key)])],
      },
    });
    for (const b of earned) {
      await prisma.notification.create({
        data: {
          userProfileId: g.userProfileId,
          type: "badge_earned",
          message: `Nouveau badge débloqué : ${b.icon} ${b.label} !`,
        },
      });
    }
  }
  if (!apply) console.log("\nRien n'a été écrit. Relance avec --apply pour appliquer.");
} finally {
  await prisma.$disconnect();
}
