"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { FeedItem, GameState } from "@/lib/types";
import { UiIcon, type UiIconName } from "./UiIcon";

/** The overlay's raid state. Alias of the engine's GameState (src/lib/types has no separate RaidState). */
export type RaidState = GameState;

export type Achievement = { id: string; title: string; detail: string; icon: UiIconName };

export const TOAST_MS = 3500;
export const MAX_VISIBLE = 3;
const MAX_QUEUE = 6;
const SEEN_MAX = 256;
const RAIDER_MILESTONES: { at: number; title: string; icon: UiIconName }[] = [
  { at: 10, title: "Squad Up", icon: "users" },
  { at: 50, title: "Warband Assembled", icon: "flag" },
  { at: 100, title: "Centurion Raid", icon: "castle" },
];
/** A revive counts as "clutch" if the boss struck this recently or is about to strike. */
const CLUTCH_AFTER_STRIKE_MS = 3000;
const CLUTCH_BEFORE_STRIKE_MS = 2500;
const DAMAGE_KINDS = new Set<FeedItem["kind"]>(["hit", "crit", "bits", "combo", "ult", "redeem"]);

const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

function feedOf(s: RaidState | null | undefined): FeedItem[] {
  const f = s && Array.isArray(s.feed) ? s.feed : [];
  return f.filter((x): x is FeedItem => !!x && typeof x === "object" && typeof x.id === "string");
}

/** Total damage dealt this run. hp-per-raider scaling adds to both hp and maxHp, so the gap is pure damage. */
function damageDealt(s: RaidState | null | undefined): number {
  if (!s) return 0;
  return Math.max(0, num(s.maxHp) - num(s.hp));
}

function comboOf(s: RaidState | null | undefined): { emote: string; count: number; until: number } | null {
  const c = s?.combo;
  if (!c || typeof c !== "object") return null;
  return { emote: str(c.emote), count: num(c.count), until: num(c.until) };
}

const NAME_PATTERNS: RegExp[] = [
  /^(?:(?:CRIT|Crit) ·\s+)?(.+?)\s+hits for/,
  /^(.+?)\s+cheered/,
  /^(.+?)\s+revived/,
  /^(.+?)\s+unleashed/,
  /^(.+?)\s+redeemed/,
];

function actorOf(item: FeedItem): string | null {
  const text = str(item.text);
  for (const re of NAME_PATTERNS) {
    const m = re.exec(text);
    if (m?.[1]) return m[1].slice(0, 40);
  }
  return null;
}

/**
 * Pure: derives achievement moments from a state transition. Never throws.
 * `prev === null` establishes a baseline (nothing fires on first sight of a state).
 * Achievement ids are deterministic so callers can de-duplicate.
 */
