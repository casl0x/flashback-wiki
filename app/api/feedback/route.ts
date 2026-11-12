import { FEEDBACK_CATEGORIES } from "@/lib/feedback-categories";
import { NextResponse } from "next/server";

// Retours (bugs / suggestions) envoyés sur Discord via webhook.
// Les URL de webhook restent côté serveur (variables d'environnement).

/** Nombre maximum de retours par IP et par jour. */
const MAX_PER_DAY = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// Compteur en mémoire : propre à chaque instance serverless, donc best-effort.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < DAY_MS);
  if (recent.length >= MAX_PER_DAY) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Nettoyage opportuniste pour éviter que la Map grossisse indéfiniment.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= DAY_MS)) hits.delete(k);
    }
  }
  return false;
}

const text = (v: unknown, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

const CONFIG = {
  bug: { env: "DISCORD_WEBHOOK_BUG", color: 0xc8343a, title: "🐛 Nouveau bug", username: "🐛 Bug Report" },
  suggestion: { env: "DISCORD_WEBHOOK_SUGGESTION", color: 0x2ea043, title: "💡 Nouvelle suggestion", username: "💡 Suggestion" },
} as const;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  // Honeypot : un bot remplit ce champ caché. On répond OK sans rien envoyer.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const type = body.type === "bug" || body.type === "suggestion" ? body.type : null;
  if (!type) return NextResponse.json({ error: "Type invalide" }, { status: 400 });

  const message = text(body.message, 1500);
  if (!message || message.length < 5) {
    return NextResponse.json({ error: "Message trop court" }, { status: 400 });
  }
  const categorie = FEEDBACK_CATEGORIES[type].find((c) => c === body.categorie);
  if (!categorie) return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  const etapes = type === "bug" ? text(body.etapes, 1000) : null;
  const page = text(body.page, 300);

  const cfg = CONFIG[type];
  const url = process.env[cfg.env];
  if (!url) {
    return NextResponse.json({ error: "Envoi indisponible pour le moment" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: `Limite atteinte (${MAX_PER_DAY} retours par jour)` },
      { status: 429 },
    );
  }

  const fields = [
    { name: "Catégorie", value: categorie },
    ...(page ? [{ name: "Page", value: page }] : []),
    ...(etapes ? [{ name: "Étapes pour reproduire", value: etapes }] : []),
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: cfg.username,
      // Aucune mention (@everyone, @role, @user) ne doit être déclenchée.
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: cfg.title,
          description: message,
          color: cfg.color,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.json({ error: "Échec de l'envoi" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
