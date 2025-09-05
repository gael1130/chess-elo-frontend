import { NextResponse } from "next/server";

const BASE = "https://chess-elo-api-kalel1130.pythonanywhere.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const onlyNew = searchParams.get("only_new");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const qs = new URLSearchParams();
  if (onlyNew) qs.set("only_new", onlyNew);

  try {
    const upstream = await fetch(
      `${BASE}/api/player/${encodeURIComponent(username)}/scrape-games/${qs.toString() ? `?${qs.toString()}` : ""}`,
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