export function detectAchievements(prev: RaidState | null, next: RaidState): Achievement[] {
  try {
    if (!prev || !next || typeof next !== "object") return [];
    const runKey = String(num(next.startedAt));
    const sameRun = num(prev.startedAt) === num(next.startedAt);
    const base = sameRun ? prev : null;
    const out: Achievement[] = [];

    const prevIds = new Set(feedOf(base).map((f) => f.id));
    const nextFeed = feedOf(next);
    // Feed is newest-first; walk fresh items chronologically.
    const fresh = nextFeed.filter((f) => !prevIds.has(f.id)).reverse();

    // First Blood
    if (damageDealt(base) <= 0 && damageDealt(next) > 0) {
      const opener = fresh.find((f) => DAMAGE_KINDS.has(f.kind) && num(f.amount) > 0);
      const who = opener ? actorOf(opener) : null;
      out.push({
        id: `${runKey}:first-blood`,
        title: "First Blood",
        detail: who ? `${who} drew the first damage` : "Chat drew the first damage",
        icon: "drop",
      });
    }

    // Combo King: combo chain crosses ×3
    const pc = comboOf(base);
    const nc = comboOf(next);
    const prevCount = pc && nc && pc.emote === nc.emote ? pc.count : 0;
    if (nc && nc.count >= 3 && prevCount < 3) {
      out.push({
        id: `${runKey}:combo:${nc.emote}:${nc.until}`,
        title: "Combo King",
        detail: `${nc.emote || "Emote"} chain ×${nc.count}`,
        icon: "flame",
      });
    } else if (!nc && (pc?.count ?? 0) < 3) {
      // Combo expired between renders: fall back to the feed.
      const comboItem = fresh.find((f) => f.kind === "combo");
      if (comboItem) {
        out.push({ id: `${runKey}:combo:${comboItem.id}`, title: "Combo King", detail: "Emote chain ×3", icon: "flame" });
      }
    }

    const nextAttack = num(next.nextBossAttack);
    for (const f of fresh) {
      const ts = num(f.ts);
      if (f.kind === "revive") {
        const lastStrike = nextFeed.find((x) => x.kind === "boss" && num(x.ts) <= ts);
        const sinceStrike = lastStrike ? ts - num(lastStrike.ts) : Infinity;
        const untilStrike = nextAttack - ts;
        if (sinceStrike <= CLUTCH_AFTER_STRIKE_MS || (untilStrike >= 0 && untilStrike <= CLUTCH_BEFORE_STRIKE_MS)) {
          const m = /^(.+?)\s+revived\s+(.+?)[.!]/.exec(str(f.text));
          out.push({
            id: `${runKey}:clutch:${f.id}`,
            title: "Clutch Heal",
            detail: m ? `${m[1].slice(0, 40)} revived ${m[2].slice(0, 40)} mid-strike` : "A raider was revived mid-strike",
            icon: "star",
          });
        }
      } else if (f.kind === "boss" && /shield wall blocked/i.test(str(f.text))) {
        out.push({ id: `${runKey}:shield:${f.id}`, title: "Shield Wall", detail: "The boss attack was fully blocked", icon: "shield" });
      } else if (f.kind === "ult") {
        const who = actorOf(f);
        const amount = Math.round(num(f.amount));
        out.push({
          id: `${runKey}:ult:${f.id}`,
          title: "Ult Unleashed",
          detail: `${who ?? "Chat"} hit for ${amount.toLocaleString("en-US")}`,
          icon: "star",
        });
      }
    }

    const pr = base ? num(base.raiders) : 0;
    const nr = num(next.raiders);
    for (const m of RAIDER_MILESTONES) {
      if (pr < m.at && nr >= m.at) {
        out.push({ id: `${runKey}:raiders:${m.at}`, title: m.title, detail: `${m.at} raiders joined the fight`, icon: m.icon });
      }
    }

    return out;
  } catch {
    return [];
  }
}

type Toast = Achievement & { shownAt: number };
type Stack = { visible: Toast[]; queue: Achievement[] };
const EMPTY: Stack = { visible: [], queue: [] };

function fill(visible: Toast[], queue: Achievement[], now: number): Stack {
  const v = [...visible];
  const q = [...queue];
  while (v.length < MAX_VISIBLE && q.length) v.push({ ...(q.shift() as Achievement), shownAt: now });
  return { visible: v, queue: q.slice(-MAX_QUEUE) };
}

function prune(s: Stack, now: number): Stack {
  const alive = s.visible.filter((t) => now - t.shownAt < TOAST_MS);
  if (alive.length === s.visible.length) return s;
  return fill(alive, s.queue, now);
}

type Rarity = { label: string; color: string; glow: string; fill: string };

const RARITY = {
  common: { label: "Common", color: "#c9d3e3", glow: "rgba(201,211,227,0.42)", fill: "rgba(201,211,227,0.14)" },
  rare: { label: "Rare", color: "#4fb3ff", glow: "rgba(79,179,255,0.55)", fill: "rgba(79,179,255,0.16)" },
  epic: { label: "Epic", color: "#c27bff", glow: "rgba(194,123,255,0.55)", fill: "rgba(194,123,255,0.16)" },
  legendary: { label: "Legendary", color: "#f5c451", glow: "rgba(245,196,81,0.6)", fill: "rgba(245,196,81,0.18)" },
} satisfies Record<string, Rarity>;

/** Rarity is derived from the deterministic achievement id (`runKey:kind[:...]`). */
function rarityOf(id: string): Rarity {
  const [, kind = "", arg = ""] = id.split(":");
  switch (kind) {
    case "ult":
      return RARITY.legendary;
    case "first-blood":
    case "clutch":
      return RARITY.epic;
    case "combo":
    case "shield":
      return RARITY.rare;
    case "raiders": {
      const at = Number(arg);
      if (at >= 100) return RARITY.legendary;
      if (at >= 50) return RARITY.epic;
      return RARITY.common;
    }
    default:
      return RARITY.common;
  }
}

