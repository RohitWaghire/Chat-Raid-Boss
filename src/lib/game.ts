import { parseCommand } from "./commands";
import type { ChatMessage, FeedItem, FeedKind, GameConfig, GameState, Player, Pop } from "./types";

export { emoteOf } from "./commands";

export const DEFAULT_CONFIG: GameConfig = {
  bossName: "The Lag Wyrm",
  bossHp: 4000,
  hpPerRaider: 150,
  durationSec: 180,
  bossAttackEverySec: 9,
  cooldownMs: 1200,
};

export const PRESETS: Record<string, { label: string; hint: string; config: Partial<GameConfig> }> = {
  cozy: { label: "Cozy", hint: "5–30 viewers", config: { bossHp: 1500, hpPerRaider: 120, durationSec: 150, bossAttackEverySec: 11, cooldownMs: 800 } },
  standard: { label: "Standard", hint: "30–300 viewers", config: { bossHp: 4000, hpPerRaider: 150, durationSec: 180, bossAttackEverySec: 9, cooldownMs: 1200 } },
  hype: { label: "Hype train", hint: "300–5k viewers", config: { bossHp: 15000, hpPerRaider: 90, durationSec: 240, bossAttackEverySec: 7, cooldownMs: 2000 } },
  mega: { label: "Mega raid", hint: "5k+ viewers", config: { bossHp: 50000, hpPerRaider: 40, durationSec: 300, bossAttackEverySec: 6, cooldownMs: 3000 } },
};

export const KO_MS = 15_000;
export const COMBO_WINDOW_MS = 4_000;
const FEED_MAX = 30;
const POP_MAX = 14;
const POP_TTL = 1_400;
const PLAYER_MAX = 5_000;
let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** Injected randomness so the engine is deterministic in tests. */
export type Rng = () => number;
const defaultRng: Rng = Math.random;

export function createGame(config: GameConfig = DEFAULT_CONFIG, now = Date.now()): GameState {
  return {
    config,
    phase: "lobby",
    hp: config.bossHp,
    maxHp: config.bossHp,
    shield: 0,
    startedAt: now,
    endsAt: now + config.durationSec * 1000,
    endedAt: 0,
    nextBossAttack: now + config.bossAttackEverySec * 1000,
    players: {},
    feed: [],
    pops: [],
    combo: null,
    hype: 0,
    bossLine: `${config.bossName} awaits. Type !atk in chat to begin.`,
    shakeKey: 0,
    bossStrikeKey: 0,
    totalMessages: 0,
    ignored: 0,
    raiders: 0,
  };
}

export function startGame(s: GameState, now = Date.now()): GameState {
  return {
    ...createGame(s.config, now),
    phase: "fight",
    bossLine: `${s.config.bossName} has entered the stream`,
    feed: [item("system", "Raid started · !atk · !heal · !shield · emote combos · !ult when Hype is full", now)],
  };
}

export const isOver = (s: GameState) => s.phase === "victory" || s.phase === "defeat";

function item(kind: FeedKind, text: string, ts: number, amount?: number): FeedItem {
  return { id: uid(), kind, text, ts, amount };
}

function pushFeed(s: GameState, items: FeedItem[]): FeedItem[] {
  return items.length ? [...items.reverse(), ...s.feed].slice(0, FEED_MAX) : s.feed;
}

function pop(s: GameState, amount: number, kind: Pop["kind"], now: number, rng: Rng) {
  s.pops = [...s.pops.filter((p) => now - p.ts < POP_TTL), { id: uid(), amount, kind, x: 15 + rng() * 70, ts: now }].slice(-POP_MAX);
}

function phaseFor(s: GameState): GameState["phase"] {
  const pct = s.hp / s.maxHp;
  if (s.hp <= 0) return "victory";
  if (pct <= 0.2) return "desperate";
  if (pct <= 0.5) return "enraged";
  return "fight";
}

function dealDamage(s: GameState, raw: number): { dealt: number; absorbed: number } {
  const absorbed = Math.min(s.shield, raw);
  s.shield -= absorbed;
  const dealt = Math.min(s.hp, raw - absorbed);
  s.hp -= dealt;
  return { dealt, absorbed };
}

const addHype = (s: GameState, n: number) => (s.hype = Math.min(100, s.hype + n));

function newPlayer(m: ChatMessage, now: number): Player {
  return { name: m.user, color: m.color, damage: 0, heals: 0, hits: 0, shields: 0, koUntil: 0, lastSeen: now, lastAction: 0 };
}

/** Apply one chat message to the game. Does not mutate the input state. */
export function applyMessage(prev: GameState, m: ChatMessage, now = Date.now(), rng: Rng = defaultRng): GameState {
  return applyMessages(prev, [m], now, rng);
}

/**
 * Apply a batch of chat messages. Clones state once per batch (not per message), so a
 * 5,000-raider chat spamming 100 msg/s stays O(messages) instead of O(messages × raiders).
 */
