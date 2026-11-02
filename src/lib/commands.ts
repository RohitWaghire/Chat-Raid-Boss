export type Command =
  | { type: "attack" }
  | { type: "heal" }
  | { type: "shield" }
  | { type: "ult" }
  | { type: "admin"; action: "start" | "reset" }
  | { type: "emote"; emote: string }
  | { type: "none" };

const ALIASES: Record<string, Command["type"]> = {
  "!atk": "attack", "!attack": "attack", "!hit": "attack", "!a": "attack",
  "!heal": "heal", "!revive": "heal", "!h": "heal",
  "!shield": "shield", "!block": "shield", "!s": "shield",
  "!ult": "ult", "!ultimate": "ult",
};

/** Single-token messages that look like Twitch/BTTV emotes (PogChamp, LUL, KEKW, Kappa) or emoji. */
export function emoteOf(text: string): string | null {
  const t = text.trim();
  if (t.startsWith("!")) return null;
  if (/^[A-Za-z][A-Za-z0-9_]{2,24}$/.test(t) && /[A-Z]/.test(t.slice(1))) return t;
  if (/^(\p{Extended_Pictographic}\uFE0F?){1,3}$/u.test(t)) return t;
  return null;
}

export function parseCommand(text: string, isMod: boolean): Command {
  const t = text.trim().slice(0, 200);
  const [head = "", arg = ""] = t.toLowerCase().split(/\s+/);
  if (head === "!raid" && isMod && (arg === "start" || arg === "reset")) return { type: "admin", action: arg };
  const type = ALIASES[head];
  if (type && type !== "admin" && type !== "emote" && type !== "none") return { type } as Command;
  const emote = emoteOf(t);
  if (emote) return { type: "emote", emote };
  return { type: "none" };
}
