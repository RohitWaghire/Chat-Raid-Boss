"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FeedKind, GameState, Player } from "@/lib/types";

type TimelineKind = Extract<FeedKind, "crit" | "combo" | "bits" | "ko" | "revive" | "ult" | "redeem">;

const TIMELINE_KINDS: { kind: TimelineKind; label: string; dot: string }[] = [
  { kind: "crit", label: "Crits", dot: "#ffd37a" },
  { kind: "combo", label: "Combos", dot: "#c4a3ff" },
  { kind: "bits", label: "Bits", dot: "#7ad7ff" },
  { kind: "ult", label: "Ults", dot: "#ff9ef5" },
  { kind: "redeem", label: "Redeems", dot: "#9ff5c8" },
  { kind: "ko", label: "KOs", dot: "#ff8a9b" },
  { kind: "revive", label: "Revives", dot: "#c8f59f" },
];

const MARKER_KINDS: Record<string, { label: string; color: string }> = {
  ult: { label: "Ult", color: "#ff9ef5" },
  ko: { label: "KO", color: "#ff8a9b" },
};

const PODIUM_STYLES = [
  { medal: "#ffd37a", plinth: "h-20", label: "1st" },
  { medal: "#d6d6e0", plinth: "h-14", label: "2nd" },
  { medal: "#e8a27a", plinth: "h-10", label: "3rd" },
] as const;

const BUCKETS = 24;
const TIME_KEYS = ["at", "ts", "time", "timestamp", "createdAt"] as const;
const AMOUNT_KEYS = ["damage", "dmg", "amount"] as const;
const NON_DAMAGE_KINDS = new Set(["heal", "shield", "revive", "join", "spam", "system", "chat", "info", "redeem"]);

const nf = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const fmt = (n: number) => nf.format(Math.round(n));
const pct = (n: number) => `${Math.round(n * 100)}%`;

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function topBy(players: Player[], key: "heals" | "shields"): Player | null {
  let best: Player | null = null;
  for (const p of players) {
    if (p[key] > 0 && (!best || p[key] > best[key])) best = p;
  }
  return best;
}

function readNumber(record: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

type Timeline = {
  values: number[];
  mode: "damage" | "activity";
  hasTime: boolean;
  spanMs: number;
  markers: { kind: string; x: number }[];
  peakIndex: number;
  peak: number;
  eventCount: number;
};

function buildTimeline(state: GameState): Timeline {
  const items = state.feed.map((item) => {
    const loose = item as unknown as Record<string, unknown>;
    const kind = String(item.kind);
    return {
      kind,
      t: readNumber(loose, TIME_KEYS),
      amount: NON_DAMAGE_KINDS.has(kind) ? null : readNumber(loose, AMOUNT_KEYS),
    };
  });

  const values = new Array<number>(BUCKETS).fill(0);
  const markers: Timeline["markers"] = [];
  const hasTime = items.length > 0 && items.every((i) => i.t !== null);
  const mode: Timeline["mode"] = items.some((i) => (i.amount ?? 0) > 0) ? "damage" : "activity";

  let t0 = 0;
  let span = 1;
  if (hasTime) {
    const times = items.map((i) => i.t as number);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    t0 = state.startedAt > 0 ? Math.min(state.startedAt, minT) : minT;
    const t1 = state.endedAt > t0 ? Math.max(state.endedAt, maxT) : maxT;
    span = Math.max(1, t1 - t0);
  }

  items.forEach((item, index) => {
    const frac = hasTime
      ? ((item.t as number) - t0) / span
      : items.length > 1
        ? index / (items.length - 1)
        : 0;
    const clamped = Math.min(1, Math.max(0, frac));
    const bucket = Math.min(BUCKETS - 1, Math.floor(clamped * BUCKETS));
    values[bucket] += mode === "damage" ? Math.max(0, item.amount ?? 0) : 1;
    if (item.kind in MARKER_KINDS) markers.push({ kind: item.kind, x: clamped });
  });

  let peakIndex = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[peakIndex]) peakIndex = i;

  return {
    values,
    mode,
    hasTime,
    spanMs: hasTime ? span : 0,
    markers,
    peakIndex,
    peak: values[peakIndex] ?? 0,
    eventCount: items.length,
  };
}

