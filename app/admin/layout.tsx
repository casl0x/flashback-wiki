import { currentAdminSummary, isAdminUser } from "@/lib/admin/auth";
import { countPending } from "@/lib/admin/moderation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSidebar from "../_composents/admin/AdminSidebar";

export const metadata: Metadata = { title: "Admin – Flashback Wiki" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le middleware filtre déjà /admin ; on revérifie ici par sécurité.
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) redirect("/");

  const [pending, admin] = await Promise.all([
    countPending(),
    currentAdminSummary(),
  ]);

  return (
    <div className="min-h-dvh bg-[#0B0C0F] text-[14px] leading-normal text-[#ECECEE] lg:flex">
      <AdminSidebar pending={pending.total} admin={admin} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-8 sm:pt-7">
        {children}
      </main>
    </div>
  );
}
