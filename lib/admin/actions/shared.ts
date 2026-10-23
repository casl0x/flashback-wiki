import "server-only";

import { invalidateWikiCache } from "@/lib/actions";
import { NotAdminError } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

/** Vide les caches du wiki et de l'admin après une écriture. */
export async function refreshAll() {
  await invalidateWikiCache();
  revalidatePath("/admin", "layout");
}

export function failure(err: unknown): { ok: false; error: string } {
  if (err instanceof NotAdminError) return { ok: false, error: err.message };
  if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
    return { ok: false, error: "Doublon : cet élément existe déjà." };
  }
  console.error(err);
  return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
}

export const clean = (v: string | null | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};
