import { DEFAULT_CONFIG } from "./game";
import type { GameConfig } from "./types";

const num = (v: string | null, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
};

/** Parse + clamp overlay URL params. Shared by the overlay and the studio so they always agree. */
export function configFromParams(q: URLSearchParams): GameConfig {
  return {
    bossName: (q.get("boss") ?? DEFAULT_CONFIG.bossName).replace(/[<>]/g, "").slice(0, 30) || DEFAULT_CONFIG.bossName,
    bossHp: num(q.get("hp"), 500, 1_000_000, DEFAULT_CONFIG.bossHp),
    hpPerRaider: num(q.get("scale"), 0, 5000, DEFAULT_CONFIG.hpPerRaider),
    durationSec: num(q.get("dur"), 30, 1800, DEFAULT_CONFIG.durationSec),
    bossAttackEverySec: num(q.get("atk"), 3, 60, DEFAULT_CONFIG.bossAttackEverySec),
    cooldownMs: num(q.get("cd"), 0, 30_000, DEFAULT_CONFIG.cooldownMs),
  };
}

export function paramsFromConfig(c: GameConfig): URLSearchParams {
  return new URLSearchParams({
    boss: c.bossName,
    hp: String(c.bossHp),
    scale: String(c.hpPerRaider),
    dur: String(c.durationSec),
    atk: String(c.bossAttackEverySec),
    cd: String(c.cooldownMs),
  });
}
