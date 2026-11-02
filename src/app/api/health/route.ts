import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    ai: Boolean(process.env.OPENAI_API_KEY),
    aiModel: process.env.OPENAI_MODEL || "gpt-6-astra",
    twitchApi: Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET),
    eventsub: Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_USER_TOKEN),
  });
}
