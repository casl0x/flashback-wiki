"use server";
import { revalidateTag } from "next/cache";

export async function invalidateWikiCache() {
  revalidateTag("wiki-data", "wiki");
}

export async function invalidateProfilesCache() {
  revalidateTag("profiles", "wiki");
}
