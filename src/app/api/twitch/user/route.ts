import { NextResponse } from "next/server";

/** Looks up a broadcaster via Twitch Helix (GET /helix/users) using an app access token. */
let cached: { token: string; exp: number } | null = null;

async function appToken(id: string, secret: string) {
  if (cached && cached.exp > Date.now()) return cached.token;
  const r = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  const j = await r.json();
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return cached.token;
}

export async function GET(req: Request) {
  const login = new URL(req.url).searchParams.get("login")?.toLowerCase().trim() ?? "";
  if (!/^[a-z0-9_]{3,25}$/.test(login)) return NextResponse.json({ error: "Invalid channel name" }, { status: 400 });
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) {
    return NextResponse.json({ source: "demo", user: { login, display_name: login, profile_image_url: null, live: null } });
  }
  try {
    const token = await appToken(id, secret);
    const h = { "Client-Id": id, Authorization: `Bearer ${token}` };
    const [u, s] = await Promise.all([
      fetch(`https://api.twitch.tv/helix/users?login=${login}`, { headers: h }).then((r) => r.json()),
      fetch(`https://api.twitch.tv/helix/streams?user_login=${login}`, { headers: h }).then((r) => r.json()),
    ]);
    const user = u.data?.[0];
    if (!user) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    const stream = s.data?.[0];
    return NextResponse.json({
      source: "helix",
      user: {
        login: user.login,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        live: stream ? { title: stream.title, game: stream.game_name, viewers: stream.viewer_count } : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Twitch API unavailable" }, { status: 502 });
  }
}
