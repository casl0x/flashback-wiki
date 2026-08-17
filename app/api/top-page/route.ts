// app/api/top-pages/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return NextResponse.json({ error: "Variables manquantes" }, { status: 500 });
  }

  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const params = new URLSearchParams({
    projectId,
    by: "requestPath",
    since: since.toISOString(),
    until: until.toISOString(),
    limit: "50",
    ...(teamId ? { teamId } : {}),
  });

  try {
    const res = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    // Log pour déboguer
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}