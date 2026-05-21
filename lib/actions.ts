"use server";
import { revalidateTag } from "next/cache";

export async function invalidateWikiCache() {
  revalidateTag("wiki-data", "max");
}
