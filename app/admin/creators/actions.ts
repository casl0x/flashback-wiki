"use server";
import { prisma } from "@/lib/db";

export async function updateCreatorRoleStatus(
  id: string,
  status: "approved" | "rejected",
) {
  await prisma.creatorRole.update({
    where: { id },
    data: { status },
  });
}

export async function updateCreatorPostStatus(
  id: string,
  status: "approved" | "rejected",
) {
  await prisma.creatorPost.update({
    where: { id },
    data: { status },
  });
}
