"use server";
import { prisma } from "@/lib/db";

export async function createAnnouncement(message: string) {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Le message ne peut pas être vide.");

  await prisma.announcement.create({ data: { message: trimmed } });
}

export async function toggleAnnouncementActive(id: string, active: boolean) {
  await prisma.announcement.update({ where: { id }, data: { active } });
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
}