function useRecapStats(state: GameState) {
  return useMemo(() => {
    const players = Object.values(state.players);
    const isVictory = state.phase === "victory";
    const durationMs =
      state.endedAt > state.startedAt && state.startedAt > 0 ? state.endedAt - state.startedAt : 0;
    const maxHp = Math.max(0, state.maxHp);
    const hpDealt = Math.min(maxHp, Math.max(0, maxHp - Math.max(0, state.hp)));
    const hpShare = maxHp > 0 ? hpDealt / maxHp : 0;

    let totalDamage = 0;
    let totalHits = 0;
    for (const p of players) {
      totalDamage += p.damage;
      totalHits += p.hits;
    }

    const ranked = players.filter((p) => p.damage > 0).sort((a, b) => b.damage - a.damage);
    const top5 = ranked.slice(0, 5).map((p) => ({
      player: p,
      share: totalDamage > 0 ? p.damage / totalDamage : 0,
    }));
    const top3Damage = ranked.slice(0, 3).reduce((sum, p) => sum + p.damage, 0);
    const concentration = totalDamage > 0 ? top3Damage / totalDamage : 0;

    const minutes = durationMs / 60000;
    const perMinute = minutes > 0 ? state.totalMessages / minutes : 0;
    const spamShare = state.totalMessages > 0 ? state.ignored / state.totalMessages : 0;

    const counts = Object.fromEntries(TIMELINE_KINDS.map((k) => [k.kind, 0])) as Record<TimelineKind, number>;
    for (const item of state.feed) {
      if (item.kind in counts) counts[item.kind as TimelineKind] += 1;
    }

    return {
      isVictory,
      bossName: state.config.bossName,
      durationMs,
      maxHp,
      hpDealt,
      hpShare,
      raiders: state.raiders,
      totalMessages: state.totalMessages,
      ignored: state.ignored,
      spamShare,
      perMinute,
      totalDamage,
      totalHits,
      top5,
      concentration,
      topHealer: topBy(players, "heals"),
      topShielder: topBy(players, "shields"),
      counts,
      timeline: buildTimeline(state),
    };
  }, [state]);
}

type RecapStats = ReturnType<typeof useRecapStats>;