export function applyMessages(prev: GameState, ms: ChatMessage[], now = Date.now(), rng: Rng = defaultRng): GameState {
  let s = prev;
  let owned = false;
  for (const m of ms) {
    const cmd = parseCommand(m.text, m.isMod);
    if (cmd.type === "admin") {
      s = cmd.action === "start" ? startGame(s, now) : createGame(s.config, now);
      owned = false;
      continue;
    }
    if (!owned) {
      s = { ...s, players: { ...s.players } };
      owned = true;
    }
    step(s, m, cmd, now, rng);
  }
  return s;
}

/** Mutates `s`, which must already be a private copy (see applyMessages). */
function step(s: GameState, m: ChatMessage, cmd: ReturnType<typeof parseCommand>, now: number, rng: Rng) {
  s.totalMessages++;
  if (s.phase === "lobby" || isOver(s)) return;
  const before = s.phase;

  const key = m.user.toLowerCase();
  const existing = s.players[key];
  if (!existing && s.raiders >= PLAYER_MAX) return;
  if (!existing) s.raiders++;
  const p: Player = { ...(existing ?? newPlayer(m, now)) };
  p.lastSeen = now;
  p.color = m.color || p.color;
  s.players[key] = p;
  const items: FeedItem[] = [];

  // Chat-size scaling: each new raider makes the boss tougher, keeping the fight close at any size.
  if (!existing && s.config.hpPerRaider > 0) {
    s.maxHp += s.config.hpPerRaider;
    s.hp += s.config.hpPerRaider;
  }

  // Bits always count (they cost real money), bypassing cooldown and KO.
  if (m.bits > 0) {
    const { dealt } = dealDamage(s, Math.min(m.bits, 100_000) * 2);
    p.damage += dealt;
    addHype(s, Math.ceil(m.bits / 10));
    pop(s, dealt, "bits", now, rng);
    items.push(item("bits", `${m.user} cheered ${m.bits} bits · ${dealt} damage`, now, dealt));
    s.shakeKey++;
  }

  const acting = cmd.type !== "none";
  const onCooldown = acting && cmd.type !== "emote" && now - p.lastAction < s.config.cooldownMs;
  const knocked = p.koUntil > now;

  if (onCooldown) {
    s.ignored++;
  } else if (cmd.type === "heal") {
    p.lastAction = now;
    if (knocked) items.push(item("ko", `${m.user} is KO'd and can't heal`, now));
    else {
      const downed = Object.values(s.players)
        .filter((x) => x.koUntil > now && x.name !== p.name)
        .sort((a, b) => b.damage - a.damage);
      p.heals++;
      if (downed.length) {
        const t = { ...downed[0], koUntil: 0 };
        s.players[t.name.toLowerCase()] = t;
        addHype(s, 4);
        pop(s, 0, "heal", now, rng);
        items.push(item("revive", `${m.user} revived ${t.name}`, now));
      } else {
        addHype(s, 1);
        items.push(item("heal", `${m.user} rallies the raid`, now));
      }
    }
  } else if (cmd.type === "shield") {
    p.lastAction = now;
    if (!knocked) {
      p.shields++;
      addHype(s, 1);
      items.push(item("shield", `${m.user} raised a shield wall`, now));
    }
  } else if (cmd.type === "attack") {
    p.lastAction = now;
    if (knocked) items.push(item("ko", `${m.user} is KO'd for ${Math.ceil((p.koUntil - now) / 1000)}s`, now));
    else {
      const crit = rng() < (m.isSub ? 0.25 : 0.12);
      const base = Math.floor(18 + rng() * 17) * (crit ? 3 : 1);
      const { dealt, absorbed } = dealDamage(s, base);
      p.damage += dealt;
      p.hits++;
      addHype(s, crit ? 3 : 1);
      if (dealt > 0) pop(s, dealt, crit ? "crit" : "hit", now, rng);
      items.push(
        item(
          crit ? "crit" : "hit",
          absorbed > 0 && dealt === 0 ? `${m.user}'s hit bounced off the armor` : `${m.user} hits for ${dealt}`,
          now,
          dealt,
        ),
      );
      if (crit) s.shakeKey++;
    }
  } else if (cmd.type === "ult") {
    p.lastAction = now;
    if (s.hype >= 100 && !knocked) {
      s.hype = 0;
      const { dealt } = dealDamage(s, Math.round(s.maxHp * 0.12) + s.shield);
      p.damage += dealt;
      pop(s, dealt, "ult", now, rng);
      items.push(item("ult", `${m.user} unleashed the raid ultimate for ${dealt}`, now, dealt));
      s.shakeKey += 2;
    }
  } else if (cmd.type === "emote" && !knocked) {
    const c = s.combo && s.combo.emote === cmd.emote && s.combo.until > now ? s.combo.count + 1 : 1;
    s.combo = { emote: cmd.emote, count: c, until: now + COMBO_WINDOW_MS };
    if (c >= 3 && c % 3 === 0) {
      const { dealt } = dealDamage(s, Math.min(40 * c, 2000));
      p.damage += dealt;
      addHype(s, 5);
      pop(s, dealt, "combo", now, rng);
      items.push(item("combo", `${cmd.emote} ×${c} combo · ${dealt} damage`, now, dealt));
      s.shakeKey++;
    }
  }

  s.phase = phaseFor(s);
  if (s.phase !== before) {
    if (s.phase === "enraged") items.push(item("phase", `${s.config.bossName} is Enraged · attacks are faster.`, now));
    if (s.phase === "desperate") items.push(item("phase", `${s.config.bossName} is Desperate · finish the raid.`, now));
    if (s.phase === "victory") {
      s.endedAt = now;
      items.push(item("phase", `Chat wins · ${s.config.bossName} was defeated.`, now));
    }
  }
  s.feed = pushFeed(s, items);
}

