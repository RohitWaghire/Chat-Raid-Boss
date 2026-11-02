import { describe, expect, it } from "vitest";
import { detectAchievements } from "../src/components/AchievementToasts";
import { applyMessage, createGame, DEFAULT_CONFIG, startGame } from "../src/lib/game";
import type { ChatMessage, GameState } from "../src/lib/types";

const T0 = 1_000_000;
const rng = () => 0.5;
let n = 0;
const msg = (user: string, text: string): ChatMessage => ({ id: `a${n++}`, user, color: "#fff", text, bits: 0, isSub: false, isMod: false, ts: T0 });
const live = () => startGame(createGame({ ...DEFAULT_CONFIG, bossHp: 1000, hpPerRaider: 0 }, T0), T0);

describe("detectAchievements", () => {
  it("is quiet on the first observed state", () => {
    expect(detectAchievements(null, live())).toEqual([]);
  });
  it("fires First Blood once on the first damage", () => {
    const a = live();
    const b = applyMessage(a, msg("alice", "!atk"), T0 + 10, rng);
    const got = detectAchievements(a, b);
    expect(got.map((x) => x.title)).toContain("First Blood");
    const c = applyMessage(b, msg("bob", "!atk"), T0 + 20, rng);
    expect(detectAchievements(b, c).map((x) => x.title)).not.toContain("First Blood");
  });
  it("never throws on malformed input", () => {
    expect(() => detectAchievements({} as GameState, {} as GameState)).not.toThrow();
  });
});
