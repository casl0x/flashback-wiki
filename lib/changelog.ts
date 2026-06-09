import { prisma } from "@/lib/db";

type ChangelogType =
  | "add_global"
  | "add_relation"
  | "add_lieu"
  | "edit_info"
  | "edit_relation"
  | "edit_lieu"
  | "version";

export async function logChange(
  type: ChangelogType,
  label: string,
  detail?: string,
) {
  await prisma.changelogEntry.create({ data: { type, label, detail } });
}
