import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://chess-elo-api-kalel1130.pythonanywhere.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const timeClass = searchParams.get("time_class") ?? "rapid";

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${BASE}/api/player/${encodeURIComponent(username)}/rating-history/?time_class=${encodeURIComponent(timeClass)}`,
      { cache: "no-store" }
    );

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 }
    );
  }
}
