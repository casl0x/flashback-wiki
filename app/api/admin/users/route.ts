import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const client = await clerkClient();
  const { data } = await client.users.getUserList({ query: q, limit: 10 });

  return NextResponse.json(
    data.map((u) => ({
      clerkUserId: u.id,
      username: u.username ?? u.firstName ?? "Anonyme",
      avatarUrl: u.imageUrl,
    })),
  );
}