/** Fixed card height so stack positions are pure transforms — no reflow when toasts enter/leave. */
const CARD_H = 84;
const STACK_GAP = 8;

const TOAST_CSS = `
@keyframes crb-at-in{0%{opacity:0;transform:translate3d(-32px,10px,0) scale(.88)}60%{opacity:1;transform:translate3d(4px,0,0) scale(1.02)}100%{opacity:1;transform:translate3d(0,0,0) scale(1)}}
@keyframes crb-at-out{0%{opacity:1;transform:translate3d(0,0,0) scale(1)}100%{opacity:0;transform:translate3d(-20px,0,0) scale(.95)}}
@keyframes crb-at-fade-in{0%{opacity:0}100%{opacity:1}}
@keyframes crb-at-fade-out{0%{opacity:1}100%{opacity:0}}
@keyframes crb-at-glow{0%{opacity:0}35%{opacity:1}100%{opacity:.45}}
@keyframes crb-at-plate{0%{opacity:0;transform:scale(.4) rotate(-14deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes crb-at-icon{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
@keyframes crb-at-ring{0%{opacity:.9;transform:scale(.85)}100%{opacity:0;transform:scale(1.7)}}
@keyframes crb-at-sheen{0%{opacity:0;transform:translate3d(-110%,0,0) skewX(-18deg)}20%{opacity:1}100%{opacity:0;transform:translate3d(420%,0,0) skewX(-18deg)}}
@keyframes crb-at-text{0%{opacity:0;transform:translate3d(-8px,0,0)}100%{opacity:1;transform:translate3d(0,0,0)}}
@keyframes crb-at-timer{0%{transform:scaleX(1)}100%{transform:scaleX(0)}}
.crb-at-slot{transition:transform 380ms cubic-bezier(.2,.8,.2,1),opacity 380ms ease;will-change:transform,opacity;transform-origin:left bottom}
.crb-at-shell{animation:crb-at-in 560ms cubic-bezier(.16,1.1,.3,1) both,crb-at-out 300ms cubic-bezier(.4,0,1,1) calc(var(--crb-at-life) - 300ms) forwards;will-change:transform,opacity;transform-origin:left center}
.crb-at-glow{animation:crb-at-glow 1100ms ease-out 120ms both;will-change:opacity}
.crb-at-plate{animation:crb-at-plate 520ms cubic-bezier(.2,1.6,.4,1) 80ms both}
.crb-at-icon{animation:crb-at-icon 460ms cubic-bezier(.2,1.6,.4,1) 220ms both}
.crb-at-ring{animation:crb-at-ring 760ms ease-out 240ms both}
.crb-at-sheen{animation:crb-at-sheen 950ms ease-out 300ms both}
.crb-at-text{animation:crb-at-text 380ms cubic-bezier(.2,.8,.2,1) both}
.crb-at-timer{animation:crb-at-timer var(--crb-at-life) linear both;transform-origin:left center}
@media (prefers-reduced-motion: reduce){
.crb-at-slot{transition:opacity 200ms linear}
.crb-at-shell{animation:crb-at-fade-in 200ms linear both,crb-at-fade-out 200ms linear calc(var(--crb-at-life) - 200ms) forwards}
.crb-at-glow{animation:none;opacity:.5}
.crb-at-plate,.crb-at-icon,.crb-at-text{animation:none}
.crb-at-ring,.crb-at-sheen{animation:none;opacity:0}
.crb-at-timer{animation:none;opacity:.4}
}
`;

