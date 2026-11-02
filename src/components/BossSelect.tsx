"use client";
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { BossArt, type BossVariant } from "./BossArt";

export type BossDifficulty = "Easy" | "Medium" | "Hard" | "Brutal";

export type BossOption = {
  id: string;
  name: string;
  taunt: string;
  difficulty: BossDifficulty;
  /** Static portrait tint. Applied as a filter on a non-animated wrapper. */
  tint: string;
};

export const BOSSES: BossOption[] = [
  { id: "lag-wyrm", name: "The Lag Wyrm", taunt: "Your inputs arrive… eventually.", difficulty: "Medium", tint: "hue-rotate(-125deg)" },
  { id: "buffer-lich", name: "Buffer Lich", taunt: "Loading your doom… 99%… 99%…", difficulty: "Hard", tint: "hue-rotate(-75deg)" },
  { id: "copypasta", name: "Captain Copypasta", taunt: "Say it again. Louder. In caps.", difficulty: "Easy", tint: "hue-rotate(125deg)" },
  { id: "ban-hammer", name: "The Ban Hammer", taunt: "Timeouts are for the weak.", difficulty: "Brutal", tint: "hue-rotate(95deg) saturate(1.2)" },
  { id: "lord-lurker", name: "Lord Lurker", taunt: "I've watched every stream. Silently.", difficulty: "Medium", tint: "hue-rotate(30deg) brightness(0.85)" },
  { id: "pumpkin-king", name: "The Pumpkin King", taunt: "Your raid is carved. Seasonally.", difficulty: "Hard", tint: "none" },
  { id: "frost-troll", name: "The Frost Troll", taunt: "Chat is frozen. Literally.", difficulty: "Medium", tint: "none" },
  { id: "gift-goblin", name: "The Gift Goblin", taunt: "Unwrap this: you lose.", difficulty: "Easy", tint: "none" },
  { id: "neon-glitch", name: "The Neon Glitch", taunt: "Your frames are mine now.", difficulty: "Brutal", tint: "none" },
  { id: "lunar-dragon", name: "The Lunar Dragon", taunt: "Fortune favors the boss.", difficulty: "Hard", tint: "none" },
];

const CUSTOM_ID = "custom";
const CUSTOM_TINT = "grayscale(1) brightness(0.8)";
const SEASONAL_IDS = new Set(["gift-goblin", "neon-glitch", "lunar-dragon", "pumpkin-king", "frost-troll"]);

type Filter = "All" | BossDifficulty;
const FILTERS: Filter[] = ["All", "Easy", "Medium", "Hard", "Brutal"];

const TAG_TONE: Record<BossDifficulty | "Any", string> = {
  Easy: "bg-[#3ddc97]/10 text-[#7ff0bf] ring-[#3ddc97]/30",
  Medium: "bg-[#ffcc4d]/10 text-[#ffe08a] ring-[#ffcc4d]/30",
  Hard: "bg-[#ff4655]/10 text-[#ffb3ba] ring-[#ff4655]/35",
  Brutal: "bg-[#ff4655]/45 text-white ring-[#ff4655]/60",
  Any: "bg-white/[0.06] text-white/80 ring-white/15",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]";

type Card = {
  id: string;
  name: string;
  taunt: string;
  tag: BossDifficulty | "Any";
  variant: BossVariant;
  /** Only the custom card is tinted; built-ins render their own variant art. */
  filter?: string;
  seasonal: boolean;
};

