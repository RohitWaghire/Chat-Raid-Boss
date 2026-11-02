"use client";
import { VictoryBurst } from "./VictoryBurst";
import { readable } from "@/lib/color";
import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { awards, leaderboard, COMBO_WINDOW_MS } from "@/lib/game";
import type { FeedItem, GameState, Player, Pop } from "@/lib/types";
import type { ChatStatus } from "@/lib/twitchChat";
import { BossArt, type BossVariant } from "./BossArt";
import { RaidIntro } from "./RaidIntro";
import { BOSSES } from "./BossSelect";
import { UiIcon, type UiIconName } from "./UiIcon";

const variantFor = (name: string): BossVariant => (BOSSES.find((b) => b.name === name)?.id as BossVariant | undefined) ?? "default";

const KIND_STYLE: Record<string, string> = {
  hit: "text-white/90",
  crit: "text-amber-300 font-bold",
  heal: "text-emerald-300",
  revive: "text-emerald-300 font-semibold",
  shield: "text-sky-300",
  bits: "text-fuchsia-300 font-bold",
  combo: "text-orange-300 font-black",
  boss: "text-red-300 font-semibold",
  ko: "text-white/70",
  phase: "text-yellow-200 font-black",
  system: "text-violet-200",
  ult: "text-yellow-300 font-black",
  redeem: "text-cyan-300 font-bold",
};

const KIND_CHIP: Record<string, [string, string]> = {
  hit: ["Hit", "bg-white/15 text-white"],
  crit: ["Crit", "bg-amber-400 text-black"],
  heal: ["Heal", "bg-emerald-400 text-black"],
  revive: ["Revive", "bg-emerald-300 text-black"],
  shield: ["Shield", "bg-sky-400 text-black"],
  bits: ["Bits", "bg-fuchsia-400 text-black"],
  combo: ["Combo", "bg-orange-500 text-black"],
  boss: ["Boss", "bg-red-600 text-white"],
  ko: ["KO", "bg-white/10 text-white/75"],
  phase: ["Phase", "bg-yellow-300 text-black"],
  system: ["System", "bg-violet-500/70 text-white"],
  ult: ["Ultimate", "bg-yellow-300 text-black"],
  redeem: ["Points", "bg-cyan-400 text-black"],
};

/** Lines that should land with weight in the feed (tint + sheen + slam-in). */
const FEED_PUNCHY = new Set<string>(["crit", "ult", "bits", "combo", "phase", "redeem"]);
const FEED_TINT: Record<string, string> = {
  crit: "bg-amber-400/15",
  ult: "bg-yellow-300/20",
  bits: "bg-fuchsia-400/15",
  combo: "bg-orange-500/15",
  phase: "bg-yellow-300/15",
  redeem: "bg-cyan-400/15",
  boss: "bg-red-600/15",
  revive: "bg-emerald-400/10",
};
const FEED_AMOUNT: Record<string, string> = {
  crit: "text-amber-300",
  ult: "text-yellow-300",
  bits: "text-fuchsia-300",
  combo: "text-orange-300",
};
/** Older lines recede smoothly as new ones push them down (opacity transitions on index change). */
const FEED_OPACITY = [1, 0.94, 0.88, 0.83, 0.78, 0.74, 0.7, 0.66, 0.62];

const POP_STYLE: Record<Pop["kind"], string> = {
  hit: "text-white text-2xl",
  crit: "text-amber-300 text-4xl",
  combo: "text-orange-400 text-4xl",
  bits: "text-fuchsia-300 text-5xl",
  ult: "text-yellow-200 text-6xl",
  heal: "text-emerald-300 text-3xl",
};
const POP_ANIM: Record<Pop["kind"], string> = {
  hit: "crb-pop-hit 1.05s cubic-bezier(.2,.8,.3,1) forwards",
  crit: "crb-pop-crit 1.25s cubic-bezier(.2,.8,.3,1) forwards",
  combo: "crb-pop-crit 1.25s cubic-bezier(.2,.8,.3,1) forwards",
  bits: "crb-pop-crit 1.3s cubic-bezier(.2,.8,.3,1) forwards",
  ult: "crb-pop-ult 1.35s cubic-bezier(.2,.8,.3,1) forwards",
  heal: "crb-pop-heal 1.2s ease-out forwards",
};
const POP_TAG: Partial<Record<Pop["kind"], [string, string]>> = {
  crit: ["Crit", "bg-amber-400 text-black"],
  combo: ["Combo", "bg-orange-500 text-black"],
  bits: ["Bits", "bg-fuchsia-400 text-black"],
  ult: ["Ultimate", "bg-yellow-300 text-black"],
};
const SPARK: Partial<Record<Pop["kind"], string>> = {
  crit: "bg-amber-300",
  combo: "bg-orange-400",
  bits: "bg-fuchsia-300",
  ult: "bg-yellow-200",
};
/** Hard outline, no blur: cheap to raster once, stays crisp while the layer is transformed. */
const POP_SHADOW = "0 3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -1px 0 #000, -2px -1px 0 #000";

const STATUS_LABEL: Record<ChatStatus, string> = {
  idle: "idle",
  connecting: "connecting…",
  connected: "live",
  error: "connection error, retrying",
  closed: "disconnected",
};

type ThemeKey = "fight" | "enraged" | "desperate";
const THEME: Record<ThemeKey, { hex: string; text: string; fill: string; chip: string; edge: string }> = {
  fight: { hex: "#a855f7", text: "text-violet-300", fill: "from-violet-700 via-violet-500 to-fuchsia-400", chip: "bg-violet-700", edge: "from-violet-500 via-fuchsia-400 to-violet-500" },
  enraged: { hex: "#f97316", text: "text-orange-300", fill: "from-orange-700 via-orange-500 to-amber-300", chip: "bg-orange-700", edge: "from-orange-600 via-amber-300 to-orange-600" },
  desperate: { hex: "#ef4444", text: "text-red-300", fill: "from-red-800 via-red-600 to-orange-400", chip: "bg-red-700", edge: "from-red-700 via-orange-400 to-red-700" },
};

const PHASE_LABEL: Record<GameState["phase"], string> = {
  lobby: "Standby · Awaiting raiders",
  fight: "Phase I · Engaged",
  enraged: "Phase II · Enraged",
  desperate: "Phase III · Desperate",
  victory: "Encounter complete",
  defeat: "Encounter failed",
};

