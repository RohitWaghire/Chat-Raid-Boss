"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import { BossArt, type BossVariant } from "@/components/BossArt";
import { BOSSES } from "@/components/BossSelect";
import { isOver, leaderboard } from "@/lib/game";
import type { GameState, Phase } from "@/lib/types";

type CompactArenaProps = { state: GameState; now: number };

type Ranked = ReturnType<typeof leaderboard>[number];

type FeedItem = { id: number; name: string; color: string; amount: number; at: number };

type Tracker = {
  source: GameState;
  damage: ReadonlyMap<string, number>;
  shakeKey: GameState["shakeKey"];
  feed: FeedItem[];
  feedSeq: number;
  hitSeq: number;
  combo: number;
  lastHitAt: number;
};

const PANEL_W = 520;
const PANEL_H = 236;
const HP_SEGMENTS = 10;
const COMBO_WINDOW_MS = 2500;
const FEED_TTL_MS = 6000;
const FEED_MAX = 3;
const FEED_PER_UPDATE = 2;
const FEED_SCAN = 50;
const FEED_OPACITY = [1, 0.72, 0.45];

const PHASE_STYLE: Record<Phase, { label: string; chip: string; fill: string; ring: string }> = {
  lobby: { label: "Lobby", chip: "bg-[#cbd5e1] text-[#141415]", fill: "bg-[#94a3b8]", ring: "ring-white/10" },
  fight: { label: "Fight", chip: "bg-[#38bdf8] text-[#141415]", fill: "bg-[#f43f5e]", ring: "ring-white/10" },
  enraged: { label: "Enraged", chip: "bg-[#fb923c] text-[#141415]", fill: "bg-[#f97316]", ring: "ring-[#f97316]/50" },
  desperate: { label: "Desperate", chip: "bg-[#f87171] text-[#141415]", fill: "bg-[#dc2626]", ring: "ring-[#ef4444]/60" },
  victory: { label: "Victory", chip: "bg-[#4ade80] text-[#141415]", fill: "bg-[#22c55e]", ring: "ring-[#4ade80]/40" },
  defeat: { label: "Defeat", chip: "bg-[#a1a1aa] text-[#141415]", fill: "bg-[#71717a]", ring: "ring-white/10" },
};

const ARENA_CSS = `
.ca-ts{text-shadow:0 1px 0 rgb(0 0 0/.85),0 0 1px rgb(0 0 0/.9),0 1px 3px rgb(0 0 0/.55)}
.ca-ts .ca-nts{text-shadow:none}
.ca-flash{opacity:0;animation:ca-flash 220ms ease-out both}
.ca-pop{animation:ca-pop 260ms cubic-bezier(.2,1.6,.4,1) both}
.ca-drain{animation-name:ca-drain;animation-timing-function:linear;animation-fill-mode:both}
.ca-in{animation:ca-in 220ms ease-out backwards}
.ca-pulse{animation:ca-pulse 900ms ease-in-out infinite}
.ca-beat{animation:ca-beat 1s ease-in-out infinite}
.ca-shimmer{animation:ca-shimmer 1.4s ease-in-out infinite}
.ca-banner{animation:ca-banner 360ms cubic-bezier(.2,1.4,.4,1) both}
@keyframes ca-flash{from{opacity:.6}to{opacity:0}}
@keyframes ca-pop{from{transform:scale(1.35)}to{transform:scale(1)}}
@keyframes ca-drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes ca-in{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}
@keyframes ca-pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes ca-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes ca-shimmer{from{transform:translateX(-120%)}to{transform:translateX(320%)}}
@keyframes ca-banner{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .ca-a{animation:none!important}
  .ca-t{transition:none!important}
}
`;

const intFmt = new Intl.NumberFormat("en-US");
const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

const fmtNum = (n: number) => (Math.abs(n) >= 100_000 ? compactFmt.format(n) : intFmt.format(Math.round(n)));

