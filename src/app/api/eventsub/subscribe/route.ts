import { NextResponse } from "next/server";

/** Creates a channel.channel_points_custom_reward_redemption.add subscription for a WebSocket session. */
export async function POST(req: Request) {
  const id = process.env.TWITCH_CLIENT_ID;
  const token = process.env.TWITCH_USER_TOKEN;
  if (!id || !token) return NextResponse.json({ enabled: false, error: "EventSub not configured" }, { status: 501 });
  let body: { sessionId?: unknown; channel?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const channel = typeof body.channel === "string" ? body.channel.toLowerCase() : "";
  if (!/^[\w-]{4,200}$/.test(sessionId) || !/^[a-z0-9_]{3,25}$/.test(channel)) {
    return NextResponse.json({ error: "Invalid sessionId or channel" }, { status: 400 });
  }
  const h = { "Client-Id": id, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    const u = await fetch(`https://api.twitch.tv/helix/users?login=${channel}`, { headers: h }).then((r) => r.json());
    const broadcaster = u.data?.[0]?.id;
    if (!broadcaster) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    const r = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        type: "channel.channel_points_custom_reward_redemption.add",
        version: "1",
        condition: { broadcaster_user_id: broadcaster },
        transport: { method: "websocket", session_id: sessionId },
      }),
    });
    return NextResponse.json({ enabled: r.ok, status: r.status }, { status: r.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ error: "Twitch API unavailable" }, { status: 502 });
  }
}
