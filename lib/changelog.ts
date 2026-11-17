import { prisma } from "@/lib/db";

type ChangelogType =
  | "add_global"
  | "add_relation"
  | "add_lieu"
  | "edit_info"
  | "edit_relation"
  | "edit_lieu"
  | "version"
  | "add_player"
  | "edit_player"
  | "add_groupe"
  | "edit_groupe"
  | "site";

export async function logChange(
  type: ChangelogType,
  label: string,
  detail?: string,
) {
  await prisma.changelogEntry.create({ data: { type, label, detail } });
}