function fmtClock(totalSec: number) {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

const SEGMENT_DIVIDERS = Array.from({ length: HP_SEGMENTS - 1 }, (_, i) => (
  <span
    key={i}
    aria-hidden="true"
    className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[#141415]"
    style={{ left: `${((i + 1) * 100) / HP_SEGMENTS}%` }}
  />
));

function createTracker(state: GameState, scan: Ranked[]): Tracker {
  return {
    source: state,
    damage: new Map(scan.map((p) => [p.name, p.damage])),
    shakeKey: state.shakeKey,
    feed: [],
    feedSeq: 0,
    hitSeq: 0,
    combo: 0,
    lastHitAt: Number.NEGATIVE_INFINITY,
  };
}

function advanceTracker(prev: Tracker, state: GameState, scan: Ranked[], now: number): Tracker {
  if (state.phase === "lobby") return createTracker(state, scan);

  const damage = new Map(prev.damage);
  const deltas: { p: Ranked; amount: number }[] = [];
  for (const p of scan) {
    const amount = p.damage - (prev.damage.get(p.name) ?? 0);
    if (amount > 0) deltas.push({ p, amount });
    damage.set(p.name, p.damage);
  }

  const hit = state.shakeKey !== prev.shakeKey || deltas.length > 0;
  if (!hit) return { ...prev, source: state, damage, shakeKey: state.shakeKey };

  deltas.sort((a, b) => b.amount - a.amount);
  const fresh = deltas.slice(0, FEED_PER_UPDATE).map<FeedItem>(({ p, amount }, i) => ({
    id: prev.feedSeq + i + 1,
    name: p.name,
    color: p.color,
    amount,
    at: now,
  }));

  const chained = prev.combo > 0 && now - prev.lastHitAt <= COMBO_WINDOW_MS;

  return {
    source: state,
    damage,
    shakeKey: state.shakeKey,
    feed: [...fresh, ...prev.feed].slice(0, FEED_MAX),
    feedSeq: prev.feedSeq + fresh.length,
    hitSeq: prev.hitSeq + 1,
    combo: chained ? prev.combo + 1 : 1,
    lastHitAt: now,
  };
}

function comboTone(combo: number) {
  if (combo >= 25) return "text-[#fde047]";
  if (combo >= 10) return "text-[#fb923c]";
  return "text-[#c4a3ff]";
}

function comboFill(combo: number) {
  if (combo >= 25) return "bg-[#fde047]";
  if (combo >= 10) return "bg-[#fb923c]";
  return "bg-[#c084fc]";
}

function CompactArenaImpl({ state, now }: CompactArenaProps) {
  const { phase, hp, maxHp, shield, hype, config } = state;
  const lobby = phase === "lobby";
  const over = isOver(state);
  const enraged = phase === "enraged" || phase === "desperate";
  const desperate = phase === "desperate";

  const top = useMemo(() => leaderboard(state, 3), [state]);
  const scan = useMemo(() => leaderboard(state, FEED_SCAN), [state]);

  const [stored, setStored] = useState(() => createTracker(state, scan));
  let tracker = stored;
  if (stored.source !== state) {
    tracker = advanceTracker(stored, state, scan, now);
    setStored(tracker);
  }

  const variant =
    (BOSSES.find((b) => b.name === state.config.bossName)?.id as BossVariant | undefined) ?? "default";

  const remainingSec = lobby
    ? config.durationSec
    : Math.max(0, Math.ceil((state.endsAt - (state.endedAt || now)) / 1000));
  const lowTime = !lobby && !over && remainingSec <= 10;

  const hpRatio = clamp01(maxHp > 0 ? hp / maxHp : 0);
  const hpPct = Math.round(hpRatio * 100);
  const hypeRatio = clamp01(hype / 100);
  const ultReady = hype >= 100 && !over && !lobby;
  const phaseStyle = PHASE_STYLE[phase];

  const comboLive = !over && !lobby && tracker.combo >= 2 && now - tracker.lastHitAt <= COMBO_WINDOW_MS;
  const feed = lobby || over ? [] : tracker.feed.filter((f) => now - f.at < FEED_TTL_MS);
  const topDamage = top[0]?.damage ?? 0;

  const rootStyle = {
    width: `calc(${PANEL_W}px * var(--s, 1))`,
    height: `calc(${PANEL_H}px * var(--s, 1))`,
    top: "calc(24px * var(--s, 1))",
    right: "calc(24px * var(--s, 1))",
  } as CSSProperties;

  const innerStyle = {
    width: PANEL_W,
    height: PANEL_H,
    transform: "scale(var(--s, 1))",
    transformOrigin: "top left",
    contain: "layout paint style",
  } as CSSProperties;

  return (
    <section
      data-testid="compact-arena"
      data-phase={phase}
      aria-label={`${config.bossName} raid status`}
      className="pointer-events-none fixed select-none"
      style={rootStyle}
    >
      <style href="compact-arena-styles" precedence="default">
        {ARENA_CSS}
      </style>

      <div
        style={innerStyle}
        className={`ca-ts ca-t relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-[#141415]/90 p-3 font-sans text-[#ededed] ring-1 transition-[box-shadow] duration-500 ${phaseStyle.ring}`}
      >
        <div className="flex gap-3">
          <div
            className={`relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#19191b] ring-1 ${
              enraged ? "ring-[#f97316]/60" : "ring-white/10"
            }`}
          >
            <BossArt variant={variant} phase={phase} hit={state.shakeKey} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="flex items-center gap-2">
              <h2 className="min-w-0 flex-1 truncate text-lg font-extrabold leading-tight tracking-tight">
                {config.bossName}
              </h2>
              <span
                className={`ca-nts shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide shadow-[0_1px_2px_rgb(0_0_0/0.6)] ${phaseStyle.chip}`}
              >
                {phaseStyle.label}
              </span>
              <span
                className={`w-14 shrink-0 text-right font-mono text-lg font-bold tabular-nums leading-tight ${
                  lowTime ? "ca-a ca-beat text-[#fca5a5]" : "text-[#ededed]"
                }`}
                aria-label={lobby ? "Ready" : `${remainingSec} seconds remaining`}
              >
                {lobby ? "ready" : fmtClock(remainingSec)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div
                role="progressbar"
                aria-label="Boss HP"
                aria-valuemin={0}
                aria-valuemax={maxHp}
                aria-valuenow={Math.round(hp)}
                className="relative h-4 overflow-hidden rounded-[3px] bg-[#232325] ring-1 ring-black/60"
              >
                <div
                  aria-hidden="true"
                  className="ca-t absolute inset-0 origin-left bg-[#fde68a] transition-transform delay-300 duration-700 ease-in will-change-transform"
                  style={{ transform: `scaleX(${hpRatio})` }}
                />
                <div
                  aria-hidden="true"
                  className={`ca-t absolute inset-0 origin-left transition-transform duration-150 ease-out will-change-transform ${phaseStyle.fill}`}
                  style={{ transform: `scaleX(${hpRatio})` }}
                />
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 bg-[#ededed]/15" />
                {tracker.hitSeq > 0 && (
                  <span key={tracker.hitSeq} aria-hidden="true" className="ca-a ca-flash absolute inset-0 bg-[#ededed]" />
                )}
                {SEGMENT_DIVIDERS}
              </div>
              <div className="flex items-center gap-2 text-sm tabular-nums leading-tight">
                <span className="font-semibold">
                  {fmtNum(hp)}
                  <span className="text-[#a1a1a6]"> / {fmtNum(maxHp)}</span>
                </span>
                {shield > 0 && (
                  <span className="ca-nts rounded-md bg-[#67e8f9] px-1.5 py-0.5 text-xs font-bold tabular-nums leading-none text-[#141415]">
                    Shield {fmtNum(shield)}
                  </span>
                )}
                <span className="ml-auto text-base font-black">{hpPct}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-12 shrink-0 text-xs font-bold uppercase tracking-wide ${
                  ultReady ? "ca-a ca-beat text-[#fde047]" : "text-[#c4a3ff]"
                }`}
              >
                {ultReady ? "Ult!" : "Hype"}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#232325] ring-1 ring-black/60">
                <div
                  className={`ca-t absolute inset-0 origin-left transition-transform duration-300 ease-out will-change-transform ${
                    ultReady ? "bg-[#fde047]" : "bg-[#c084fc]"
                  }`}
                  style={{ transform: `scaleX(${hypeRatio})` }}
                />
                {ultReady && (
                  <span aria-hidden="true" className="ca-a ca-shimmer absolute inset-y-0 left-0 w-1/3 bg-[#ededed]/60" />
                )}
              </div>
            </div>
          </div>
        </div>

        {over ? (
          <div
            className={`ca-a ca-banner ca-nts flex flex-1 flex-col items-center justify-center rounded-xl ${
              phase === "victory" ? "bg-[#4ade80] text-[#141415]" : "bg-[#f87171] text-[#141415]"
            }`}
          >
            <p className="text-3xl font-black uppercase tracking-wider leading-none">
              {phase === "victory" ? "Chat wins" : "Boss survives"}
            </p>
            {top[0] && (
              <p className="mt-1 max-w-full truncate px-3 text-sm font-semibold">
                MVP {top[0].name} · {fmtNum(top[0].damage)} dmg
              </p>
            )}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[1fr_11rem] gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a1a1a6]">Top damage</p>
              <ol className="flex flex-col gap-1 text-sm" aria-label="Top damage">
                {top.length === 0 ? (
                  <li className="text-[#a1a1a6]">{lobby ? "Type in chat to join the raid" : "No damage yet"}</li>
                ) : (
                  top.map((p, i) => (
                    <li key={p.name} className="relative flex h-5 items-center gap-2 overflow-hidden rounded px-1 leading-tight">
                      <span
                        aria-hidden="true"
                        className="ca-t absolute inset-0 origin-left rounded bg-[#ededed]/[0.07] transition-transform duration-500 ease-out"
                        style={{ transform: `scaleX(${clamp01(topDamage > 0 ? p.damage / topDamage : 0)})` }}
                      />
                      <span
                        className={`relative w-4 shrink-0 font-black tabular-nums ${
                          i === 0 ? "text-[#fde047]" : "text-[#a1a1a6]"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        aria-hidden="true"
                        className="relative size-2 shrink-0 rounded-full ring-1 ring-black/60"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className={`relative min-w-0 flex-1 truncate ${i === 0 ? "font-bold" : "font-semibold"}`}>
                        {p.name}
                      </span>
                      <span className="relative shrink-0 font-bold tabular-nums">{fmtNum(p.damage)}</span>
                    </li>
                  ))
                )}
              </ol>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <div
                className={`ca-t flex items-baseline justify-between gap-2 transition-opacity duration-300 ${
                  comboLive ? "opacity-100" : "opacity-40"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#a1a1a6]">Combo</span>
                <span
                  key={comboLive ? tracker.hitSeq : "idle"}
                  className={`${comboLive ? "ca-a ca-pop" : ""} origin-right font-mono text-xl font-black tabular-nums leading-none ${
                    comboLive ? comboTone(tracker.combo) : "text-[#a1a1a6]"
                  }`}
                  aria-label={comboLive ? `${tracker.combo} hit combo` : "No combo"}
                >
                  {comboLive ? `x${tracker.combo}` : "x0"}
                </span>
              </div>
              <div aria-hidden="true" className="relative h-1 overflow-hidden rounded-full bg-[#232325]">
                {comboLive && (
                  <span
                    key={tracker.hitSeq}
                    className={`ca-a ca-drain absolute inset-0 origin-left ${comboFill(tracker.combo)}`}
                    style={{ animationDuration: `${COMBO_WINDOW_MS}ms` }}
                  />
                )}
              </div>

              <ul className="flex flex-col gap-0.5 pt-0.5 text-xs leading-4" aria-label="Recent hits">
                {feed.map((f, i) => (
                  <li
                    key={f.id}
                    className="ca-t transition-opacity duration-300"
                    style={{ opacity: FEED_OPACITY[i] ?? 0.4 }}
                  >
                    <div className="ca-a ca-in flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full ring-1 ring-black/60"
                        style={{ backgroundColor: f.color }}
                      />
                      <span className="min-w-0 flex-1 truncate font-semibold">{f.name}</span>
                      <span className="shrink-0 font-bold tabular-nums text-[#fde68a]">
                        {`\u2212${fmtNum(f.amount)}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div
          aria-hidden="true"
          className={`ca-t pointer-events-none absolute inset-0 rounded-2xl bg-[#dc2626]/[0.06] transition-opacity duration-500 ${
            enraged ? "opacity-100" : "opacity-0"
          }`}
          style={{ boxShadow: "inset 0 0 0 1px rgb(249 115 22 / 0.55), inset 0 0 40px rgb(220 38 38 / 0.3)" }}
        >
          {desperate && (
            <div
              className="ca-a ca-pulse absolute inset-0 rounded-2xl"
              style={{ boxShadow: "inset 0 0 0 2px rgb(239 68 68 / 0.85), inset 0 0 64px rgb(220 38 38 / 0.45)" }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export const CompactArena = memo(CompactArenaImpl);
