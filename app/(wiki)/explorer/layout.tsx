import { getAdminLevel } from "@/lib/admin/auth";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Explorer en avant-première : jamais indexé, jamais mis en cache.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Accès réservé aux admins complets (`org:admin`), éditeurs exclus.
 * Protège /explorer et toutes ses sous-pages. Pour ouvrir l'Explorer au public
 * plus tard, il suffit de retirer cette garde (ou de l'élargir).
 */
export default async function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if ((await getAdminLevel(userId)) !== "admin") redirect("/");
  return <>{children}</>;
}
