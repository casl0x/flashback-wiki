"use server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

export async function updateCreatorRoleStatus(
  id: string,
  status: "approved" | "rejected",
) {
  const role = await prisma.creatorRole.update({
    where: { id },
    data: { status },
    include: { userProfile: true },
  });

  const roleLabel =
    role.type === "ARTISTE" ? "Artiste (fan art)" : "Edit-maker";
  await notifyUser(
    role.userProfile.clerkUserId,
    status === "approved" ? "creator_role_approved" : "creator_role_rejected",
    status === "approved"
      ? `Ton profil créateur "${roleLabel}" a été validé ! Tu peux maintenant publier.`
      : `Ta demande de profil créateur "${roleLabel}" a été refusée.`,
  );
}

export async function deleteCreatorPostAdmin(id: string) {
  await prisma.creatorPost.delete({ where: { id } });
}
