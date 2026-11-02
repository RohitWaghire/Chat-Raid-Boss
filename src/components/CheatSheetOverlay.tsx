"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

const SLIDE_MS = 8000;
const TIP_MS = 5000;

type Corner = "bl" | "br" | "tl" | "tr";

const CORNER_CLASS: Record<Corner, string> = {
  bl: "bottom-12 left-12",
  br: "bottom-12 right-12",
  tl: "top-12 left-12",
  tr: "top-12 right-12",
};

const ENTER_FROM: Record<Corner, string> = {
  bl: "translate3d(-32px, 0, 0)",
  tl: "translate3d(-32px, 0, 0)",
  br: "translate3d(32px, 0, 0)",
  tr: "translate3d(32px, 0, 0)",
};

/** Mirrors ALIASES in lib/commands.ts (primary command first). */
const CMD = {
  attack: ["!atk", "!attack", "!hit", "!a"],
  heal: ["!heal", "!revive", "!h"],
  shield: ["!shield", "!block", "!s"],
  ult: ["!ult", "!ultimate"],
} as const;

/** All text/background pairs below meet WCAG AA (>= 4.5:1) on the opaque panel. */
const COLORS = {
  panel: "#19191b",
  border: "rgba(255, 255, 255, 0.12)",
  divider: "rgba(255, 255, 255, 0.08)",
  accent: "#9146FF",
  accentText: "#c4a3ff",
  text: "#ededed",
  muted: "#a1a1a6",
  chipBg: "rgba(255, 255, 255, 0.06)",
  chipBorder: "rgba(237, 237, 237, 0.16)",
  track: "rgba(161, 161, 166, 0.25)",
};

const TEXT_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.95), 0 0 6px rgba(0, 0, 0, 0.6)";

const KEYFRAMES = `
@keyframes cs-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes cs-enter {
  from { opacity: 0; transform: var(--cs-from); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
.cs-enter { animation: cs-enter 700ms cubic-bezier(0.22, 1, 0.36, 1) both; will-change: transform, opacity; }
.cs-progress { animation: cs-progress var(--cs-dur) linear both; will-change: transform; }
@media (prefers-reduced-motion: reduce) {
  .cs-enter, .cs-progress { animation: none !important; }
}
`;

function parseCorner(value: string | null): Corner {
  return value === "br" || value === "tl" || value === "tr" ? value : "bl";
}

function parseSlide(value: string | null): number | null {
  if (value === null || !/^[0-2]$/.test(value.trim())) return null;
  return Number(value.trim());
}

function Kbd({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return (
    <kbd
      className={`inline-flex h-7 items-center rounded-md border px-2.5 font-mono text-[15px] leading-none ${
        primary ? "font-bold" : "font-semibold"
      }`}
      style={
        primary
          ? {
              backgroundColor: COLORS.accent,
              borderColor: "rgba(255, 255, 255, 0.18)",
              color: COLORS.text,
              boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)",
            }
          : { backgroundColor: COLORS.chipBg, borderColor: COLORS.chipBorder, color: COLORS.accentText }
      }
    >
      {children}
    </kbd>
  );
}

function Cmd({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono font-bold" style={{ color: COLORS.accentText }}>
      {children}
    </span>
  );
}

function Row({ chips, children }: { chips: ReactNode; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">{chips}</div>
      <p className="text-pretty text-[15px] leading-relaxed" style={{ color: COLORS.muted }}>
        {children}
      </p>
    </li>
  );
}

function AliasChips({ list }: { list: readonly string[] }) {
  const [primary, ...aliases] = list;
  return (
    <>
      <Kbd primary>{primary}</Kbd>
      {aliases.length > 0 && <span className="sr-only">{`aliases: ${aliases.join(", ")}`}</span>}
      {aliases.map((a) => (
        <span key={a} aria-hidden="true" className="inline-flex">
          <Kbd>{a}</Kbd>
        </span>
      ))}
    </>
  );
}

type Slide = { label: string; title: string; highlight?: boolean; body: ReactNode };

const SLIDES: Slide[] = [
  {
    label: "Attack",
    title: "Fight the boss",
    body: (
      <ul className="flex flex-col gap-3.5">
        <Row chips={<AliasChips list={CMD.attack} />}>Hit the boss for damage. Crits happen!</Row>
        <Row chips={<AliasChips list={CMD.heal} />}>Heal the team and revive KO&apos;d raiders.</Row>
        <Row chips={<AliasChips list={CMD.shield} />}>Raise a shield before the boss strikes.</Row>
      </ul>
    ),
  },
  {
    label: "Combos & Bits",
    title: "Stack the damage",
    body: (
      <ul className="flex flex-col gap-3.5">
        <Row
          chips={
            <>
              <Kbd primary>PogChamp</Kbd>
              <Kbd>KEKW</Kbd>
              <Kbd>LUL</Kbd>
            </>
          }
        >
          Spam one emote, alone in your message. The more chat repeats the same emote, the bigger the combo.
        </Row>
        <Row
          chips={
            <>
              <Kbd primary>cheer100</Kbd>
              <Kbd>cheer500</Kbd>
            </>
          }
        >
          Cheer bits to land big damage on the boss.
        </Row>
      </ul>
    ),
  },
  {
    label: "Hype",
    title: "Unleash the ultimate",
    highlight: true,
    body: (
      <ul className="flex flex-col gap-3.5">
        <Row chips={<AliasChips list={CMD.ult} />}>
          Every action fills the team hype meter. At 100% hype anyone can fire the ult.
        </Row>
        <Row
          chips={
            <>
              <Kbd primary>!raid start</Kbd>
              <Kbd primary>!raid reset</Kbd>
            </>
          }
        >
          <span className="font-semibold" style={{ color: COLORS.accentText }}>
            Mods only:
          </span>{" "}
          start a new raid or reset the fight.
        </Row>
      </ul>
    ),
  },
];

