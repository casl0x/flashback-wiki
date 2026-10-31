"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export async function deleteCreatorPostAdmin(id: string) {
  await requireAdmin();
  await prisma.creatorPost.delete({ where: { id } });
}
