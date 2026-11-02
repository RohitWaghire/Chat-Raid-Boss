export type ChatMessage = {
  id: string;
  user: string;
  color: string;
  text: string;
  bits: number;
  isSub: boolean;
  isMod: boolean;
  ts: number;
};

export type FeedKind =
  | "hit" | "crit" | "heal" | "shield" | "bits" | "combo" | "boss" | "ko" | "phase" | "system" | "revive" | "ult" | "redeem";

export type FeedItem = { id: string; kind: FeedKind; text: string; ts: number; amount?: number };

/** A floating damage number / effect rendered on the boss. */
export type Pop = { id: string; amount: number; kind: "hit" | "crit" | "combo" | "bits" | "ult" | "heal"; x: number; ts: number };

export type Player = {
  name: string;
  color: string;
  damage: number;
  heals: number;
  hits: number;
  shields: number;
  koUntil: number;
  lastSeen: number;
  lastAction: number;
};

export type Phase = "lobby" | "fight" | "enraged" | "desperate" | "victory" | "defeat";

export type GameConfig = {
  bossName: string;
  /** Base HP before chat-size scaling. */
  bossHp: number;
  /** Extra max HP added per unique raider who joins (0 disables scaling). */
  hpPerRaider: number;
  durationSec: number;
  bossAttackEverySec: number;
  /** Per-user cooldown between counted actions (anti-spam). */
  cooldownMs: number;
};

export type GameState = {
  config: GameConfig;
  phase: Phase;
  hp: number;
  maxHp: number;
  shield: number;
  startedAt: number;
  endsAt: number;
  endedAt: number;
  nextBossAttack: number;
  players: Record<string, Player>;
  feed: FeedItem[];
  pops: Pop[];
  combo: { emote: string; count: number; until: number } | null;
  /** Shared team meter 0..100; at 100 anyone can fire !ult. */
  hype: number;
  bossLine: string;
  shakeKey: number;
  /** Increments when the boss strikes (for sound/flash). */
  bossStrikeKey: number;
  totalMessages: number;
  ignored: number;
  /** Number of distinct raiders (kept in sync with players, avoids O(n) counting per message). */
  raiders: number;
};
