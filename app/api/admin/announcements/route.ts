import { isAdminUser } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) return NextResponse.json(null, { status: 403 });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(announcements);
}
