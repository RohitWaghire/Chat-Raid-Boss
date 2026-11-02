import { NextResponse } from "next/server";

/**
 * AI "Dungeon Master": turns the latest raid events into one in-character boss taunt.
 * Real mode: OpenAI Responses API (model from OPENAI_MODEL, default gpt-6-astra).
 * Demo mode (no key): deterministic canned lines so the overlay always works.
 */
const CANNED: Record<string, string[]> = {
  fight: ["Your keyboards are weak, chat.", "Is that all your emotes can do?", "I have survived worse buffering than this."],
  enraged: ["You DARE spam PogChamp at me?!", "Now you've made me angry, chat!", "My armor cracks... but my rage grows!"],
  desperate: ["No... not the combo... NOT THE COMBO!", "One more !atk and I... wait, stop typing!", "Mods! MODS! Ban them all!"],
  victory: ["Defeated... by a chat. GG, mortals.", "I'll be back next stream..."],
  defeat: ["Hah! Chat was too slow. See you next stream.", "Your timer has run out. I remain."],
};

function canned(phase: string) {
  const list = CANNED[phase] ?? CANNED.fight;
  return list[Math.floor(Math.random() * list.length)];
}

// Tiny in-memory per-IP limiter: AI narration is a paid call, so cap bursts (≈1 req / 2s sustained).
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n++;
  return h.n > 30;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ line: canned("fight"), source: "rate-limited" }, { status: 429 });
  let body: { bossName?: string; phase?: string; hpPct?: number; events?: string[]; top?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const phase = String(body.phase ?? "fight");
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ line: canned(phase), source: "demo" });

  const model = process.env.OPENAI_MODEL || "gpt-6-astra";
  const events = (body.events ?? []).slice(0, 8).map((e) => String(e).slice(0, 140));
  const prompt = [
    `You are ${String(body.bossName ?? "the boss").slice(0, 40)}, a raid boss being fought live by a Twitch chat.`,
    `Phase: ${phase}. Boss HP: ${Math.round(Number(body.hpPct ?? 100))}%.`,
    `Top attackers: ${(body.top ?? []).slice(0, 3).join(", ") || "none yet"}.`,
    `Latest events:\n${events.join("\n") || "(quiet)"}`,
    "Reply with ONE short, funny, PG-13 in-character taunt (max 14 words). You may call out a chatter by name. No hashtags, no quotes.",
  ].join("\n");
  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: prompt, max_output_tokens: 400, reasoning: { effort: "low" } }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    const j = await r.json();
    const text: string =
      j.output_text ??
      (j.output ?? [])
        .flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
        .filter((c: { type: string }) => c.type === "output_text")
        .map((c: { text?: string }) => c.text ?? "")
        .join("");
    const line = text.trim().replace(/^"|"$/g, "").slice(0, 160);
    return NextResponse.json({ line: line || canned(phase), source: line ? model : "demo" });
  } catch {
    return NextResponse.json({ line: canned(phase), source: "fallback" });
  }
}
