import { NextResponse } from "next/server";

// Identifiant du déploiement en cours (commit Vercel). Sert à détecter qu'une
// nouvelle version du site est en ligne.
export function GET() {
  return NextResponse.json(
    { version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