const BAR_CLIP = "polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)";
const BAR_TICKS: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(90deg, transparent 0, transparent calc(10% - 2px), rgba(0,0,0,0.55) calc(10% - 2px), rgba(0,0,0,0.55) 10%)",
};
const HYPE_TICKS: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(90deg, transparent 0, transparent calc(10% - 2px), rgba(0,0,0,0.7) calc(10% - 2px), rgba(0,0,0,0.7) 10%)",
};
const KO_STRIPES: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, rgba(239,68,68,0.14) 0 6px, transparent 6px 12px)",
};
const BANNER_TEXTURE: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(115deg, rgba(0,0,0,0.14) 0 14px, transparent 14px 28px)",
};
const TEXT_SHADOW = "[text-shadow:0_2px_0_rgba(0,0,0,0.75)]";

const MEDALS = ["1", "2", "3", "4", "5"];
const RANK_PLATE = [
  "bg-gradient-to-b from-amber-200 to-amber-500 text-black",
  "bg-gradient-to-b from-slate-100 to-slate-400 text-black",
  "bg-gradient-to-b from-orange-300 to-orange-700 text-black",
  "bg-white/10 text-white/85",
  "bg-white/10 text-white/85",
];

const COMMANDS: [string, string][] = [
  ["!atk", "hit (subs crit more)"],
  ["!heal", "revive a KO'd raider"],
  ["!shield", "block the boss strike"],
  ["!ult", "when Hype hits 100%"],
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Feed = memo(function Feed({ feed }: { feed: FeedItem[] }) {
  return (
    <ul
      className="flex h-48 flex-col gap-1 overflow-hidden text-[15px] leading-snug [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      aria-label="Raid log"
    >
      {feed.length === 0 && <li className="text-white/70">Waiting for the raid to start…</li>}
      {feed.slice(0, 9).map((f, i) => {
        const [label, chip] = KIND_CHIP[f.kind] ?? ["Log", "bg-white/10 text-white/80"];
        const punchy = FEED_PUNCHY.has(f.kind);
        const tint = FEED_TINT[f.kind];
        const amountTone = FEED_AMOUNT[f.kind];
        const big = f.kind === "ult" || f.kind === "phase";
        return (
          <li
            key={f.id}
            className="relative shrink-0 transition-opacity duration-500 ease-out"
            style={{ opacity: FEED_OPACITY[i] ?? 0.6 }}
          >
            <div
              className="relative flex items-center gap-2 overflow-hidden rounded-sm py-0.5 pr-2"
              style={{
                animation: punchy
                  ? "crb-feed-punch 0.42s cubic-bezier(.2,.9,.3,1.2) both"
                  : "crb-feed-in 0.28s ease-out both",
              }}
            >
              {tint && (
                <span
                  aria-hidden
                  className={`absolute inset-0 origin-left ${tint}`}
                  style={{ animation: "crb-feed-tint 1.6s ease-out forwards" }}
                />
              )}
              {punchy && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0"
                  style={{ animation: "crb-feed-sheen 0.75s ease-out 0.08s forwards" }}
                />
              )}
              <span
                className={`relative w-14 shrink-0 -skew-x-12 rounded-sm py-0.5 text-center text-[10px] font-black tracking-wider ${chip}`}
              >
                <span className="inline-block skew-x-12">{label}</span>
              </span>
              <span className={`relative min-w-0 truncate ${big ? "text-base" : ""} ${TEXT_SHADOW} ${KIND_STYLE[f.kind]}`}>
                {f.text}
              </span>
              {amountTone && typeof f.amount === "number" && f.amount > 0 && (
                <span
                  aria-hidden
                  className={`relative ml-auto shrink-0 font-mono text-base font-black italic tabular-nums ${amountTone} ${TEXT_SHADOW}`}
                >
                  {f.amount.toLocaleString()}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
});

function LeaderRow({
  p,
  rank,
  share,
  ko,
  koLeft,
  barClass,
}: {
  p: Player;
  rank: number;
  share: number;
  ko: boolean;
  koLeft: number;
  barClass: string;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const lastTop = useRef<number | null>(null);
  const [prevRank, setPrevRank] = useState(rank);
  const [shift, setShift] = useState({ dir: 0, n: 0 });
  if (prevRank !== rank) {
    setPrevRank(rank);
    setShift({ dir: rank < prevRank ? 1 : -1, n: shift.n + 1 });
  }

  // FLIP: glide the row from its old slot to its new one (transform only).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.offsetTop;
    const before = lastTop.current;
    lastTop.current = top;
    if (before === null || before === top || prefersReducedMotion()) return;
    el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
      duration: 420,
      easing: "cubic-bezier(.2,.8,.2,1)",
    });
  }, [rank]);

  const leader = rank === 0;
  const shareLabel = share >= 10 ? `${Math.round(share)}%` : `${share.toFixed(1)}%`;

  return (
    <li
      ref={ref}
      className={`relative overflow-hidden rounded-lg ring-1 ${
        ko ? "bg-red-950/60 ring-red-500/40" : leader ? "bg-amber-300/[0.08] ring-amber-300/50" : "bg-white/[0.06] ring-white/10"
      }`}
      style={{ animation: "crb-row-in 0.35s ease-out both" }}
    >
      {ko && <span aria-hidden className="pointer-events-none absolute inset-0" style={KO_STRIPES} />}
      {shift.n > 0 && (
        <span
          key={`flash-${shift.n}`}
          aria-hidden
          className={`pointer-events-none absolute inset-0 opacity-0 ${shift.dir > 0 ? (leader ? "bg-amber-300/30" : "bg-emerald-400/25") : "bg-red-500/20"}`}
          style={{ animation: "crb-row-flash 0.9s ease-out forwards" }}
        />
      )}
      <div className="relative flex items-center gap-2.5 py-1.5 pl-1.5 pr-3">
        <span
          key={`plate-${rank}`}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm font-black ${RANK_PLATE[rank]}`}
          style={shift.n > 0 ? { animation: "crb-plate-pop 0.45s cubic-bezier(.2,.9,.3,1.4)" } : undefined}
        >
          {MEDALS[rank]}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <b className="truncate text-[15px]" style={{ color: readable(p.color) }}>
            {p.name}
          </b>
          {ko && (
            <span className="shrink-0" title="Knocked out">
              <UiIcon name="warning" className="size-3" />
            </span>
          )}
          {ko && (
            <span className="shrink-0 rounded-sm bg-red-500/25 px-1 font-mono text-[10px] font-black tabular-nums text-red-200 ring-1 ring-red-400/40">
              KO {koLeft}s
            </span>
          )}
          {shift.n > 0 && shift.dir !== 0 && (
            <span
              key={`arrow-${shift.n}`}
              aria-hidden
              className={`shrink-0 text-[11px] font-black opacity-0 ${shift.dir > 0 ? "text-emerald-300" : "text-red-300"}`}
              style={{ animation: "crb-rank-flag 1.6s ease-out forwards" }}
            >
              {shift.dir > 0 ? "▲" : "▼"}
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end leading-none">
          <span className={`font-mono text-sm font-bold tabular-nums ${ko ? "text-white/75" : "text-white/90"}`}>
            {p.damage.toLocaleString()}
          </span>
          <span className={`mt-0.5 font-mono text-[10px] font-bold tabular-nums ${leader && !ko ? "text-amber-200" : "text-white/70"}`}>
            {shareLabel}
          </span>
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden bg-white/5">
        <div
          className={`absolute inset-0 origin-left transition-transform duration-500 ease-out ${ko ? "bg-white/30" : barClass}`}
          style={{ transform: `scaleX(${Math.min(1, share / 100)})` }}
        />
        {leader && !ko && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[hud-sheen_3.2s_ease-in-out_infinite]"
          />
        )}
      </div>
    </li>
  );
}

export function Arena({
  state,
  status,
  narrator,
  channel,
  now,
  transparent,
}: {
  state: GameState;
  status: ChatStatus;
  narrator: string;
  channel: string;
  now: number;
  transparent?: boolean;
}) {
  const pct = Math.max(0, (state.hp / state.maxHp) * 100);
  const timeLeft = state.phase === "lobby" ? state.config.durationSec : Math.max(0, Math.ceil((state.endsAt - (state.endedAt || now)) / 1000));
  const top = leaderboard(state, 5);
  const players = Object.values(state.players);
  const knocked = players.filter((p) => p.koUntil > now).length;
  const totalDamage = players.reduce((n, p) => n + p.damage, 0);
  const over = state.phase === "victory" || state.phase === "defeat";
  const themeKey: ThemeKey = state.phase === "desperate" ? "desperate" : state.phase === "enraged" ? "enraged" : "fight";
  const t = THEME[themeKey];
  const urgent = state.phase !== "lobby" && !over && timeLeft <= 20;
  const hypeFull = state.hype >= 100;
  const clock = state.phase === "lobby" ? "ready" : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;

  let ultPop: Pop | undefined;
  for (let i = state.pops.length - 1; i >= 0; i--) {
    if (state.pops[i].kind === "ult") {
      ultPop = state.pops[i];
      break;
    }
  }
  const ultIsSmite = ultPop ? state.feed.find((f) => f.kind === "ult" || f.kind === "redeem")?.kind === "redeem" : false;

  const combo = state.combo && state.combo.count >= 2 ? state.combo : null;
  const comboMilestone = !!combo && combo.count % 3 === 0;
  const comboLeft = combo ? Math.max(0, Math.min(1, (combo.until - now) / COMBO_WINDOW_MS)) : 0;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl p-4 text-white sm:p-6 ${transparent ? "" : "bg-[#141415] ring-1 ring-white/10"} ${state.phase === "desperate" ? "shadow-[inset_0_0_90px_rgba(255,0,0,0.38)]" : ""}`}
      data-testid="arena"
      data-phase={state.phase}
    >
      <RaidIntro bossName={state.config.bossName} maxHp={state.maxHp} startedAt={state.phase === "lobby" ? 0 : state.startedAt} />
      <div
        key={`edge-${themeKey}`}
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.edge}`}
        style={{ animation: "crb-edge-in 0.6s cubic-bezier(.2,.8,.2,1)" }}
      />

      {state.phase === "desperate" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_140px_rgba(255,0,0,0.32)]"
          style={{ animation: "crb-danger-pulse 1.2s ease-in-out infinite" }}
        />
      )}

      {state.bossStrikeKey > 0 && (
        <div
          key={`strike-${state.bossStrikeKey}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[3] rounded-3xl opacity-0 shadow-[inset_0_0_120px_rgba(239,68,68,0.6)]"
          style={{ animation: "crb-strike 0.65s ease-out forwards" }}
        />
      )}

      <header className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="flex items-center gap-2 rounded-md bg-black/65 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 ring-1 ring-white/10"
          data-testid="status"
        >
          <span className={`h-2 w-2 rounded-full ${status === "connected" ? "animate-pulse bg-emerald-400" : status === "error" ? "bg-red-500" : "bg-yellow-400"}`} />
          {channel ? `#${channel}` : "demo chat"} · {STATUS_LABEL[status]}
        </span>
        <span className="hidden text-[11px] font-black uppercase tracking-[0.4em] text-white/55 lg:block">World Boss · Chat Raid</span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em]">
          <span className="rounded-md bg-black/65 px-2.5 py-1 ring-1 ring-white/10">
            <b className="font-mono text-sm tabular-nums text-white">{players.length}</b> <span className="text-white/70">raiders</span>
          </span>
          <span className={`rounded-md px-2.5 py-1 ring-1 ${knocked > 0 ? "bg-red-950/80 ring-red-500/40" : "bg-black/65 ring-white/10"}`}>
            <b className={`font-mono text-sm tabular-nums ${knocked > 0 ? "text-red-300" : "text-white"}`}>{knocked}</b>{" "}
            <span className="text-white/70">KO&apos;d</span>
          </span>
        </span>
      </header>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative h-28 w-28 shrink-0 sm:h-40 sm:w-40">
              <div aria-hidden className="absolute -inset-3 rounded-full" style={{ background: `radial-gradient(circle, ${t.hex}66 0%, transparent 68%)` }} />
              <div aria-hidden className="absolute inset-0 rounded-full border-2 border-dashed opacity-50 animate-[hud-spin_20s_linear_infinite]" style={{ borderColor: t.hex }} />
              <div aria-hidden className="absolute inset-3 rotate-45 rounded-xl border-2 bg-black/55" style={{ borderColor: `${t.hex}cc` }} />
              <div aria-hidden className="absolute inset-5 rotate-45 rounded-lg border border-white/15" />
              {state.shakeKey > 0 && (
                <span
                  key={`ring-${state.shakeKey}`}
                  aria-hidden
                  className="pointer-events-none absolute inset-2 rounded-full border-4 opacity-0"
                  style={{ borderColor: t.hex, animation: "crb-impact-ring 0.45s ease-out forwards" }}
                />
              )}
              <div key={state.shakeKey} className="absolute inset-2 animate-[shake_0.35s_ease-in-out]">
                <BossArt phase={state.phase} hit={state.shakeKey} variant={variantFor(state.config.bossName)} />
              </div>
              {/* Pops live outside the keyed shake wrapper so a new hit doesn't restart in-flight numbers. */}
              <div className="pointer-events-none absolute inset-2 z-[2]" aria-hidden>
                {state.pops.map((p) => {
                  const tag = POP_TAG[p.kind];
                  return (
                    <span
                      key={p.id}
                      className={`absolute top-1/3 flex flex-col items-center whitespace-nowrap font-black italic leading-none tabular-nums ${POP_STYLE[p.kind]}`}
                      style={
                        {
                          left: `${p.x}%`,
                          textShadow: POP_SHADOW,
                          animation: POP_ANIM[p.kind],
                          "--dx": `${Math.round((p.x - 50) * 0.5)}px`,
                        } as CSSProperties
                      }
                    >
                      {tag && (
                        <span className={`mb-1 -skew-x-12 rounded-sm px-1.5 py-0.5 text-[11px] not-italic tracking-[0.25em] [text-shadow:none] ${tag[1]}`}>
                          {tag[0]}
                        </span>
                      )}
                      {p.kind === "heal" ? "" : `-${p.amount}`}
                    </span>
                  );
                })}
                {state.pops
                  .slice(-2)
                  .filter((p) => p.kind !== "hit" && p.kind !== "heal")
                  .flatMap((p) => {
                    const n = p.kind === "ult" ? 12 : 8;
                    return Array.from({ length: n }, (_, i) => (
                      <span
                        key={`${p.id}-${i}`}
                        className={`absolute left-1/2 top-1/2 h-1 w-6 origin-left rounded-full ${SPARK[p.kind] ?? "bg-yellow-300"}`}
                        style={
                          {
                            "--a": `${(360 / n) * i + Math.round(p.x * 3)}deg`,
                            "--d": `${p.kind === "ult" ? 120 : 76}px`,
                            animation: "crb-spark 0.6s cubic-bezier(.1,.8,.3,1) forwards",
                          } as CSSProperties
                        }
                      />
                    ));
                  })}
              </div>
              <span
                aria-hidden
                className={`absolute -bottom-1 left-1/2 z-[3] -translate-x-1/2 -skew-x-12 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-white ${t.chip}`}
              >
                Boss
              </span>
            </div>

            <div className="@container min-w-0 flex-1">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] sm:text-[11px] ${t.text}`}>
                    <span aria-hidden className={`h-1.5 w-6 -skew-x-[20deg] ${t.chip}`} />
                    <span className="truncate">{PHASE_LABEL[state.phase]}</span>
                  </div>
                  <h2
                    className={`mt-1 line-clamp-2 break-words pr-1 text-[clamp(1.25rem,7.5cqw,3rem)] font-black uppercase italic leading-none tracking-tight text-white ${TEXT_SHADOW}`}
                    data-testid="boss-name"
                  >
                    {state.config.bossName}
                  </h2>
                </div>
                <span
                  className={`shrink-0 -skew-x-12 rounded-md px-3 py-1 font-mono text-lg font-black uppercase tabular-nums ring-1 sm:text-2xl ${
                    urgent ? "animate-pulse bg-red-950/90 text-red-400 ring-red-500/60" : "bg-black/70 text-white ring-white/15"
                  }`}
                  aria-label="Time left"
                >
                  <span className="inline-block skew-x-12">{clock}</span>
                </span>
              </div>

              <div className="mt-3 bg-white/25 p-0.5" style={{ clipPath: BAR_CLIP }}>
                <div
                  className="relative h-9 w-full overflow-hidden bg-[#232325] sm:h-11"
                  style={{ clipPath: BAR_CLIP }}
                  role="progressbar"
                  aria-label="Boss health"
                  aria-valuemin={0}
                  aria-valuemax={state.maxHp}
                  aria-valuenow={Math.ceil(state.hp)}
                >
                  <div
                    className="absolute inset-0 origin-left bg-white/75 transition-transform delay-300 duration-700 ease-out"
                    style={{ transform: `scaleX(${pct / 100})` }}
                  />
                  <div
                    className={`absolute inset-0 origin-left overflow-hidden bg-gradient-to-r ${t.fill} transition-transform duration-150`}
                    style={{ transform: `scaleX(${pct / 100})` }}
                  >
                    <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[hud-sheen_2.8s_ease-in-out_infinite]" />
                  </div>
                  {state.shakeKey > 0 && pct > 0 && (
                    <span
                      key={`nick-${state.shakeKey}`}
                      aria-hidden
                      className="absolute inset-y-0 w-3 bg-white opacity-0"
                      style={{ left: `calc(${pct}% - 6px)`, animation: "crb-hp-nick 0.35s ease-out forwards" }}
                    />
                  )}
                  <div aria-hidden className="absolute inset-0" style={BAR_TICKS} />
                  <div aria-hidden className={`absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 ${pct > 50 ? "bg-orange-300" : "bg-white/25"}`} />
                  <div aria-hidden className={`absolute inset-y-0 left-[20%] w-1 -translate-x-1/2 ${pct > 20 ? "bg-red-400" : "bg-white/25"}`} />
                  <div className={`absolute inset-0 flex items-center justify-between gap-2 px-5 font-mono text-xs font-black tabular-nums text-white sm:text-sm ${TEXT_SHADOW}`}>
                    <span className="truncate">
                      {Math.ceil(state.hp).toLocaleString()} / {state.maxHp.toLocaleString()} HP
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {state.shield > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-sky-500/90 px-1.5 text-[11px] text-black [text-shadow:none]"><UiIcon name="shield" className="size-3" /> {state.shield}</span>
                      )}
                      <span>{Math.ceil(pct)}%</span>
                    </span>
                  </div>
                </div>
              </div>
              <div aria-hidden className="relative h-4 text-[9px] font-black uppercase tracking-[0.15em] sm:text-[10px]">
                <span className={`absolute left-1/2 top-0.5 -translate-x-1/2 whitespace-nowrap ${pct > 50 ? "text-orange-300" : "text-white/35"}`}>▲ Enrage</span>
                <span className={`absolute left-[20%] top-0.5 -translate-x-1/2 whitespace-nowrap ${pct > 20 ? "text-red-400" : "text-white/35"}`}>▲ Desperate</span>
              </div>

              <div className="mt-1 flex items-center gap-3">
                <span className={`w-12 text-[11px] font-black uppercase tracking-[0.25em] text-yellow-200 ${TEXT_SHADOW}`}>Hype</span>
                <div
                  className={`relative h-3.5 flex-1 overflow-hidden rounded-sm bg-black/70 ring-1 ${hypeFull ? "ring-yellow-300/80" : "ring-white/20"}`}
                  role="progressbar"
                  aria-label="Hype meter"
                  aria-valuenow={state.hype}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="absolute inset-0 origin-left bg-gradient-to-r from-yellow-300 via-amber-400 to-pink-500 transition-transform duration-200"
                    style={{ transform: `scaleX(${Math.min(100, Math.max(0, state.hype)) / 100})` }}
                  />
                  {hypeFull && (
                    <>
                      <span aria-hidden className="absolute inset-0 bg-yellow-100/40" style={{ animation: "crb-hype-glow 0.8s ease-in-out infinite" }} />
                      <span aria-hidden className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-[hud-sheen_1.4s_ease-in-out_infinite]" />
                    </>
                  )}
                  <div aria-hidden className="absolute inset-0" style={HYPE_TICKS} />
                </div>
                <span
                  className={`inline-block min-w-20 origin-right text-right text-xs font-black sm:text-sm ${TEXT_SHADOW} ${hypeFull ? "text-yellow-200" : "font-mono tabular-nums text-white/80"}`}
                  style={hypeFull ? { animation: "crb-ready 0.9s ease-in-out infinite" } : undefined}
                >
                  {hypeFull ? "Type !ult" : `${Math.floor(state.hype)}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex min-h-14 items-stretch overflow-hidden rounded-xl bg-black/70 ring-1 ring-white/10">
            <div aria-hidden className={`flex shrink-0 items-center gap-1.5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white ${t.chip}`}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Boss
            </div>
            <p className={`flex flex-1 items-center px-4 py-2.5 text-base italic leading-snug text-white sm:text-lg ${TEXT_SHADOW}`} aria-live="polite" data-testid="narrator">
              {narrator || state.bossLine}
            </p>
          </div>

          <div className="mt-3 flex h-10 items-center gap-3">
            {combo && (
              <div
                key={combo.count}
                className="relative"
                style={{
                  animation: comboMilestone ? "crb-combo-slam 0.42s cubic-bezier(.2,.9,.3,1.3)" : "crb-combo-in 0.22s ease-out",
                }}
              >
                {comboMilestone && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -skew-x-12 ring-4 ring-orange-300 opacity-0"
                    style={{ animation: "crb-combo-ring 0.6s ease-out forwards" }}
                  />
                )}
                <div className="relative inline-flex -skew-x-12 items-center gap-2 overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-1 text-xl font-black text-black ring-2 ring-orange-300/60">
                  <span className="inline-flex skew-x-12 items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.25em]">Combo</span>
                    {combo.emote} ×{combo.count}
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-1 origin-left bg-black/45 transition-transform duration-200 ease-linear"
                    style={{ transform: `scaleX(${comboLeft})` }}
                  />
                </div>
              </div>
            )}
            {combo && (
              <span aria-hidden className={`text-[11px] font-black uppercase tracking-[0.2em] text-orange-200 ${TEXT_SHADOW}`}>
                {comboMilestone ? "Combo" : `${3 - (combo.count % 3)} more → burst`}
              </span>
            )}
          </div>

          <Feed feed={state.feed} />
        </div>

        <aside className="flex flex-col gap-5 rounded-2xl bg-black/60 p-4 ring-1 ring-white/10">
          <section>
            <h3 className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.25em] text-white/80">
              <span>Top damage</span>
              <span className="text-white/70">share</span>
            </h3>
            <ol className="mt-3 flex flex-col gap-2" data-testid="leaderboard">
              {top.length === 0 && <li className="text-sm text-white/70">No raiders yet · type !atk</li>}
              {top.map((p, i) => {
                const share = totalDamage > 0 ? (p.damage / totalDamage) * 100 : 0;
                const ko = p.koUntil > now;
                return (
                  <LeaderRow
                    key={p.name}
                    p={p}
                    rank={i}
                    share={share}
                    ko={ko}
                    koLeft={Math.max(0, Math.ceil((p.koUntil - now) / 1000))}
                    barClass={i === 0 ? "bg-amber-300" : t.chip}
                  />
                );
              })}
            </ol>
          </section>
          <section>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">Chat commands</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-white/80">
              {COMMANDS.map(([cmd, desc]) => (
                <li key={cmd} className="flex items-center gap-2">
                  <code className="w-16 shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-center font-mono text-[12px] font-bold text-violet-200 ring-1 ring-violet-400/30">
                    {cmd}
                  </code>
                  <span className="truncate">{desc}</span>
                </li>
              ))}
              <li className="pt-1 text-white/60">Same emote ×3 → combo · Bits → 2 dmg/bit</li>
            </ul>
          </section>
        </aside>
      </div>

      {ultPop && (
        <div key={`ult-${ultPop.id}`} className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 opacity-0"
            style={{
              background: "radial-gradient(ellipse at 22% 30%, rgba(253,224,71,0.5), rgba(253,224,71,0.1) 40%, transparent 70%)",
              animation: "crb-ult-flash 0.9s ease-out forwards",
            }}
          />
          <div className="absolute inset-x-0 top-[28%] -skew-y-3">
            <div
              className="flex items-center justify-center gap-4 bg-yellow-300 py-2 text-black opacity-0"
              style={{ animation: "crb-ult-stripe 1.1s cubic-bezier(.2,.8,.2,1) forwards" }}
            >
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">{ultIsSmite ? "Redeem" : "Raid"}</span>
              <span className="text-3xl font-black uppercase italic tracking-wider sm:text-5xl">{ultIsSmite ? "Smite" : "Ultimate"}</span>
              <span className="font-mono text-xl font-black tabular-nums sm:text-3xl">-{ultPop.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Phase transition banner */}
      {(state.phase === "enraged" || state.phase === "desperate") && (
        <div key={state.phase} className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
          <div
            className="absolute inset-0 opacity-0"
            style={{ background: `radial-gradient(ellipse at 50% 40%, ${t.hex}59, transparent 70%)`, animation: "crb-banner-flash 0.7s ease-out forwards" }}
          />
          <div className="absolute inset-x-0 top-1/3 -skew-y-2">
            <span
              className="absolute inset-x-0 -top-2 h-1 origin-left bg-white/80"
              style={{ animation: "crb-banner-bar 1.8s cubic-bezier(.2,.8,.2,1) forwards" }}
            />
            <span
              className="absolute inset-x-0 -bottom-2 h-1 origin-right bg-white/80"
              style={{ animation: "crb-banner-bar 1.8s cubic-bezier(.2,.8,.2,1) forwards" }}
            />
            <div
              className={`relative overflow-hidden py-3 text-center text-white opacity-0 sm:py-4 ${state.phase === "desperate" ? "bg-red-800" : "bg-orange-800"}`}
              style={{ animation: "crb-banner-band 1.8s cubic-bezier(.2,.8,.2,1) forwards" }}
            >
              <span className="absolute inset-0" style={BANNER_TEXTURE} />
              <span
                className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0"
                style={{ animation: "crb-banner-sheen 1.8s ease-out forwards" }}
              />
              <div className="relative text-[11px] font-black uppercase tracking-[0.5em] text-white" style={{ animation: "crb-banner-kicker 1.8s ease-out both" }}>
                {state.phase === "desperate" ? "Phase III" : "Phase II"}
              </div>
              <div
                className="relative text-4xl font-black uppercase italic tracking-widest [text-shadow:0_4px_0_rgba(0,0,0,0.45)] sm:text-6xl"
                style={{ animation: "crb-banner-title 1.8s cubic-bezier(.2,.9,.3,1) both" }}
              >
                {state.phase === "desperate" ? "Desperate" : "Enraged"}
              </div>
              <div
                className="relative mt-1 text-xs font-bold uppercase tracking-[0.3em] text-white sm:text-sm"
                style={{ animation: "crb-banner-kicker 1.8s ease-out both" }}
              >
                {state.phase === "desperate" ? "Finish it, chat" : "Hold the line, chat"}
              </div>
            </div>
          </div>
        </div>
      )}

      {over && <EndScreen state={state} />}
      {over && <VictoryBurst key={state.endedAt} win={state.phase === "victory"} bossName={state.config.bossName} />}
    </div>
  );
}

