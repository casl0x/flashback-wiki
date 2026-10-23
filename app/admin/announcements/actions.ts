"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

export async function createAnnouncement(
  message: string,
  targetClerkUserId?: string,
) {
  await requireAdmin();
  const trimmed = message.trim();
  if (!trimmed) throw new Error("Le message ne peut pas être vide.");

  if (targetClerkUserId) {
    await notifyUser(targetClerkUserId, "admin_message", trimmed);
    return;
  }

  await prisma.announcement.create({ data: { message: trimmed } });
}

export async function toggleAnnouncementActive(id: string, active: boolean) {
  await requireAdmin();
  await prisma.announcement.update({ where: { id }, data: { active } });
}

export async function deleteAnnouncement(id: string) {
  await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
}