function nextIndex(key: string, i: number, len: number): number {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % len;
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + len) % len;
  if (key === "Home") return 0;
  if (key === "End") return len - 1;
  return -1;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BossSelect({
  value,
  onSelect,
  onCustom,
}: {
  /** Current config.bossName. */
  value: string;
  /** Called with the chosen boss name; wire to set({ bossName }). */
  onSelect: (bossName: string) => void;
  /** Called when Custom is picked with a pointer, e.g. to focus the free-text input. */
  onCustom?: () => void;
}) {
  const uid = useId();
  const headingId = `${uid}-heading`;
  const filterLabelId = `${uid}-filter-label`;
  const statusId = `${uid}-status`;
  const [customPicked, setCustomPicked] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const trimmed = value.trim();
  const matched = BOSSES.find((b) => b.name === trimmed);
  const selected = customPicked || !matched ? CUSTOM_ID : matched.id;

  const cards: Card[] = [
    ...BOSSES.map<Card>((b) => ({
      id: b.id,
      name: b.name,
      taunt: b.taunt,
      tag: b.difficulty,
      variant: b.id as BossVariant,
      seasonal: SEASONAL_IDS.has(b.id),
    })),
    {
      id: CUSTOM_ID,
      name: "Custom",
      taunt: selected === CUSTOM_ID && trimmed ? `“${trimmed}”. Edit the name below.` : "Name your own boss below.",
      tag: "Any",
      variant: "default" as BossVariant,
      filter: CUSTOM_TINT,
      seasonal: false,
    },
  ];

  const visible = cards.filter((c) => filter === "All" || c.tag === filter || c.id === CUSTOM_ID);
  const selectedVisible = visible.some((c) => c.id === selected);
  const tabStopId = selectedVisible ? selected : visible[0]?.id;
  const selectedCard = cards.find((c) => c.id === selected);
  const bossCount = visible.filter((c) => c.id !== CUSTOM_ID).length;

  function choose(id: string, fromPointer: boolean) {
    if (id === CUSTOM_ID) {
      setCustomPicked(true);
      if (fromPointer) onCustom?.();
      return;
    }
    const boss = BOSSES.find((b) => b.id === id);
    if (!boss) return;
    setCustomPicked(false);
    onSelect(boss.name);
  }

  function onCardKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = nextIndex(e.key, i, visible.length);
    if (n < 0) return;
    e.preventDefault();
    const target = visible[n];
    choose(target.id, false);
    const el = cardRefs.current.get(target.id);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onChipKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = nextIndex(e.key, i, FILTERS.length);
    if (n < 0) return;
    e.preventDefault();
    setFilter(FILTERS[n]);
    chipRefs.current[n]?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p id={headingId} className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
          Choose your boss
        </p>
        <p className="text-xs text-white/70">
          <span className="sr-only">Currently selected: </span>
          <span aria-hidden="true">Selected: </span>
          <span className="font-semibold text-white">{selectedCard?.name}</span>
          {!selectedVisible && <span className="text-white/70"> (hidden by filter)</span>}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span id={filterLabelId} className="sr-only">
          Filter bosses by difficulty
        </span>
        <div
          role="radiogroup"
          aria-labelledby={filterLabelId}
          aria-controls={`${uid}-roster`}
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none]"
        >
          {FILTERS.map((f, i) => {
            const active = filter === f;
            return (
              <button
                key={f}
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setFilter(f)}
                onKeyDown={(e) => onChipKey(e, i)}
                className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-4 text-sm font-semibold ring-1 transition-colors ${focusRing} ${
                  active
                    ? "bg-[#9146FF] text-white ring-[#9146FF]"
                    : "bg-white/[0.04] text-white/85 ring-white/15 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <p id={statusId} aria-live="polite" className="sr-only">
          {`${bossCount} ${bossCount === 1 ? "boss" : "bosses"} shown, plus Custom.`}
        </p>
      </div>

      <div
        id={`${uid}-roster`}
        role="radiogroup"
        aria-labelledby={headingId}
        aria-describedby={statusId}
        className="-mx-1 flex snap-x snap-mandatory scroll-px-1 gap-2.5 overflow-x-auto px-1 pt-1 pb-3 lg:grid lg:snap-none lg:grid-cols-2 lg:overflow-visible lg:pb-1"
      >
        {visible.map((c, i) => {
          const checked = selected === c.id;
          const nameId = `${uid}-${c.id}-name`;
          const descId = `${uid}-${c.id}-desc`;
          const isCustom = c.id === CUSTOM_ID;
          return (
            <button
              key={c.id}
              ref={(el) => {
                if (el) cardRefs.current.set(c.id, el);
                else cardRefs.current.delete(c.id);
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-labelledby={nameId}
              aria-describedby={descId}
              tabIndex={c.id === tabStopId ? 0 : -1}
              onClick={(e) => choose(c.id, e.detail > 0)}
              onKeyDown={(e) => onCardKey(e, i)}
              style={{ animationDelay: `${i * 45}ms` } as CSSProperties}
              className={`relative flex min-h-11 w-44 shrink-0 snap-start flex-col gap-2.5 rounded-xl p-3 text-left ring-1 transition-[background-color,box-shadow] motion-safe:animate-[crb-boss-card-in_320ms_ease-out_both] lg:w-auto lg:min-w-0 ${focusRing} ${
                checked
                  ? "bg-[#9146FF]/20 ring-2 ring-[#a970ff] shadow-none"
                  : "bg-[#141415] ring-white/10 hover:bg-white/[0.06] hover:ring-white/25"
              } ${isCustom ? "border border-dashed border-white/15" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full ring-1 transition-[background-color,transform,opacity] duration-200 ${
                  checked
                    ? "scale-100 bg-[#c4a3ff] text-[#19191b] ring-[#c4a3ff] opacity-100"
                    : "scale-90 bg-transparent text-transparent ring-white/30 opacity-80"
                }`}
              >
                <CheckIcon />
              </span>

              <span
                aria-hidden="true"
                className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#19191b] ring-1 transition-transform duration-200 ease-out ${
                  checked ? "scale-105 ring-[#a970ff]/60" : "ring-white/10"
                }`}
              >
                <span
                  className="crb-boss-portrait block size-12"
                  data-still={checked ? undefined : "true"}
                  style={c.filter ? { filter: c.filter } : undefined}
                >
                  <BossArt phase="fight" hit={0} variant={c.variant} />
                </span>
              </span>

              <span className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ring-1 ${TAG_TONE[c.tag]}`}>{c.tag}</span>
                {c.seasonal && (
                  <span className="rounded-sm bg-[#ff9f43]/15 px-2 py-0.5 text-xs font-semibold text-[#ffd2a6] ring-1 ring-[#ff9f43]/40">
                    Seasonal
                  </span>
                )}
              </span>

              <span id={nameId} className="text-sm font-bold leading-tight text-white text-balance">
                {c.name}
              </span>
              <span id={descId} className="break-words text-xs leading-snug text-white/75 text-pretty">
                {c.taunt}
                <span className="sr-only">
                  {`. Difficulty: ${c.tag === "Any" ? "set by preset" : c.tag}${c.seasonal ? ". Seasonal boss" : ""}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