/** Advance timers: boss attacks, time-out, expiring effects. */
export function tick(prev: GameState, now = Date.now(), rng: Rng = defaultRng): GameState {
  if (prev.phase === "lobby" || isOver(prev)) return prev;
  let s = prev;
  if (now >= s.endsAt) {
    return { ...s, phase: "defeat", endedAt: now, feed: pushFeed(s, [item("phase", `Time's up. ${s.config.bossName} survives for now.`, now)]) };
  }
  if (s.combo && s.combo.until < now) s = { ...s, combo: null };
  if (s.pops.length && now - s.pops[0].ts > POP_TTL) s = { ...s, pops: s.pops.filter((p) => now - p.ts < POP_TTL) };
  if (now >= s.nextBossAttack) {
    s = { ...s, players: { ...s.players } };
    const speed = s.phase === "desperate" ? 0.5 : s.phase === "enraged" ? 0.7 : 1;
    s.nextBossAttack = now + s.config.bossAttackEverySec * 1000 * speed;
    const window = s.config.bossAttackEverySec * 1000;
    const active = Object.values(s.players).filter((p) => p.koUntil < now && now - p.lastSeen < 30_000);
    const recentShields = s.feed.filter((f) => f.kind === "shield" && now - f.ts <= window).length;
    const want = s.phase === "fight" ? 2 : 3;
    // Bigger chats get hit by more KOs so it stays tense.
    const scaled = want + Math.floor(active.length / 25);
    const targets = Math.max(0, Math.min(active.length, scaled - recentShields));
    const victims = [...active]
      .map((p) => ({ p, r: rng() }))
      .sort((a, b) => a.r - b.r)
      .slice(0, targets)
      .map((x) => x.p);
    for (const t of victims) s.players[t.name.toLowerCase()] = { ...t, koUntil: now + KO_MS };
    const armor = s.phase === "desperate" ? 0 : Math.floor(40 + rng() * 80);
    s.shield = Math.max(s.shield, armor);
    const msg =
      recentShields > 0 && targets === 0
        ? `Chat's shield wall blocked ${s.config.bossName}'s attack`
        : victims.length
          ? `${s.config.bossName} strikes · ${victims.map((p) => p.name).join(", ")} KO'd · !heal to revive`
          : `${s.config.bossName} roars and hardens its armor (+${armor}).`;
    s.feed = pushFeed(s, [item("boss", msg, now)]);
    s.shakeKey++;
    s.bossStrikeKey++;
  }
  return s;
}

/** Channel-points / EventSub style power-up applied by the streamer's backend. */
export function applyRedemption(prev: GameState, user: string, reward: "smite" | "revive_all" | "freeze", now = Date.now()): GameState {
  if (prev.phase === "lobby" || isOver(prev)) return prev;
  const s: GameState = { ...prev, players: { ...prev.players } };
  let text = "";
  if (reward === "smite") {
    const { dealt } = dealDamage(s, Math.round(s.maxHp * 0.05));
    pop(s, dealt, "ult", now, defaultRng);
    text = `${user} redeemed Smite for ${dealt}`;
    s.shakeKey++;
  } else if (reward === "revive_all") {
    for (const [k, p] of Object.entries(s.players)) if (p.koUntil > now) s.players[k] = { ...p, koUntil: 0 };
    text = `${user} redeemed Mass Revive`;
  } else {
    s.nextBossAttack += 10_000;
    text = `${user} froze the boss for 10s`;
  }
  s.phase = phaseFor(s);
  if (s.phase === "victory") s.endedAt = now;
  s.feed = pushFeed(s, [item("redeem", text, now)]);
  return s;
}

export function leaderboard(s: GameState, n = 5): Player[] {
  return Object.values(s.players)
    .sort((a, b) => b.damage - a.damage)
    .slice(0, n);
}

export function awards(s: GameState) {
  const ps = Object.values(s.players);
  const best = (f: (p: Player) => number) => ps.reduce<Player | null>((a, p) => (f(p) > 0 && (!a || f(p) > f(a)) ? p : a), null);
  return { mvp: best((p) => p.damage), medic: best((p) => p.heals), tank: best((p) => p.shields) };
}