const TIPS: { id: string; content: ReactNode }[] = [
  { id: "case", content: <>Commands are not case-sensitive.</> },
  {
    id: "shield",
    content: (
      <>
        Boss winding up? Type <Cmd>!s</Cmd> to shield.
      </>
    ),
  },
  {
    id: "combo",
    content: <>Same emote, alone in a message, builds combos.</>,
  },
  {
    id: "revive",
    content: (
      <>
        Knocked out? A teammate can <Cmd>!revive</Cmd> you.
      </>
    ),
  },
  {
    id: "ult",
    content: (
      <>
        Hype at 100%? Anyone can fire <Cmd>!ult</Cmd>.
      </>
    ),
  },
];

export default function CheatSheetOverlay() {
  const params = useSearchParams();
  const corner = parseCorner(params.get("pos"));
  const pinned = parseSlide(params.get("slide"));

  const [cycled, setCycled] = useState(0);
  const [tip, setTip] = useState(0);
  const active = pinned ?? cycled;

  useEffect(() => {
    if (pinned !== null) return;
    const id = window.setInterval(() => setCycled((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [pinned]);

  useEffect(() => {
    const id = window.setInterval(() => setTip((i) => (i + 1) % TIPS.length), TIP_MS);
    return () => window.clearInterval(id);
  }, []);

  const sectionStyle = {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    color: COLORS.text,
    textShadow: TEXT_SHADOW,
    boxShadow: "0 16px 48px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.5)",
    "--cs-from": ENTER_FROM[corner],
  } as CSSProperties;

  return (
    <main
      data-testid="overlay"
      className="pointer-events-none relative h-[1080px] w-[1920px] overflow-hidden bg-transparent font-sans"
    >
      <h1 className="sr-only">Raid chat command cheat sheet</h1>
      <style>{KEYFRAMES}</style>

      <section
        aria-label="Chat commands"
        className={`cs-enter absolute ${CORNER_CLASS[corner]} flex w-[460px] flex-col gap-5 overflow-hidden rounded-2xl border p-6`}
        style={sectionStyle}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ backgroundColor: COLORS.accent }}
        />

        <header className="flex items-center justify-between gap-3">
          <p
            className="text-[13px] font-bold uppercase leading-none tracking-[0.18em]"
            style={{ color: COLORS.accentText }}
          >
            Type in chat
          </p>
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="flex items-center gap-1.5">
              {SLIDES.map((slide, i) => {
                const isActive = i === active;
                return (
                  <span
                    key={slide.label}
                    className="relative h-1 w-6 overflow-hidden rounded-full"
                    style={{ backgroundColor: COLORS.track }}
                  >
                    {isActive && (
                      <span
                        key={`${active}-${pinned ?? "cycle"}`}
                        className={`absolute inset-0 origin-left rounded-full ${pinned === null ? "cs-progress" : ""}`}
                        style={{ backgroundColor: COLORS.accentText, "--cs-dur": `${SLIDE_MS}ms` } as CSSProperties}
                      />
                    )}
                  </span>
                );
              })}
            </div>
            <p className="font-mono text-[13px] font-semibold leading-none tabular-nums" style={{ color: COLORS.muted }}>
              {`${active + 1}/${SLIDES.length}`}
            </p>
          </div>
        </header>

        <div className="grid">
          {SLIDES.map((slide, i) => {
            const isActive = i === active;
            return (
              <div
                key={slide.label}
                aria-hidden={!isActive}
                className="flex flex-col gap-4 transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform] motion-reduce:transition-none"
                style={{
                  gridArea: "1 / 1",
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translate3d(0, 0, 0)" : "translate3d(0, 8px, 0)",
                }}
              >
                <div className="flex items-baseline gap-3">
                  <h2
                    className="text-balance text-[26px] font-black uppercase leading-none tracking-tight"
                    style={{ color: slide.highlight ? COLORS.accentText : COLORS.text }}
                  >
                    {slide.label}
                  </h2>
                  <span className="text-[15px] font-medium leading-none" style={{ color: COLORS.muted }}>
                    {slide.title}
                  </span>
                </div>
                {slide.body}
              </div>
            );
          })}
        </div>

        <footer className="flex items-center gap-3 border-t pt-4" style={{ borderColor: COLORS.divider }}>
          <span
            className="shrink-0 rounded px-1.5 py-1 text-[13px] font-bold uppercase leading-none tracking-[0.14em]"
            style={{ backgroundColor: COLORS.chipBg, color: COLORS.accentText }}
          >
            Tip
          </span>
          <div className="grid min-w-0 flex-1">
            {TIPS.map((t, i) => {
              const isActive = i === tip;
              return (
                <p
                  key={t.id}
                  aria-hidden={!isActive}
                  className="text-[14px] font-medium leading-relaxed transition-opacity duration-700 ease-in-out will-change-[opacity] motion-reduce:transition-none"
                  style={{ gridArea: "1 / 1", opacity: isActive ? 1 : 0, color: COLORS.text }}
                >
                  {t.content}
                </p>
              );
            })}
          </div>
        </footer>
      </section>
    </main>
  );
}
