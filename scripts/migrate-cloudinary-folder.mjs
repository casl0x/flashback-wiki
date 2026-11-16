// Range les images Cloudinary existantes (à la racine) dans le dossier voulu
// et met à jour les `imageUrl` en base en conséquence.
//
//   node scripts/migrate-cloudinary-folder.mjs            → simulation (rien n'est modifié)
//   node scripts/migrate-cloudinary-folder.mjs --apply    → déplace pour de bon
//
// Variables requises (.env) : DATABASE_URL, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
// Dossier : 1er argument positionnel, sinon "flashback-wiki" (= CLOUDINARY_FOLDER de lib/cloudinary.ts).
import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const folder = (args.find((a) => !a.startsWith("--")) ?? "flashback-wiki").replace(/^\/+|\/+$/g, "");

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
  console.error("Variables Cloudinary manquantes (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).");
  process.exit(1);
}

const prisma = new PrismaClient();
// Tables ayant une colonne imageUrl (public_id Cloudinary).
const models = ["character", "player", "groupe", "version", "creatorPost", "suggestion"];

async function rename(from, to) {
  const params = { from_public_id: from, to_public_id: to, overwrite: "false", invalidate: "true" };
  const timestamp = String(Math.floor(Date.now() / 1000));
  const toSign = Object.entries({ ...params, timestamp })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/rename`, {
    method: "POST",
    body: new URLSearchParams({ ...params, timestamp, api_key: apiKey, signature }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
}

// 1. Inventaire des images à déplacer (hors URLs complètes et images déjà rangées).
const ids = new Set();
for (const m of models) {
  const rows = await prisma[m].findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } });
  for (const { imageUrl } of rows) {
    if (imageUrl && !/^https?:\/\//.test(imageUrl) && !imageUrl.startsWith(`${folder}/`)) ids.add(imageUrl);
  }
}
console.log(`${ids.size} image(s) à déplacer vers « ${folder}/ »${apply ? "" : " (simulation, ajoutez --apply pour exécuter)"}.`);

// 2. Une image à la fois : renommage Cloudinary, puis mise à jour de la base.
//    Si la base échoue, on remet l'image à sa place d'origine.
let done = 0;
let failed = 0;
for (const from of ids) {
  const to = `${folder}/${from.split("/").pop()}`;
  if (!apply) {
    console.log(`  ${from}  →  ${to}`);
    continue;
  }
  try {
    await rename(from, to);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${from} : ${e.message}`);
    continue;
  }
  try {
    await prisma.$transaction(
      models.map((m) => prisma[m].updateMany({ where: { imageUrl: from }, data: { imageUrl: to } })),
    );
    done++;
    console.log(`  ✓ ${from}  →  ${to}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ base non mise à jour pour ${from} (${e.message}), retour en arrière sur Cloudinary…`);
    await rename(to, from).catch((e2) => console.error(`    ⚠ retour impossible, image restée en ${to} : ${e2.message}`));
  }
}

if (apply) console.log(`Terminé : ${done} déplacée(s), ${failed} échec(s).`);
await prisma.$disconnect();