const AWARD_TONE = {
  mvp: {
    ring: "ring-amber-300/70",
    medal: "bg-gradient-to-b from-amber-200 to-amber-500",
    tag: "text-amber-200",
    band: "bg-amber-300 text-black",
    glow: "rgba(252,211,77,0.24)",
  },
  medic: {
    ring: "ring-emerald-300/60",
    medal: "bg-gradient-to-b from-emerald-200 to-emerald-500",
    tag: "text-emerald-200",
    band: "bg-emerald-300 text-black",
    glow: "rgba(110,231,183,0.18)",
  },
  tank: {
    ring: "ring-sky-300/60",
    medal: "bg-gradient-to-b from-sky-200 to-sky-500",
    tag: "text-sky-200",
    band: "bg-sky-300 text-black",
    glow: "rgba(125,211,252,0.18)",
  },
} as const;

type AwardKey = keyof typeof AWARD_TONE;

/** Near-opaque panels so text stays legible over any gameplay behind a transparent overlay. */
const END_PANEL = "rounded-2xl bg-[#19191b] ring-1 ring-white/10";
const END_EASE = "cubic-bezier(.2,.8,.2,1)";
const END_SPRING = "cubic-bezier(.2,.9,.3,1.3)";
const END_CONFETTI = ["#9146FF", "#FFD24A", "#4AFFB4", "#FF4A4A", "#4AC8FF"];
const END_WIN_SHADOW = "0 4px 0 #92400e, 0 8px 0 rgba(0,0,0,0.65)";
const END_LOSS_SHADOW = "0 4px 0 #450a0a, 0 8px 0 rgba(0,0,0,0.6)";
const END_TAUNTS = [
  "Is that all chat has? I've survived worse lag spikes.",
  "Come back with more raiders. And more bits.",
  "Tell your streamer I said hi. From mostly full health.",
  "GG? More like G-G-go home.",
  "I'll be right here. Practicing my victory roar.",
];
const END_CLOSE_TAUNT = "Okay, that was close. Too close. Run it back if you dare.";

