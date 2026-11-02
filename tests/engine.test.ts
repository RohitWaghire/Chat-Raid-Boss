import { describe, expect, it } from "vitest";
import { applyMessage, applyMessages, applyRedemption, awards, createGame, DEFAULT_CONFIG, isOver, leaderboard, startGame, tick } from "../src/lib/game";
import { parseCommand } from "../src/lib/commands";
import { configFromParams, paramsFromConfig } from "../src/lib/config";
import type { ChatMessage } from "../src/lib/types";

const T0 = 1_000_000;
const rng = () => 0.5; // deterministic: no crits for non-subs (0.5 > 0.12)
let n = 0;
const msg = (user: string, text: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({ id: `${n++}`, user, color: "#fff", text, bits: 0, isSub: false, isMod: false, ts: T0, ...extra });
const cfg = { ...DEFAULT_CONFIG, bossHp: 1000, hpPerRaider: 0, cooldownMs: 1000 };
const live = () => startGame(createGame(cfg, T0), T0);

describe("parseCommand", () => {
  it("maps aliases", () => {
    for (const t of ["!atk", "!ATTACK", "!hit", "!a"]) expect(parseCommand(t, false).type).toBe("attack");
    expect(parseCommand("!heal", false).type).toBe("heal");
    expect(parseCommand("!revive pls", false).type).toBe("heal");
    expect(parseCommand("!block", false).type).toBe("shield");
    expect(parseCommand("!ult", false).type).toBe("ult");
  });
  it("only mods can admin", () => {
    expect(parseCommand("!raid start", true)).toEqual({ type: "admin", action: "start" });
    expect(parseCommand("!raid start", false).type).toBe("none");
    expect(parseCommand("!raid nuke", true).type).toBe("none");
  });
  it("detects emotes and ignores prose", () => {
    expect(parseCommand("PogChamp", false)).toEqual({ type: "emote", emote: "PogChamp" });
    expect(parseCommand("🔥", false).type).toBe("emote");
    expect(parseCommand("hello there", false).type).toBe("none");
    expect(parseCommand("hello", false).type).toBe("none");
  });
  it("handles hostile input", () => {
    expect(parseCommand("x".repeat(100_000), false).type).toBe("none");
    expect(parseCommand("", false).type).toBe("none");
    expect(parseCommand("!__proto__", false).type).toBe("none");
  });
});

describe("engine", () => {
  it("lobby ignores attacks; start begins the fight", () => {
    const s = applyMessage(createGame(cfg, T0), msg("a", "!atk"), T0, rng);
    expect(s.hp).toBe(1000);
    const m = applyMessage(createGame(cfg, T0), msg("mod", "!raid start", { isMod: true }), T0, rng);
    expect(m.phase).toBe("fight");
  });
  it("attack deals damage and records the player", () => {
    const s = applyMessage(live(), msg("alice", "!atk"), T0, rng);
    expect(s.hp).toBeLessThan(1000);
    expect(s.players.alice.damage).toBe(1000 - s.hp);
  });
  it("does not mutate input state", () => {
    const a = live();
    const snap = JSON.stringify(a);
    applyMessage(a, msg("x", "!atk"), T0, rng);
    expect(JSON.stringify(a)).toBe(snap);
  });
  it("enforces per-user cooldown, not global", () => {
    let s = live();
    s = applyMessage(s, msg("a", "!atk"), T0, rng);
    const hp1 = s.hp;
    s = applyMessage(s, msg("a", "!atk"), T0 + 100, rng);
    expect(s.hp).toBe(hp1);
    expect(s.ignored).toBe(1);
    s = applyMessage(s, msg("b", "!atk"), T0 + 100, rng);
    expect(s.hp).toBeLessThan(hp1);
    s = applyMessage(s, msg("a", "!atk"), T0 + 1200, rng);
    expect(s.players.a.hits).toBe(2);
  });
  it("scales HP with new raiders", () => {
    let s = startGame(createGame({ ...cfg, hpPerRaider: 100 }, T0), T0);
    s = applyMessage(s, msg("a", "hi"), T0, rng);
    s = applyMessage(s, msg("b", "hi"), T0, rng);
    s = applyMessage(s, msg("a", "again"), T0, rng);
    expect(s.maxHp).toBe(1200);
  });
  it("bits bypass cooldown and are capped", () => {
    let s = startGame(createGame({ ...cfg, bossHp: 10_000_000 }, T0), T0);
    s = applyMessage(s, msg("rich", "Cheer999999", { bits: 999_999 }), T0, rng);
    expect(10_000_000 - s.hp).toBeLessThanOrEqual(200_000);
  });
  it("emote combo triggers every 3rd", () => {
    let s = live();
    for (const u of ["a", "b", "c"]) s = applyMessage(s, msg(u, "PogChamp"), T0, rng);
    expect(s.feed.some((f) => f.kind === "combo")).toBe(true);
  });
  it("boss KOs players and heal revives", () => {
    let s = live();
    for (const u of ["a", "b", "c", "d"]) s = applyMessage(s, msg(u, "hey"), T0, rng);
    s = tick(s, s.nextBossAttack, rng);
    const downed = Object.values(s.players).filter((p) => p.koUntil > s.nextBossAttack - 1);
    expect(downed.length).toBe(2);
    const healer = Object.values(s.players).find((p) => p.koUntil === 0)!;
    const t = s.nextBossAttack - cfg.bossAttackEverySec * 1000 + 10;
    const before = Object.values(s.players).filter((p) => p.koUntil > t).length;
    s = applyMessage(s, msg(healer.name, "!heal"), t, rng);
    expect(Object.values(s.players).filter((p) => p.koUntil > t).length).toBe(before - 1);
  });
  it("shields block boss strikes", () => {
    let s = live();
    for (const u of ["a", "b"]) s = applyMessage(s, msg(u, "!shield"), T0, rng);
    s = tick(s, s.nextBossAttack, rng);
    expect(Object.values(s.players).every((p) => p.koUntil === 0)).toBe(true);
  });
  it("ult needs full hype", () => {
    let s = live();
    s = applyMessage(s, msg("a", "!ult"), T0, rng);
    expect(s.hp).toBe(1000);
    s = { ...s, hype: 100 };
    s = applyMessage(s, msg("b", "!ult"), T0, rng);
    expect(s.hp).toBeLessThanOrEqual(1000 - 120);
    expect(s.hype).toBe(0);
  });
  it("victory and timeout end the game", () => {
    let s = applyMessage(live(), msg("whale", "Cheer1000", { bits: 1000 }), T0, rng);
    expect(s.phase).toBe("victory");
    expect(isOver(s)).toBe(true);
    expect(awards(s).mvp?.name).toBe("whale");
    s = tick(live(), T0 + cfg.durationSec * 1000, rng);
    expect(s.phase).toBe("defeat");
  });
  it("redemptions work", () => {
    let s = live();
    s = applyRedemption(s, "v", "smite", T0);
    expect(s.hp).toBe(950);
    const next = s.nextBossAttack;
    s = applyRedemption(s, "v", "freeze", T0);
    expect(s.nextBossAttack).toBe(next + 10_000);
  });
  it("stays bounded over a long, huge session", () => {
    let s = startGame(createGame({ ...cfg, bossHp: 1e9, durationSec: 100_000, cooldownMs: 0 }, T0), T0);
    // 50k messages from 7k chatters, drained in per-frame batches like useRaid does.
    const t = performance.now();
    for (let b = 0; b < 500; b++) {
      const now = T0 + b * 200;
      const batch = Array.from({ length: 100 }, (_, j) => { const i = b * 100 + j; return msg(`u${i % 7000}`, i % 5 ? "!atk" : "KEKW"); });
      s = applyMessages(s, batch, now, rng);
      s = tick(s, now, rng);
    }
    expect(performance.now() - t).toBeLessThan(3000);
    expect(Object.keys(s.players).length).toBeLessThanOrEqual(5000);
    expect(s.feed.length).toBeLessThanOrEqual(30);
    expect(s.pops.length).toBeLessThanOrEqual(14);
    expect(leaderboard(s).length).toBe(5);
  });
});

describe("config URL", () => {
  it("round-trips and clamps", () => {
    const c = { ...DEFAULT_CONFIG, bossName: "Zed", bossHp: 9000, cooldownMs: 500 };
    expect(configFromParams(paramsFromConfig(c))).toMatchObject({ bossName: "Zed", bossHp: 9000, cooldownMs: 500 });
    const bad = configFromParams(new URLSearchParams("hp=-5&dur=999999&cd=abc&boss=" + "x".repeat(500)));
    expect(bad.bossHp).toBeGreaterThan(0);
    expect(bad.durationSec).toBeLessThanOrEqual(3600);
    expect(Number.isFinite(bad.cooldownMs)).toBe(true);
    expect(bad.bossName.length).toBeLessThanOrEqual(40);
  });
});

import { readable } from "../src/lib/color";
describe("readable name colors", () => {
  it("lightens dark colors, keeps bright ones, handles junk", () => {
    expect(readable("#0000FF")).not.toBe("#0000ff");
    expect(readable("#FFFF00")).toBe("#ffff00");
    expect(readable("javascript:alert(1)")).toBe("#e9d5ff");
  });
});