function buildPlainText(s: RecapStats): string {
  const lines: string[] = [];
  lines.push(`RAID RECAP: ${s.isVictory ? "VICTORY" : "DEFEAT"} vs ${s.bossName}`);
  lines.push(`Duration: ${formatDuration(s.durationMs)}`);
  lines.push(`Boss damage: ${fmt(s.hpDealt)} / ${fmt(s.maxHp)} HP (${pct(s.hpShare)})`);
  lines.push(`Raiders: ${fmt(s.raiders)}`);
  lines.push(
    `Messages: ${fmt(s.totalMessages)} (${s.perMinute.toFixed(1)}/min), spam blocked: ${fmt(s.ignored)} (${pct(s.spamShare)})`,
  );
  lines.push(`Total hits: ${fmt(s.totalHits)}`);
  lines.push("");
  lines.push("Top damage:");
  if (s.top5.length === 0) lines.push("  (no damage dealt)");
  s.top5.forEach(({ player, share }, i) => {
    lines.push(`  ${i + 1}. ${player.name}: ${fmt(player.damage)} (${pct(share)})`);
  });
  lines.push(`Damage concentration (top 3): ${pct(s.concentration)}`);
  lines.push("");
  lines.push(`Top healer: ${s.topHealer ? `${s.topHealer.name} (${fmt(s.topHealer.heals)} heals)` : "none"}`);
  lines.push(
    `Top shielder: ${s.topShielder ? `${s.topShielder.name} (${fmt(s.topShielder.shields)} shields)` : "none"}`,
  );
  lines.push("");
  lines.push(`Events: ${TIMELINE_KINDS.map((k) => `${k.label} ${s.counts[k.kind]}`).join(", ")}`);
  return lines.join("\n");
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard API can be blocked in iframes; fall through to legacy path.
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-xl border border-[#9146FF]/25 bg-[#141415] p-4 ${className}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c4a3ff]">{title}</h3>
        {aside ? <span className="text-xs text-[#adadb8]">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-[#232325] px-3 py-2.5">
      <dt className="text-xs text-[#adadb8]">{label}</dt>
      <dd className="font-mono text-lg font-semibold tabular-nums text-[#efeff1]">{value}</dd>
      {hint ? <dd className="text-xs text-[#adadb8]">{hint}</dd> : null}
    </div>
  );
}

function Sparkline({ timeline }: { timeline: Timeline }) {
  const titleId = useId();
  const descId = useId();
  const { values, mode, hasTime, spanMs, markers, peakIndex, peak, eventCount } = timeline;

  if (eventCount < 2 || peak <= 0) {
    return <p className="text-sm text-[#adadb8]">Not enough logged events to plot a timeline.</p>;
  }

  const width = 320;
  const height = 88;
  const top = 8;
  const markerRow = 12;
  const baseline = height - markerRow - 4;
  const plotH = baseline - top;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => [i * step, baseline - (v / peak) * plotH] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${baseline} L0 ${baseline} Z`;
  const [peakX, peakY] = points[peakIndex];

  const unit = mode === "damage" ? "damage" : "events";
  const peakAt = hasTime
    ? `around ${formatDuration(((peakIndex + 0.5) / values.length) * spanMs)}`
    : `in segment ${peakIndex + 1} of ${values.length}`;
  const ultCount = markers.filter((m) => m.kind === "ult").length;
  const koCount = markers.filter((m) => m.kind === "ko").length;

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>{mode === "damage" ? "Damage over time" : "Raid activity over time"}</title>
        <desc id={descId}>
          {`Peak of ${fmt(peak)} ${unit} ${peakAt}. ${ultCount} ults and ${koCount} KOs marked along the bottom.`}
        </desc>
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={baseline - f * plotH}
            y2={baseline - f * plotH}
            stroke="#36363a"
            strokeDasharray="2 4"
          />
        ))}
        <line x1={0} x2={width} y1={baseline} y2={baseline} stroke="#3a2a55" />
        <path d={area} fill="#9146FF" fillOpacity={0.28} />
        <path d={line} fill="none" stroke="#c4a3ff" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={peakX} cy={peakY} r={4} fill="#141415" stroke="#ffd37a" strokeWidth={2} />
        {markers.map((m, i) => (
          <circle
            key={`${m.kind}-${i}`}
            cx={Math.min(width - 3, Math.max(3, m.x * width))}
            cy={height - markerRow / 2}
            r={3}
            fill={MARKER_KINDS[m.kind]?.color}
          />
        ))}
      </svg>
      <div aria-hidden="true" className="flex justify-between font-mono text-xs tabular-nums text-[#adadb8]">
        <span>{hasTime ? "0:00" : "Start"}</span>
        <span className="text-[#efeff1]">
          Peak {compact.format(peak)} {unit}
        </span>
        <span>{hasTime ? formatDuration(spanMs) : "End"}</span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#adadb8]" aria-label="Chart legend">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-[#c4a3ff]" />
          {mode === "damage" ? "Damage" : "Events"}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full border-2 border-[#ffd37a]" />
          Peak
        </li>
        {Object.entries(MARKER_KINDS).map(([kind, { label, color }]) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Podium({ rows }: { rows: RecapStats["top5"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#adadb8]">No damage was dealt this raid.</p>;
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const visualOrder = ["order-2", "order-1", "order-3"];

  return (
    <div className="flex flex-col gap-3">
      <ol className="grid grid-cols-3 items-end gap-2" aria-label="Top 3 damage dealers">
        {podium.map(({ player, share }, i) => {
          const style = PODIUM_STYLES[i];
          return (
            <li key={player.name} className={`flex min-w-0 flex-col items-center gap-1.5 ${visualOrder[i]}`}>
              <span className="sr-only">{`${style.label} place: `}</span>
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-full border-2 font-mono text-xs font-bold"
                style={{ borderColor: style.medal, color: style.medal }}
              >
                {i + 1}
              </span>
              <span className="flex w-full min-w-0 items-center justify-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: player.color || "#9146FF" }}
                />
                <span className="truncate text-sm font-semibold text-[#efeff1]" title={player.name}>
                  {player.name}
                </span>
              </span>
              <span className="font-mono text-xs tabular-nums text-[#adadb8]">
                {compact.format(player.damage)}
                <span className="sr-only"> damage,</span> · {pct(share)}
              </span>
              <div
                aria-hidden="true"
                className={`w-full rounded-t-md border-t-2 bg-[#232325] ${style.plinth}`}
                style={{ borderColor: style.medal }}
              />
            </li>
          );
        })}
      </ol>
      {rest.length > 0 ? (
        <ol start={4} className="flex flex-col gap-1 border-t border-[#36363a] pt-3" aria-label="Runners-up">
          {rest.map(({ player, share }, i) => (
            <li key={player.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 font-mono text-xs text-[#adadb8]">{i + 4}</span>
                <span className="truncate text-[#efeff1]">{player.name}</span>
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-[#adadb8]">
                {fmt(player.damage)} · {pct(share)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function Spotlight({
  role,
  player,
  value,
  unit,
}: {
  role: string;
  player: Player | null;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[#232325] px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-[#adadb8]">{role}</span>
        {player ? (
          <span className="flex min-w-0 items-center gap-2 font-semibold text-[#efeff1]">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: player.color || "#9146FF" }}
            />
            <span className="truncate">{player.name}</span>
          </span>
        ) : (
          <span className="text-sm text-[#adadb8]">Nobody this raid</span>
        )}
      </div>
      {player ? (
        <span className="shrink-0 font-mono text-sm tabular-nums text-[#efeff1]">
          {fmt(value)} <span className="text-[#adadb8]">{unit}</span>
        </span>
      ) : null}
    </div>
  );
}

type ShareStatus = "idle" | "copied" | "linkCopied" | "shared" | "error";

const STATUS_TEXT: Record<ShareStatus, string> = {
  idle: "",
  copied: "Recap copied to clipboard",
  linkCopied: "Link copied to clipboard",
  shared: "Recap shared",
  error: "Copy failed, clipboard unavailable",
};

export function RaidRecap({ state }: { state: GameState }) {
  const s = useRecapStats(state);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const flash = useCallback((next: ShareStatus) => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(buildPlainText(s));
    flash(ok ? "copied" : "error");
  }, [s, flash]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Raid recap: ${s.bossName}`, text: buildPlainText(s), url });
        flash("shared");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    const ok = await copyToClipboard(url);
    flash(ok ? "linkCopied" : "error");
  }, [s, flash]);

  const outcomeColor = s.isVictory ? "#00f593" : "#ff8a9b";
  const totalEvents = TIMELINE_KINDS.reduce((sum, k) => sum + s.counts[k.kind], 0);
  const isError = status === "error";

  return (
    <article
      data-testid="raid-recap"
      aria-label="Raid recap"
      className="flex flex-col gap-4 rounded-2xl border border-[#9146FF]/40 bg-[#141415] p-4 text-[#efeff1] sm:p-5"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ color: outcomeColor, borderColor: outcomeColor }}
            >
              {s.isVictory ? "Victory" : "Defeat"}
            </span>
            <span className="font-mono text-xs tabular-nums text-[#adadb8]">
              {formatDuration(s.durationMs)} fight
            </span>
          </div>
          <h3 className="text-pretty text-xl font-bold leading-tight text-[#efeff1]">
            Raid recap: <span className="text-[#c4a3ff]">{s.bossName}</span>
          </h3>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="shrink-0 rounded-lg border border-[#9146FF]/60 bg-transparent px-4 py-2 text-sm font-semibold text-[#efeff1] transition-colors hover:bg-[#232325] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]"
            >
              Share link
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-[#9146FF] px-4 py-2 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#9146FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]"
            >
              Copy recap
            </button>
          </div>
          <p
            aria-live="polite"
            role="status"
            className={`min-h-5 text-sm ${isError ? "text-[#ff8a9b]" : "text-[#00f593]"}`}
          >
            {STATUS_TEXT[status]}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-[#adadb8]">Boss HP dealt</span>
          <span className="font-mono tabular-nums">
            {fmt(s.hpDealt)} / {fmt(s.maxHp)} <span className="text-[#c4a3ff]">({pct(s.hpShare)})</span>
          </span>
        </div>
        <div
          role="meter"
          aria-label="Boss HP dealt"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(s.hpShare * 100)}
          className="h-2.5 w-full overflow-hidden rounded-full bg-[#232325]"
        >
          <div className="h-full rounded-full bg-[#9146FF]" style={{ width: `${s.hpShare * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title={s.timeline.mode === "damage" ? "Damage timeline" : "Activity timeline"}
          aside={`${fmt(s.timeline.eventCount)} logged events`}
          className="lg:col-span-3"
        >
          <Sparkline timeline={s.timeline} />
        </Panel>

        <Panel title="Damage podium" aside={`Top 3: ${pct(s.concentration)}`} className="lg:col-span-2">
          <Podium rows={s.top5} />
        </Panel>

        <Panel title="Totals" className="lg:col-span-5">
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Raiders" value={fmt(s.raiders)} />
            <Stat label="Messages" value={fmt(s.totalMessages)} hint={`${s.perMinute.toFixed(1)} / min`} />
            <Stat label="Spam blocked" value={fmt(s.ignored)} hint={`${pct(s.spamShare)} of chat`} />
            <Stat label="Duration" value={formatDuration(s.durationMs)} />
            <Stat label="Total hits" value={fmt(s.totalHits)} />
            <Stat label="Total damage" value={fmt(s.totalDamage)} />
            <Stat label="Damage concentration" value={pct(s.concentration)} hint="Share dealt by top 3" />
            <Stat label="Highlights" value={fmt(totalEvents)} hint="Crits, ults, KOs and more" />
          </dl>
        </Panel>

        <Panel title="Support MVPs" className="lg:col-span-2">
          <div className="flex flex-col gap-2">
            <Spotlight role="Top healer" player={s.topHealer} value={s.topHealer?.heals ?? 0} unit="heals" />
            <Spotlight
              role="Top shielder"
              player={s.topShielder}
              value={s.topShielder?.shields ?? 0}
              unit="shields"
            />
          </div>
        </Panel>

        <Panel title="Highlight events" className="lg:col-span-3">
          <ul className="flex flex-wrap gap-2" aria-label={`${totalEvents} highlight events logged`}>
            {TIMELINE_KINDS.map(({ kind, label, dot }) => {
              const count = s.counts[kind];
              return (
                <li
                  key={kind}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    count > 0 ? "border-[#9146FF]/50 bg-[#232325]" : "border-[#36363a] bg-transparent"
                  }`}
                >
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: dot }} />
                  <span className="text-[#adadb8]">{label}</span>
                  <span className="font-mono font-semibold tabular-nums text-[#efeff1]">{fmt(count)}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs leading-relaxed text-[#adadb8]">Counted from the raid event feed.</p>
        </Panel>
      </div>
    </article>
  );
}
