"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyMessages, applyRedemption, createGame, isOver, leaderboard, startGame, tick } from "./game";
import { randomDemoMessage } from "./demoChat";
import { connectTwitchChat, type ChatStatus } from "./twitchChat";
import { connectEventSub, type Redemption } from "./eventsub";
import { play } from "./sfx";
import type { ChatMessage, GameConfig, GameState } from "./types";

export type RaidOptions = {
  channel: string;
  demo: boolean;
  config: GameConfig;
  autostart?: boolean;
  narrate?: boolean;
  eventsub?: boolean;
  /** Simulated chat speed in messages/sec for demo mode. */
  demoRate?: number;
};

const NARRATE_EVERY_MS = 8_000;
const NARRATE_TIMEOUT_MS = 6_000;
const MAX_QUEUE = 500;

export function useRaid({ channel, demo, config, autostart, narrate = true, eventsub = false, demoRate = 4 }: RaidOptions) {
  const [state, setState] = useState<GameState>(() => createGame(config, 0));
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [narrator, setNarrator] = useState("");
  const [now, setNow] = useState(0);
  const stateRef = useRef(state);
  const queue = useRef<ChatMessage[]>([]);
  const redemptions = useRef<Redemption[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Messages are queued and applied once per animation frame, so a chat flood costs one render per frame. */
  const inject = useCallback((m: ChatMessage) => {
    if (queue.current.length < MAX_QUEUE) queue.current.push(m);
  }, []);

  const start = useCallback(() => setState((s) => startGame({ ...s, config })), [config]);
  const reset = useCallback(() => setState(createGame(config)), [config]);

  // Config edits in the lobby apply immediately.
  useEffect(() => {
    setState((s) => (s.phase === "lobby" ? createGame(config) : s));
  }, [config]);

  useEffect(() => {
    if (autostart) setState(startGame(createGame(config)));
  }, [autostart, config]);

  // Chat source
  useEffect(() => {
    if (demo) {
      setStatus("connected");
      const id = setInterval(() => inject(randomDemoMessage()), 1000 / Math.max(0.5, demoRate));
      return () => clearInterval(id);
    }
    if (!channel) return;
    return connectTwitchChat(channel, inject, setStatus);
  }, [demo, channel, inject, demoRate]);

  // Optional EventSub channel-points redemptions (server holds the token).
  useEffect(() => {
    if (!eventsub || demo || !channel) return;
    return connectEventSub(channel, (r) => redemptions.current.push(r));
  }, [eventsub, demo, channel]);

  // Frame loop: drain queue + timers. rAF pauses when hidden; OBS keeps rendering browser sources.
  useEffect(() => {
    let raf = 0;
    let lastTick = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const q = queue.current;
      const r = redemptions.current;
      if (q.length || r.length || t - lastTick > 200) {
        lastTick = t;
        queue.current = [];
        redemptions.current = [];
        const n = Date.now();
        setNow(n);
        setState((s) => {
          let next = s;
          next = applyMessages(next, q, n);
          for (const x of r) next = applyRedemption(next, x.user, x.reward, n);
          return tick(next, n);
        });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Sound effects derived from state changes
  const prev = useRef(state);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (state.phase !== p.phase) {
      if (state.phase === "victory") return play("win");
      if (state.phase === "defeat") return play("lose");
      if (state.phase === "enraged" || state.phase === "desperate") play("phase");
    }
    if (state.bossStrikeKey !== p.bossStrikeKey) play("boss");
    const fresh = state.pops.filter((x) => !p.pops.some((y) => y.id === x.id));
    const kinds = new Set(fresh.map((x) => x.kind));
    for (const k of ["ult", "bits", "combo", "crit", "heal", "hit"] as const) {
      if (kinds.has(k)) {
        play(k);
        break;
      }
    }
  }, [state]);

  // AI narrator: fixed cadence, aborts if slow, keeps the last good line.
  const phase = state.phase;
  useEffect(() => {
    if (!narrate || phase === "lobby") return;
    let alive = true;
    let inflight: AbortController | null = null;
    const ask = async () => {
      if (inflight) return;
      const s = stateRef.current;
      inflight = new AbortController();
      const timer = setTimeout(() => inflight?.abort(), NARRATE_TIMEOUT_MS);
      try {
        const r = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: inflight.signal,
          body: JSON.stringify({
            bossName: s.config.bossName,
            phase: s.phase,
            hpPct: (s.hp / s.maxHp) * 100,
            events: s.feed.slice(0, 8).map((f) => f.text),
            top: leaderboard(s, 3).map((p) => p.name),
          }),
        });
        if (r.ok) {
          const j = await r.json();
          if (alive && typeof j.line === "string" && j.line) setNarrator(j.line);
        }
      } catch {
        /* slow or offline narrator: keep last line, game continues */
      } finally {
        clearTimeout(timer);
        inflight = null;
      }
    };
    setNarrator("");
    ask();
    if (phase === "victory" || phase === "defeat") return () => void (alive = false);
    const id = setInterval(ask, NARRATE_EVERY_MS);
    return () => {
      alive = false;
      clearInterval(id);
      inflight?.abort();
    };
  }, [phase, narrate]);

  return { state, status, narrator, now, start, reset, inject, over: isOver(state) };
}
