import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Route publique (pas d'auth) : utilisée par les visiteurs non connectés,
// qui n'ont pas de UserProfile pour suivre lastSeenAnnouncementAt côté
// serveur. Le filtrage "déjà vu" se fait côté client via localStorage.
export async function GET() {
  const announcements = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    announcements.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt,
    })),
  );
}
