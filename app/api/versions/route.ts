export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const versions = await prisma.version.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(versions);
}

// Les écritures se font dans l'admin (server actions de lib/admin/actions).