/** Single shorthand (no longhand mixing) so React never warns about conflicting style keys. */
const endIn = (name: string, dur: number, delay: number, ease: string = END_EASE): CSSProperties => ({
  animation: `${name} ${dur}s ${ease} ${delay}s both`,
});
const endClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const endShare = (share: number) => (share >= 10 ? `${Math.round(share)}%` : `${share.toFixed(1)}%`);

function EndStat({ label, value, tone, delay }: { label: string; value: string; tone: string; delay: number }) {
  return (
    <div className={`${END_PANEL} px-4 py-2.5 text-left`} style={endIn("crb-end-rise", 0.45, delay)}>
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/75">{label}</div>
      <div className={`mt-0.5 truncate font-mono text-2xl font-black tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function EndAward({
  kind,
  icon,
  label,
  sub,
  player,
  stat,
  delay,
  raised,
}: {
  kind: AwardKey;
  icon: UiIconName;
  label: string;
  sub: string;
  player: Player | null;
  stat: string;
  delay: number;
  raised: boolean;
}) {
  const tone = AWARD_TONE[kind];
  return (
    <article
      className={`relative overflow-hidden px-4 pb-4 pt-3 text-center ring-2 ${END_PANEL} ${tone.ring} ${raised ? "sm:-translate-y-2" : "sm:translate-y-2"}`}
      style={endIn("crb-end-card", 0.65, delay, END_SPRING)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${tone.glow}, transparent 72%)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={endIn("crb-end-sheen", 0.9, delay + 0.35, "ease-out")}
      />
      <div className="relative flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${tone.tag}`}>{sub}</span>
        <span className="font-mono text-[11px] font-black text-white/70">#1</span>
      </div>
      <div
        className={`relative mx-auto mt-3 grid h-12 w-12 rotate-45 place-items-center rounded-xl ring-2 ring-white/50 ${tone.medal}`}
        style={endIn("crb-end-medal", 0.5, delay + 0.2, END_SPRING)}
      >
        <span className="-rotate-45 text-2xl" aria-hidden>
          <UiIcon name={icon} className="size-5" />
        </span>
      </div>
      <div className="relative mt-3 flex justify-center">
        <span className={`-skew-x-12 rounded-sm px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.3em] ${tone.band}`}>
          <span className="inline-block skew-x-12">{label}</span>
        </span>
      </div>
      <div className={`relative mt-2 truncate text-2xl font-black ${TEXT_SHADOW}`} style={{ color: player ? readable(player.color) : "#d4d4d8" }}>
        {player?.name ?? "Unclaimed"}
      </div>
      <div className="relative mt-0.5 font-mono text-sm font-bold text-white/80">{player ? stat : "nobody stepped up"}</div>
    </article>
  );
}