export function AchievementToasts({ state }: { state: RaidState }) {
  const prevRef = useRef<RaidState | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const [stack, setStack] = useState<Stack>(EMPTY);

  useEffect(() => {
    let found: Achievement[] = [];
    try {
      const seen = seenRef.current;
      found = detectAchievements(prevRef.current, state).filter((a) => !seen.has(a.id));
      for (const a of found) seen.add(a.id);
      while (seen.size > SEEN_MAX) {
        const oldest = seen.values().next().value;
        if (oldest === undefined) break;
        seen.delete(oldest);
      }
    } catch {
      found = [];
    }
    prevRef.current = state;
    if (!found.length) return;
    const now = Date.now();
    setStack((s) => fill(s.visible, [...s.queue, ...found], now));
  }, [state]);

  useEffect(() => {
    if (!stack.visible.length) return;
    const nextExpiry = Math.min(...stack.visible.map((t) => t.shownAt + TOAST_MS));
    const id = window.setTimeout(() => setStack((s) => prune(s, Date.now())), Math.max(0, nextExpiry - Date.now()) + 20);
    return () => window.clearTimeout(id);
  }, [stack]);

  const count = stack.visible.length;

  return (
    <div
      data-testid="achievement-toasts"
      role="status"
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="false"
      className="pointer-events-none absolute bottom-6 left-6 z-40 w-[min(22rem,calc(100%-3rem))]"
      style={{ height: CARD_H, ["--crb-at-life" as string]: `${TOAST_MS}ms` } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: TOAST_CSS }} />
      {stack.visible.map((t, i) => (
        <AchievementToast key={t.id} toast={t} slot={count - 1 - i} />
      ))}
    </div>
  );
}

function AchievementToast({ toast, slot }: { toast: Toast; slot: number }) {
  const rarity = rarityOf(toast.id);
  const slotStyle: CSSProperties = {
    height: CARD_H,
    transform: `translate3d(0, ${-slot * (CARD_H + STACK_GAP)}px, 0) scale(${1 - slot * 0.035})`,
    opacity: 1 - slot * 0.14,
    zIndex: MAX_VISIBLE - slot,
  };

  return (
    <div className="crb-at-slot absolute inset-x-0 bottom-0" style={slotStyle}>
      <div data-testid="achievement-toast" className="crb-at-shell relative h-full">
        <span
          aria-hidden="true"
          className="crb-at-glow pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: `0 0 0 1px ${rarity.color}, 0 0 24px 3px ${rarity.glow}, 0 0 56px 6px ${rarity.fill}` }}
        />
        <div
          className="relative h-full overflow-hidden rounded-xl border"
          style={{
            borderColor: `${rarity.color}b3`,
            background: `linear-gradient(90deg, ${rarity.fill}, transparent 60%), rgba(20,15,32,0.95)`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
            contain: "layout paint",
          }}
        >
          <span
            aria-hidden="true"
            className="crb-at-sheen pointer-events-none absolute inset-y-0 left-0 w-1/4"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)" }}
          />
          <div className="relative flex h-full items-center gap-3 px-3 pr-4">
            <div className="relative grid size-12 shrink-0 place-items-center">
              <span
                aria-hidden="true"
                className="crb-at-ring absolute inset-0 rounded-lg border-2"
                style={{ borderColor: rarity.color }}
              />
              <span
                aria-hidden="true"
                className="crb-at-plate absolute inset-0 rounded-lg border"
                style={{
                  borderColor: rarity.color,
                  background: `radial-gradient(circle at 50% 35%, ${rarity.glow}, ${rarity.fill} 70%), rgba(20,15,32,0.9)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 0 14px ${rarity.glow}`,
                }}
              />
              <span aria-hidden="true" className="crb-at-icon relative text-2xl leading-none">
                <UiIcon name={toast.icon} className="size-6" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="crb-at-text truncate text-xs font-bold uppercase leading-4 tracking-[0.18em]"
                style={{ color: rarity.color, animationDelay: "180ms" }}
              >
                {rarity.label}
                <span aria-hidden="true" className="px-1.5 opacity-60">
                  {"·"}
                </span>
                Achievement unlocked
              </p>
              <p
                className="crb-at-text truncate text-base font-extrabold leading-tight text-[#fbf8ff]"
                style={{ animationDelay: "240ms" }}
              >
                {toast.title}
              </p>
              <p
                className="crb-at-text truncate text-sm leading-relaxed text-[#d4cce6]"
                style={{ animationDelay: "300ms" }}
              >
                {toast.detail}
              </p>
            </div>
          </div>
          <span
            aria-hidden="true"
            className="crb-at-timer absolute inset-x-0 bottom-0 h-0.5"
            style={{ background: rarity.color, boxShadow: `0 0 8px ${rarity.glow}` }}
          />
        </div>
      </div>
    </div>
  );
}

export default AchievementToasts;
