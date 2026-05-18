import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password !== process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Mot de passe incorrect" },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_auth", process.env.ADMIN_SECRET!, {
    httpOnly: true, // pas accessible en JS côté client
    secure: true, // HTTPS uniquement (Vercel = OK)
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: "/",
  });

  return NextResponse.json({ success: true });
}