function EndStandings({ standings, total, win, delay }: { standings: Player[]; total: number; win: boolean; delay: number }) {
  return (
    <section className={`${END_PANEL} p-4 text-left`} style={endIn("crb-end-rise", 0.5, delay)} aria-label={win ? "Final standings" : "Honor roll"}>
      <h3 className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.25em] text-white/85">
        <span>{win ? "Final standings" : "Honor roll"}</span>
        <span className="text-white/70">dmg · share</span>
      </h3>
      <ol className="mt-3 flex flex-col gap-1.5">
        {standings.length === 0 && <li className="text-sm text-white/75">No raiders joined this one.</li>}
        {standings.map((p, i) => {
          const share = total > 0 ? (p.damage / total) * 100 : 0;
          const leader = i === 0;
          return (
            <li
              key={p.name}
              className={`relative overflow-hidden rounded-lg ring-1 ${leader ? "bg-amber-300/10 ring-amber-300/50" : "bg-white/[0.06] ring-white/10"}`}
              style={endIn("crb-end-row", 0.4, delay + 0.15 + i * 0.08)}
            >
              <div className="relative flex items-center gap-2.5 py-1 pl-1 pr-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-sm font-black ${RANK_PLATE[i]}`}>{MEDALS[i]}</span>
                <b className="min-w-0 flex-1 truncate text-[15px]" style={{ color: readable(p.color) }}>
                  {p.name}
                </b>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-white">{p.damage.toLocaleString()}</span>
                <span className={`w-11 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums ${leader ? "text-amber-200" : "text-white/75"}`}>
                  {endShare(share)}
                </span>
              </div>
              <div className="relative h-1 overflow-hidden bg-white/5">
                <div
                  className={`absolute inset-0 origin-left ${leader ? "bg-amber-300" : win ? "bg-violet-500" : "bg-red-500"}`}
                  style={{ transform: `scaleX(${Math.min(1, share / 100)})`, ...endIn("crb-end-bar", 0.7, delay + 0.3 + i * 0.08) }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EndCallToAction({ win, raiders, delay }: { win: boolean; raiders: number; delay: number }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.5)] ring-2 ${win ? "bg-violet-700 ring-violet-300/60" : "bg-red-700 ring-red-300/60"}`}
      style={endIn("crb-end-cta", 0.6, delay, END_SPRING)}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0" style={BANNER_TEXTURE} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[hud-sheen_4s_ease-in-out_infinite]"
      />
      <div className="relative flex flex-col items-center justify-between gap-3 px-5 py-3 sm:flex-row">
        <div className="flex min-w-0 flex-col items-center gap-x-4 gap-y-1 text-center sm:flex-row sm:text-left">
          <span className="shrink-0 text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl" style={{ textShadow: "0 3px 0 rgba(0,0,0,0.45)" }}>
            {win ? "GG, chat" : "Run it back?"}
          </span>
          <span className="text-pretty text-sm font-semibold leading-snug text-white">
            {win
              ? `${raiders.toLocaleString()} ${raiders === 1 ? "raider" : "raiders"} cleared it together. Drop a GG in chat.`
              : "Start another fight, then send !atk as soon as it begins."}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-black/75 px-3 py-2 font-mono text-sm text-white ring-1 ring-white/20" aria-hidden>
          <span className="text-white/75">{"chat ›"}</span>
          <b className="font-black text-yellow-200">{win ? "GG GG GG" : "Run it back"}</b>
          <span className="h-4 w-0.5 bg-white" style={{ animation: "crb-end-caret 1s steps(1) infinite" }} />
        </div>
      </div>
    </div>
  );
}

function EndScreen({ state }: { state: GameState }) {
  const win = state.phase === "victory";
  const a = awards(state);
  const secs = Math.max(0, Math.round(((state.endedAt || state.endsAt) - state.startedAt) / 1000));
  const players = Object.values(state.players);
  const total = players.reduce((n, p) => n + p.damage, 0);
  const standings = leaderboard(state, 5);
  const bossName = state.config.bossName;
  const hpLeft = Math.ceil(Math.max(0, state.hp));
  const hpFrac = state.maxHp > 0 ? Math.min(1, hpLeft / state.maxHp) : 0;
  const hpPctLabel = hpFrac * 100 < 10 ? `${(hpFrac * 100).toFixed(1)}%` : `${Math.round(hpFrac * 100)}%`;
  const closeCall = !win && hpFrac <= 0.15;
  const taunt = closeCall ? END_CLOSE_TAUNT : END_TAUNTS[(players.length + state.totalMessages) % END_TAUNTS.length];

  // Podium order: MVP sits in the middle, raised, and lands last for the payoff.
  const cards: { kind: AwardKey; icon: UiIconName; label: string; sub: string; player: Player | null; stat: string; delay: number }[] = [
    { kind: "medic", icon: "drop", label: "Medic", sub: "Most heals", player: a.medic, stat: a.medic ? `${a.medic.heals} heal${a.medic.heals === 1 ? "" : "s"}` : "", delay: 0.75 },
    { kind: "mvp", icon: "swords", label: "MVP", sub: "Top damage", player: a.mvp, stat: a.mvp ? `${a.mvp.damage.toLocaleString()} dmg` : "", delay: 1.1 },
    { kind: "tank", icon: "shield", label: "Tank", sub: "Most shields", player: a.tank, stat: a.tank ? `${a.tank.shields} shield${a.tank.shields === 1 ? "" : "s"}` : "", delay: 0.9 },
  ];

  const stats: [string, string, string][] = win
    ? [
        ["Clear time", endClock(secs), "text-amber-200"],
        ["Raiders", players.length.toLocaleString(), "text-white"],
        ["Total damage", total.toLocaleString(), "text-white"],
        ["Chat messages", state.totalMessages.toLocaleString(), "text-violet-200"],
      ]
    : [
        ["Boss HP left", hpLeft.toLocaleString(), "text-red-300"],
        ["Damage dealt", total.toLocaleString(), "text-white"],
        ["Raiders", players.length.toLocaleString(), "text-white"],
        ["Held out", endClock(secs), "text-white"],
      ];

  return (
    <div
      className="crb-end-root absolute inset-0 z-10 overflow-hidden bg-[#141415]/[0.93]"
      data-testid="end-screen"
      role="status"
      style={endIn("crb-end-veil", 0.35, 0, "ease-out")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: win
            ? "radial-gradient(ellipse at 50% 18%, rgba(250,204,21,0.22), rgba(145,70,255,0.1) 45%, transparent 72%)"
            : "radial-gradient(ellipse at 50% 18%, rgba(220,38,38,0.3), rgba(127,29,29,0.12) 45%, transparent 72%)",
        }}
      />

      {win && (
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[18%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2">
          <div className="h-full w-full opacity-20" style={endIn("crb-end-rays", 0.9, 0.1)}>
            <div
              className="h-full w-full animate-[hud-spin_60s_linear_infinite] rounded-full"
              style={{
                background: "repeating-conic-gradient(rgba(253,224,71,0.55) 0deg 6deg, transparent 6deg 24deg)",
                maskImage: "radial-gradient(circle, black 8%, transparent 62%)",
              }}
            />
          </div>
        </div>
      )}

      {win && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              className="absolute -top-6 h-3 w-2 rounded-[1px]"
              style={
                {
                  left: `${(i * 37 + 3) % 100}%`,
                  background: END_CONFETTI[i % END_CONFETTI.length],
                  "--sway": `${((i * 53) % 90) - 45}px`,
                  "--spin": `${360 + ((i * 97) % 540)}deg`,
                  animation: `crb-end-confetti ${2.4 + (i % 5) * 0.25}s linear ${0.2 + (i % 9) * 0.14}s 2 forwards`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {!win && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2 origin-left bg-red-600" style={endIn("crb-end-wipe", 0.5, 0.05)} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2 origin-right bg-red-600" style={endIn("crb-end-wipe", 0.5, 0.05)} />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={KO_STRIPES} />
        </>
      )}

      <div className="relative flex h-full w-full flex-col overflow-y-auto p-4 sm:p-6">
        <div className="m-auto flex w-full max-w-[1120px] flex-col gap-3 sm:gap-4">
          <header className="flex flex-col items-center text-center">
            <div
              className={`flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.45em] sm:text-xs ${win ? "text-amber-200" : "text-red-300"}`}
              style={endIn("crb-end-rise", 0.4, 0.1)}
            >
              <span aria-hidden className="h-0.5 w-10 origin-right bg-current sm:w-20" style={endIn("crb-end-wipe", 0.5, 0.25)} />
              {win ? "Raid cleared" : "Raid wiped · time's up"}
              <span aria-hidden className="h-0.5 w-10 origin-left bg-current sm:w-20" style={endIn("crb-end-wipe", 0.5, 0.25)} />
            </div>

            {win ? (
              <h2
                className="mt-2 text-balance text-5xl font-black italic leading-none tracking-tight text-yellow-200 sm:text-6xl lg:text-7xl"
                style={{ ...endIn("crb-end-slam", 0.6, 0.2, END_SPRING), textShadow: END_WIN_SHADOW }}
              >
                Chat wins
              </h2>
            ) : (
              <div className="relative mt-3 px-6">
                <span aria-hidden className="absolute inset-0 origin-left" style={endIn("crb-end-wipe", 0.4, 0.15)}>
                  <span className="block h-full w-full -skew-x-12 bg-red-700 ring-2 ring-red-400/60" />
                </span>
                <h2
                  className="relative px-2 py-1 text-balance text-5xl font-black italic leading-none tracking-tight text-white sm:text-6xl lg:text-7xl"
                  style={{ ...endIn("crb-end-doom", 0.9, 0.3), textShadow: END_LOSS_SHADOW }}
                >
                  The boss wins
                </h2>
              </div>
            )}

            <p className="mt-3 text-pretty text-sm font-semibold text-white/90 sm:text-base" style={endIn("crb-end-rise", 0.4, 0.45)}>
              {win
                ? `${bossName} fell in ${endClock(secs)}. Clean clear, raid.`
                : `${bossName} survived with ${hpLeft.toLocaleString()} HP. So, so close to glory.`}
            </p>
          </header>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {stats.map(([label, value, tone], i) => (
              <EndStat key={label} label={label} value={value} tone={tone} delay={0.5 + i * 0.07} />
            ))}
          </div>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            {win ? (
              <div className="grid items-start gap-3 pt-2 sm:grid-cols-3 sm:gap-4" aria-label="Raid awards" role="list">
                {cards.map((c) => (
                  <div key={c.kind} role="listitem">
                    <EndAward {...c} raised={c.kind === "mvp"} />
                  </div>
                ))}
              </div>
            ) : (
              <section className={`relative overflow-hidden p-4 text-left sm:p-5 ${END_PANEL}`} style={endIn("crb-end-rise", 0.5, 0.7)}>
                <div className="relative flex items-center gap-4 sm:gap-5">
                  <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28" style={endIn("crb-end-gloat", 0.7, 0.85, END_SPRING)}>
                    <div aria-hidden className="absolute inset-0 rounded-full bg-red-900/60 ring-2 ring-red-500/60" />
                    <div className="absolute inset-1" style={{ animation: "crb-end-float 2.4s ease-in-out 1.6s infinite" }}>
                      <BossArt phase={state.phase} hit={0} variant={variantFor(state.config.bossName)} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-black uppercase tracking-[0.3em] text-red-300">{bossName} gloats</div>
                    <blockquote
                      className="relative mt-1.5 rounded-xl bg-[#19191b] px-4 py-3 text-lg font-semibold leading-snug text-white ring-1 ring-red-400/50 sm:text-xl"
                      style={endIn("crb-end-taunt", 0.5, 1.05, END_SPRING)}
                    >
                      <span aria-hidden className="absolute -left-1.5 top-5 h-3 w-3 rotate-45 bg-[#19191b] ring-1 ring-red-400/50 [clip-path:polygon(0_0,0_100%,100%_100%)]" />
                      <span className="relative">&ldquo;{taunt}&rdquo;</span>
                    </blockquote>
                  </div>
                </div>

                <div className="relative mt-4">
                  <div className="flex items-baseline justify-between gap-3 text-[11px] font-black uppercase tracking-[0.25em]">
                    <span className="text-white/80">Boss HP remaining</span>
                    <span className="font-mono text-sm tabular-nums tracking-normal text-red-200">
                      {hpLeft.toLocaleString()} · {hpPctLabel}
                    </span>
                  </div>
                  <div
                    className="relative mt-1.5 h-4 overflow-hidden rounded-sm bg-black/80 ring-1 ring-white/20"
                    role="img"
                    aria-label={`Boss finished with ${hpPctLabel} health`}
                  >
                    <div
                      className="absolute inset-0 origin-left bg-gradient-to-r from-red-800 via-red-600 to-orange-400"
                      style={{ transform: `scaleX(${hpFrac})`, ...endIn("crb-end-bar", 1.1, 1.15) }}
                    />
                    <div aria-hidden className="absolute inset-0" style={BAR_TICKS} />
                  </div>
                  {closeCall && (
                    <div className="mt-3 flex" style={endIn("crb-end-medal", 0.5, 1.6, END_SPRING)}>
                      <span className="-skew-x-12 rounded-sm bg-amber-300 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.25em] text-black">
                        <span className="inline-block skew-x-12">So close · one more push</span>
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            <EndStandings standings={standings} total={total} win={win} delay={win ? 1.0 : 0.85} />
          </div>

          <EndCallToAction win={win} raiders={players.length} delay={win ? 1.6 : 1.4} />
        </div>
      </div>
    </div>
  );
}
