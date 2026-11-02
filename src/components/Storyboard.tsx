"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ComponentType,
  type ReactNode,
} from "react";
import { BossArt } from "@/components/BossArt";

const FRAME_MS = 2200;

const CAPTIONS = [
  "Streamer pastes one URL into OBS",
  "Chat types !atk",
  "The boss takes hits",
  "Enraged at 50%",
  "Combo + Bits burst",
  "Victory: MVP · Medic · Tank",
] as const;

const SHORT_LABELS = ["OBS", "Chat", "Fight", "Enraged", "Combo", "Victory"] as const;

const FRAME_COUNT = CAPTIONS.length;

const ROOT_W = 1200;
const ROOT_H = 675;
const FOOTER_H = 136;
const STAGE_H = ROOT_H - FOOTER_H;
const THUMB_W = 100;
const THUMB_SCALE = THUMB_W / ROOT_W;
const THUMB_H = Math.round(STAGE_H * THUMB_SCALE);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Every animation uses `both` fill and each element's resting style equals its final keyframe,
// so a pinned frame (?frame=N), a filmstrip thumbnail, or a reduced-motion render shows the finished composition.
const STORYBOARD_CSS = `
@keyframes sb-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes sb-pop{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
@keyframes sb-dmg{0%{opacity:0;transform:translate(0,28px) scale(.5)}18%{opacity:1;transform:translate(0,0) scale(1.2)}100%{opacity:1;transform:translate(var(--dx,0px),-44px) scale(1)}}
@keyframes sb-drain{from{transform:scaleX(var(--from))}to{transform:scaleX(var(--to))}}
@keyframes sb-type{from{transform:translateX(0)}to{transform:translateX(100%)}}
@keyframes sb-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes sb-cursor{0%{opacity:0;transform:translate(-300px,-210px)}15%{opacity:1}70%{opacity:1;transform:translate(0,0) scale(1)}80%{transform:translate(0,0) scale(.82)}90%,100%{opacity:1;transform:translate(0,0) scale(1)}}
@keyframes sb-press{0%,100%{transform:scale(1)}50%{transform:scale(.92)}}
@keyframes sb-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-8px,3px) rotate(-1.5deg)}50%{transform:translate(7px,-2px) rotate(1deg)}75%{transform:translate(-3px,1px)}}
@keyframes sb-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes sb-throb{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes sb-flash{0%{opacity:0;transform:scale(1.5)}20%{opacity:1;transform:scale(1)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.96)}}
@keyframes sb-gem{0%{opacity:0;transform:translate(0,0) rotate(45deg) scale(.2)}30%{opacity:1}100%{opacity:1;transform:translate(var(--x),var(--y)) rotate(45deg) scale(1)}}
@keyframes sb-podium{from{transform:translateY(100%)}to{transform:none}}
@keyframes sb-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.sb-thumb,.sb-thumb *,.sb-thumb *::before,.sb-thumb *::after{animation:none!important;transition:none!important}
@media (prefers-reduced-motion:reduce){.sb-root *,.sb-root *::before,.sb-root *::after{animation:none!important;transition:none!important}}
`;

const EASE = "cubic-bezier(.2,.8,.2,1)";

function play(name: string, duration: number, delay = 0, easing = EASE, iterations: number | "infinite" = 1): CSSProperties {
  return { animation: `${name} ${duration}s ${easing} ${delay}s ${iterations} both` };
}

function vars(values: Record<string, string | number>): CSSProperties {
  return values as CSSProperties;
}

function wrap(n: number) {
  return ((n % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
}

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export default function Storyboard({ frame = null, auto = true }: { frame?: number | null; auto?: boolean }) {
  const pinned = frame !== null;
  const reducedMotion = usePrefersReducedMotion();
  const [tick, setTick] = useState(frame ?? 0);
  const [playPreference, setPlayPreference] = useState<boolean | null>(null);
  const running = playPreference ?? (auto && !pinned && !reducedMotion);

  const index = wrap(tick);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusThumbOnChange = useRef(false);

  // Ticks only move forward so the target frame's visit count always increments and its entrance replays.
  const goTo = useCallback((target: number) => {
    setTick((t) => t + ((wrap(target) - wrap(t) + FRAME_COUNT) % FRAME_COUNT));
  }, []);

  const step = useCallback((direction: 1 | -1) => {
    setTick((t) => t + (direction === 1 ? 1 : FRAME_COUNT - 1));
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setTick((t) => t + 1), FRAME_MS);
    return () => window.clearTimeout(id);
  }, [running, tick]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => step(1),
        ArrowLeft: () => step(-1),
        Home: () => goTo(0),
        End: () => goTo(FRAME_COUNT - 1),
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      focusThumbOnChange.current = thumbRefs.current.some((el) => el !== null && el === document.activeElement);
      action();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goTo, step]);

  useEffect(() => {
    if (!focusThumbOnChange.current) return;
    focusThumbOnChange.current = false;
    thumbRefs.current[index]?.focus();
  }, [index]);

  return (
    <main
      data-testid="storyboard"
      data-frame={index}
      data-playing={running}
      className="sb-root relative shrink-0 overflow-hidden bg-[#141415] font-sans text-[#ededed] antialiased"
      style={{ width: ROOT_W, height: ROOT_H }}
    >
      <style>{STORYBOARD_CSS}</style>
      <h1 className="sr-only">
        {"Raid boss overlay storyboard: "}
        {CAPTIONS.join(", ")}
      </h1>

      <div
        className="absolute inset-x-0 top-0"
        style={{ height: STAGE_H }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Storyboard frames"
      >
        {FRAME_VIEWS.map((FrameView, i) => {
          const active = i === index;
          // Remount a frame's content each time it becomes active so its entrance animations replay.
          const visit = tick >= i ? Math.floor((tick - i) / FRAME_COUNT) : -1;
          return (
            <section
              key={i}
              aria-hidden={!active}
              inert={!active}
              aria-roledescription="slide"
              aria-label={`Frame ${i + 1} of ${FRAME_COUNT}: ${CAPTIONS[i]}`}
              className="absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? "none" : "scale(.985)",
                zIndex: active ? 1 : 0,
              }}
            >
              <div key={visit} className="h-full w-full">
                <FrameView />
              </div>
            </section>
          );
        })}
      </div>

      <ControlBar
        index={index}
        tick={tick}
        running={running}
        onToggle={() => setPlayPreference(!running)}
        onSelect={goTo}
        thumbRefs={thumbRefs}
      />
    </main>
  );
}

function ControlBar({
  index,
  tick,
  running,
  onToggle,
  onSelect,
  thumbRefs,
}: {
  index: number;
  tick: number;
  running: boolean;
  onToggle: () => void;
  onSelect: (i: number) => void;
  thumbRefs: React.RefObject<(HTMLButtonElement | null)[]>;
}) {
  return (
    <footer
      className="absolute inset-x-0 bottom-0 flex items-center gap-7 border-t border-[#36363a] bg-[#19191b] px-10"
      style={{ height: FOOTER_H }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] tabular-nums text-[#a1a1a6]">
          {`Frame ${index + 1} / ${FRAME_COUNT}`}
        </span>
        <p key={tick} aria-hidden="true" className="text-balance text-2xl font-bold leading-tight tracking-tight" style={play("sb-rise", 0.45)}>
          {CAPTIONS[index]}
        </p>
        <p className="sr-only" aria-live={running ? "off" : "polite"} aria-atomic="true">
          {`Frame ${index + 1} of ${FRAME_COUNT}: ${CAPTIONS[index]}`}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={running ? "Pause autoplay" : "Play autoplay"}
        className="flex h-11 shrink-0 items-center gap-2 rounded-lg border border-[#5c5c63] bg-[#232325] px-4 text-sm font-bold text-[#ededed] outline-none transition-colors hover:border-[#c4a3ff] hover:bg-[#241a40] focus-visible:ring-2 focus-visible:ring-[#c4a3ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#19191b]"
      >
        {running ? (
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
            <rect x="3" y="2" width="3.5" height="12" rx="1" />
            <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
            <path d="M4 2.5v11a1 1 0 0 0 1.5.86l9-5.5a1 1 0 0 0 0-1.72l-9-5.5A1 1 0 0 0 4 2.5Z" />
          </svg>
        )}
        <span>{running ? "Pause" : "Play"}</span>
      </button>

      <nav aria-label="Storyboard frames" aria-keyshortcuts="ArrowLeft ArrowRight Home End">
        <ol className="flex gap-2">
          {FRAME_VIEWS.map((FrameView, i) => (
            <Thumbnail
              key={i}
              i={i}
              index={index}
              tick={tick}
              running={running}
              onSelect={onSelect}
              buttonRef={(el) => {
                thumbRefs.current[i] = el;
              }}
            >
              <FrameView />
            </Thumbnail>
          ))}
        </ol>
      </nav>
    </footer>
  );
}

function Thumbnail({
  i,
  index,
  tick,
  running,
  onSelect,
  buttonRef,
  children,
}: {
  i: number;
  index: number;
  tick: number;
  running: boolean;
  onSelect: (i: number) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
  children: ReactNode;
}) {
  const active = i === index;
  const done = i < index;
  return (
    <li className="group relative flex flex-col gap-1.5" style={{ width: THUMB_W }}>
      <div
        aria-hidden="true"
        className={`relative overflow-hidden rounded-md border-2 bg-[#141415] transition-[opacity,transform] duration-300 ${
          active ? "border-[#c4a3ff] opacity-100" : "border-[#36363a] opacity-60 group-hover:opacity-90"
        }`}
        style={{ width: THUMB_W, height: THUMB_H + 4 }}
      >
        <div
          className="sb-thumb pointer-events-none absolute top-0 left-0 origin-top-left"
          style={{ width: ROOT_W, height: STAGE_H, transform: `scale(${(THUMB_W - 4) / ROOT_W})` }}
        >
          {children}
        </div>
      </div>

      <div aria-hidden="true" className="flex items-center gap-1.5 text-sm font-semibold leading-none">
        <span className={`tabular-nums ${active ? "text-[#c4a3ff]" : "text-[#a1a1a6]"}`}>{i + 1}</span>
        <span className={`truncate ${active ? "text-[#ededed]" : "text-[#a1a1a6]"}`}>{SHORT_LABELS[i]}</span>
      </div>

      <span aria-hidden="true" className="block h-1 w-full overflow-hidden rounded-full bg-[#36363a]">
        {(active || done) && (
          <span
            key={active ? tick : "done"}
            className="block h-full w-full origin-left rounded-full bg-[#9146FF]"
            style={active && running ? play("sb-grow", FRAME_MS / 1000, 0, "linear") : undefined}
          />
        )}
      </span>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => onSelect(i)}
        aria-current={active ? "step" : undefined}
        aria-label={`Frame ${i + 1}: ${CAPTIONS[i]}`}
        className="absolute -inset-1 z-10 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#c4a3ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#19191b]"
      />
    </li>
  );
}

function FrameIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex max-w-[400px] flex-col gap-4">
      <h2 className="text-balance text-5xl font-black leading-[1.05] tracking-tight" style={play("sb-rise", 0.5, 0.05)}>
        {title}
      </h2>
      <p className="text-pretty text-lg leading-relaxed text-[#a1a1a6]" style={play("sb-rise", 0.5, 0.18)}>
        {body}
      </p>
    </div>
  );
}

/* ---------- Frame 1: OBS ---------- */

const OVERLAY_URL = "https://your-app.vercel.app/overlay/yourchannel";

function ObsFrame() {
  return (
    <div className="flex h-full items-center justify-between gap-12 px-16">
      <FrameIntro title="Add a Browser Source" body="Paste the overlay URL, size it 1920×1080, hit OK. No plugin, no bot account, no install." />

      <div className="relative w-[620px]" style={play("sb-rise", 0.5, 0)}>
        <div className="overflow-hidden rounded-xl border border-[#36363a] bg-[#19191b] shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-[#36363a] bg-[#19191b] px-4 py-3">
            <span className="text-sm font-semibold text-[#a1a1a6]">{"Properties for 'Raid Boss'"}</span>
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#36363a]" />
              <span className="h-3 w-3 rounded-full bg-[#36363a]" />
              <span className="h-3 w-3 rounded-full bg-[#36363a]" />
            </span>
          </div>

          <div className="flex flex-col gap-4 p-6">
            <ObsRow label="URL">
              <div className="relative flex h-11 flex-1 items-center overflow-hidden rounded-md border-2 border-[#9146FF] bg-[#232325] px-3">
                <span className="relative overflow-hidden whitespace-nowrap font-mono text-[15px] text-[#ededed]">
                  {OVERLAY_URL}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#232325]"
                    style={{ transform: "translateX(100%)", ...play("sb-type", 0.9, 0.15, "steps(34)") }}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="ml-0.5 h-5 w-0.5 bg-[#c4a3ff]"
                  style={play("sb-blink", 0.8, 0, "linear", "infinite")}
                />
              </div>
            </ObsRow>
            <div className="flex gap-4">
              <ObsRow label="Width">
                <ObsField value="1920" />
              </ObsRow>
              <ObsRow label="Height">
                <ObsField value="1080" />
              </ObsRow>
            </div>
            <div className="flex items-center gap-3 pl-[76px] text-sm text-[#a1a1a6]">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#9146FF] text-white" aria-hidden="true">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Refresh browser when scene becomes active
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#36363a] px-6 py-4">
            <span className="rounded-md border border-[#36363a] px-5 py-2 text-sm font-semibold text-[#a1a1a6]">Cancel</span>
            <span className="relative rounded-md bg-[#9146FF] px-7 py-2 text-sm font-bold text-white" style={play("sb-press", 0.22, 1.4)}>
              OK
              <svg
                aria-hidden="true"
                viewBox="0 0 16 24"
                className="absolute top-4 left-8 h-7 w-5 drop-shadow"
                style={play("sb-cursor", 1.6, 0.2, "cubic-bezier(.4,0,.2,1)")}
              >
                <path d="M1 1v18l5-5 4 9 3-1.4-4-8.6h7z" fill="#ededed" stroke="#141415" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <div
          className="absolute -bottom-14 left-0 flex items-center gap-2 rounded-full border border-[#9146FF]/60 bg-[#9146FF]/15 px-4 py-2 text-sm font-semibold text-[#e6d8ff]"
          style={play("sb-pop", 0.45, 1.65)}
        >
          <span className="h-2 w-2 rounded-full bg-[#5dfc9a]" aria-hidden="true" />
          Overlay live on #yourchannel
        </div>
      </div>
    </div>
  );
}

function ObsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center gap-4">
      <span className="w-[60px] text-right text-sm font-semibold text-[#a1a1a6]">{label}</span>
      {children}
    </div>
  );
}

function ObsField({ value }: { value: string }) {
  return (
    <span className="flex h-11 flex-1 items-center rounded-md border border-[#36363a] bg-[#232325] px-3 font-mono text-[15px] tabular-nums">
      {value}
    </span>
  );
}

/* ---------- Frame 2: Chat ---------- */

const EMOTES = new Set(["Pog", "KEKW", "HYPE"]);

const CHAT = [
  { user: "pixelpanda", color: "#ff8a5c", text: "!atk" },
  { user: "NightOwl_TV", color: "#5cb8ff", text: "!atk !atk" },
  { user: "medic_mae", color: "#2ee59d", text: "!heal" },
  { user: "glitchgoblin", color: "#ff7ac6", text: "Pog Pog Pog" },
  { user: "tankytom", color: "#f5c542", text: "!block" },
  { user: "ser_lagsalot", color: "#c4a3ff", text: "!atk KEKW" },
  { user: "bigspender", color: "#ff8a5c", text: "LETS GO !atk" },
  { user: "mod_moss", color: "#2ee59d", text: "HYPE HYPE HYPE" },
  { user: "quietlurker", color: "#5cb8ff", text: "!atk" },
];

const COMMANDS = [
  { cmd: "!atk", desc: "hit the boss" },
  { cmd: "!heal", desc: "patch up the raid" },
  { cmd: "!block", desc: "soak the next swing" },
];

function ChatToken({ word }: { word: string }) {
  if (word.startsWith("!")) {
    return (
      <span className="rounded border border-[#9146FF]/70 bg-[#9146FF]/25 px-1.5 font-mono font-bold text-[#efe2ff]">{word}</span>
    );
  }
  if (EMOTES.has(word)) {
    return <span className="rounded-md bg-[#f5c542] px-1.5 py-0.5 text-xs font-black text-[#1a0b2e]">{word}</span>;
  }
  return <span>{word}</span>;
}

function ChatFrame() {
  return (
    <div className="flex h-full items-center justify-between gap-12 px-16">
      <div className="flex flex-col gap-8">
        <FrameIntro title="Chat is the controller" body="Viewers just type. Every message is a move." />
        <ul className="flex flex-col gap-3">
          {COMMANDS.map(({ cmd, desc }, i) => (
            <li key={cmd} className="flex items-center gap-4" style={play("sb-rise", 0.45, 0.3 + i * 0.15)}>
              <span className="w-[120px] rounded-lg bg-[#9146FF] py-2 text-center font-mono text-2xl font-bold text-white">{cmd}</span>
              <span className="text-lg text-[#a1a1a6]">{desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="flex h-[500px] w-[420px] flex-col overflow-hidden rounded-xl border border-[#36363a] bg-[#19191b]"
        style={play("sb-rise", 0.5, 0)}
      >
        <div className="border-b border-[#36363a] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#a1a1a6]">
          Stream chat
        </div>
        <ol className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden px-5 py-4">
          {CHAT.map((msg, i) => (
            <li
              key={msg.user + i}
              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[17px] leading-relaxed"
              style={play("sb-rise", 0.35, 0.15 + i * 0.14)}
            >
              <span className="font-bold" style={{ color: msg.color }}>
                {msg.user}
              </span>
              <span className="text-[#a1a1a6]">:</span>
              {msg.text.split(" ").map((word, w) => (
                <ChatToken key={w} word={word} />
              ))}
            </li>
          ))}
        </ol>
        <div className="border-t border-[#36363a] p-3">
          <div className="flex h-11 items-center rounded-md border-2 border-[#9146FF] bg-[#232325] px-3">
            <span className="relative overflow-hidden font-mono text-base font-bold">
              !atk
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[#232325]"
                style={{ transform: "translateX(100%)", ...play("sb-type", 0.4, 1.45, "steps(4)") }}
              />
            </span>
            <span aria-hidden="true" className="ml-0.5 h-5 w-0.5 bg-[#c4a3ff]" style={play("sb-blink", 0.8, 0, "linear", "infinite")} />
            <span className="ml-auto rounded bg-[#9146FF] px-3 py-1 text-xs font-bold text-white">Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Frames 3 + 4: Fight ---------- */

function HpBar({
  from,
  to,
  current,
  fill,
  badge,
}: {
  from: number;
  to: number;
  current: string;
  fill: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex w-[760px] flex-col gap-2" style={play("sb-rise", 0.4, 0)}>
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black uppercase tracking-wide">Lag Wyrm</span>
          {badge}
        </div>
        <span className="font-mono text-base font-semibold tabular-nums text-[#a1a1a6]">{`HP ${current} / 10,000`}</span>
      </div>
      <div className="relative h-6 overflow-hidden rounded-full border-2 border-[#36363a] bg-[#19191b]">
        <div
          className="absolute inset-0 origin-left rounded-full"
          style={{
            background: fill,
            ...vars({ "--from": from, "--to": to }),
            transform: `scaleX(${to})`,
            ...play("sb-drain", 1.6, 0.3, "cubic-bezier(.3,0,.2,1)"),
          }}
        />
        <span className="absolute inset-y-0 left-1/2 w-0.5 bg-[#ededed]/50" aria-hidden="true" />
      </div>
    </div>
  );
}

const HITS = [
  { value: "-128", user: "pixelpanda", left: 40, top: 120, dx: -20, delay: 0.3 },
  { value: "-96", user: "NightOwl_TV", left: 300, top: 80, dx: 24, delay: 0.65 },
  { value: "CRIT -312", user: "ser_lagsalot", left: 250, top: 230, dx: 30, delay: 1.0, crit: true },
  { value: "-64", user: "glitchgoblin", left: 10, top: 260, dx: -26, delay: 1.35 },
  { value: "-140", user: "quietlurker", left: 160, top: 20, dx: 0, delay: 1.7 },
];

function FightFrame() {
  const shakes = HITS.map((h) => `sb-shake .28s ease-out ${h.delay}s 1 both`).join(", ");
  return (
    <div className="flex h-full flex-col items-center gap-4 pt-8">
      <HpBar from={1} to={0.78} current="7,820" fill="#9146FF" />
      <div className="relative h-[420px] w-[420px]">
        <div className="h-full w-full" style={{ animation: shakes }}>
          <BossArt phase="fight" hit={0} variant="lag-wyrm" />
        </div>
        {HITS.map((h) => (
          <div
            key={h.value}
            aria-hidden="true"
            className="absolute flex flex-col items-center"
            style={{
              left: h.left,
              top: h.top,
              ...vars({ "--dx": `${h.dx}px` }),
              transform: `translate(${h.dx}px,-44px)`,
              ...play("sb-dmg", 1.1, h.delay, "cubic-bezier(.2,.9,.3,1)"),
            }}
          >
            <span
              className={`whitespace-nowrap font-black tabular-nums [text-shadow:0_3px_0_#1a0b2e,0_0_18px_rgba(145,70,255,.8)] ${
                h.crit ? "text-5xl text-[#f5c542]" : "text-4xl text-[#ededed]"
              }`}
            >
              {h.value}
            </span>
            <span className="rounded bg-[#141415]/80 px-1.5 text-sm font-semibold text-[#a1a1a6]">{h.user}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnragedFrame() {
  return (
    <div className="relative flex h-full flex-col items-center gap-4 pt-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_40%,rgba(255,59,59,.28)_100%)]"
        style={play("sb-pulse", 1.1, 0, "ease-in-out", "infinite")}
      />
      <HpBar
        from={0.56}
        to={0.5}
        current="5,000"
        fill="#ff3b4e"
        badge={
          <span
            className="rounded-md bg-[#ff3b4e] px-2.5 py-1 text-sm font-black uppercase tracking-widest text-[#141415]"
            style={play("sb-throb", 0.7, 0.4, "ease-in-out", "infinite")}
          >
            Enraged
          </span>
        }
      />
      <div className="relative flex w-full items-center justify-center gap-10">
        <EnragedCallout delay={0.7} title="It hits back harder" body="Raid HP is on the line." />
        <div className="h-[420px] w-[420px]" style={play("sb-pop", 0.5, 0.15)}>
          <div className="h-full w-full" style={{ animation: "sb-shake .3s ease-out 0.6s 3 both" }}>
            <BossArt phase="enraged" hit={0} variant="lag-wyrm" />
          </div>
        </div>
        <EnragedCallout delay={1.0} title="Chat adapts" body={<><ChatToken word="!heal" /> and <ChatToken word="!block" /> spike.</>} />
      </div>
    </div>
  );
}

function EnragedCallout({ title, body, delay }: { title: string; body: ReactNode; delay: number }) {
  return (
    <div className="flex w-[230px] flex-col gap-2 rounded-xl border border-[#ff3b4e]/50 bg-[#1a0910]/80 p-5" style={play("sb-rise", 0.45, delay)}>
      <span className="text-xl font-bold">{title}</span>
      <span className="flex flex-wrap items-center gap-1.5 text-base leading-relaxed text-[#e6cfd4]">{body}</span>
    </div>
  );
}

/* ---------- Frame 5: Combo + Bits ---------- */

const COMBO_STEPS = [39, 40, 41];
const GEMS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const radius = i % 2 === 0 ? 190 : 150;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius * 0.7), delay: 0.85 + (i % 4) * 0.05 };
});

function ComboFrame() {
  return (
    <div className="flex h-full items-center justify-between gap-10 px-20">
      <div className="flex flex-col gap-2">
        <span className="text-lg font-bold uppercase tracking-[0.3em] text-[#c4a3ff]" style={play("sb-rise", 0.4, 0)}>
          Combo
        </span>
        <div className="grid font-black leading-none tabular-nums" role="img" aria-label="Combo x42">
          {COMBO_STEPS.map((n, i) => (
            <span
              key={n}
              aria-hidden="true"
              className="[grid-area:1/1] text-[200px] text-[#ededed]"
              style={{ opacity: 0, ...play("sb-flash", 0.3, 0.1 + i * 0.25, "ease-out") }}
            >
              <span className="text-[110px] text-[#9146FF]">x</span>
              {n}
            </span>
          ))}
          <span
            aria-hidden="true"
            className="[grid-area:1/1] text-[200px] text-[#ededed] [text-shadow:0_0_40px_rgba(145,70,255,.7)]"
            style={play("sb-pop", 0.45, 0.85)}
          >
            <span className="text-[110px] text-[#9146FF]">x</span>
            42
          </span>
        </div>
        <span className="max-w-[360px] text-pretty text-lg leading-relaxed text-[#a1a1a6]" style={play("sb-rise", 0.4, 0.3)}>
          {"Chain !atk without a break and the multiplier keeps climbing."}
        </span>
      </div>

      <div className="relative flex w-[440px] flex-col items-center gap-6">
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2">
          {GEMS.map((g, i) => (
            <span
              key={i}
              className="absolute -mt-2.5 -ml-2.5 h-5 w-5 rounded-sm border-2 border-[#1a0b2e] bg-[#f5c542]"
              style={{
                ...vars({ "--x": `${g.x}px`, "--y": `${g.y}px` }),
                transform: `translate(${g.x}px,${g.y}px) rotate(45deg)`,
                ...play("sb-gem", 0.7, g.delay, "cubic-bezier(.1,.9,.3,1)"),
              }}
            />
          ))}
        </div>

        <div className="relative w-full rounded-xl border border-[#f5c542]/60 bg-[#151008] p-5" style={play("sb-rise", 0.45, 0.2)}>
          <div className="flex items-center gap-3">
            <span className="h-6 w-6 rotate-45 rounded-sm border-2 border-[#1a0b2e] bg-[#f5c542]" aria-hidden="true" />
            <span className="text-lg">
              <span className="font-bold text-[#ff8a5c]">bigspender</span>
              {" cheered "}
              <span className="font-black text-[#f5c542]">500 bits</span>
            </span>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[17px] leading-relaxed text-[#a1a1a6]">
            <span className="font-bold text-[#f5c542]">Cheer500</span> finish it chat <ChatToken word="!atk" />
          </p>
        </div>

        <div
          className="relative flex flex-col items-center rounded-2xl bg-[#f5c542] px-10 py-5 text-[#1a0b2e]"
          style={play("sb-pop", 0.5, 0.8)}
        >
          <span className="text-sm font-black uppercase tracking-[0.3em]">Bits burst</span>
          <span className="text-6xl font-black tabular-nums">+2,500</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Frame 6: Victory ---------- */

const PODIUM = [
  { role: "Medic", rank: 2, user: "medic_mae", stat: "1,120 healed", color: "#2ee59d", height: 150, delay: 0.35 },
  { role: "MVP", rank: 1, user: "pixelpanda", stat: "4,812 damage", color: "#f5c542", height: 215, delay: 0.15 },
  { role: "Tank", rank: 3, user: "tankytom", stat: "37 hits blocked", color: "#5cb8ff", height: 115, delay: 0.55 },
];

function VictoryFrame() {
  return (
    <div className="flex h-full flex-col items-center pt-8">
      <div className="flex items-center gap-5" style={play("sb-rise", 0.45, 0)}>
        <div className="h-[96px] w-[96px]">
          <BossArt phase="victory" hit={0} variant="lag-wyrm" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-5xl font-black tracking-tight">Lag Wyrm defeated</h2>
          <p className="text-lg text-[#a1a1a6]">Cleared in 3:42 by 214 chatters</p>
        </div>
      </div>

      <ol className="mt-auto flex items-end gap-4">
        {PODIUM.map((p) => {
          const mvp = p.rank === 1;
          return (
            <li key={p.role} className="flex w-[250px] flex-col items-center gap-3" aria-label={`${p.role}: ${p.user}, ${p.stat}`}>
              <div className="flex flex-col items-center gap-1" style={play("sb-pop", 0.45, p.delay + 0.45)}>
                <span
                  className={`flex items-center justify-center rounded-full border-4 font-black text-[#1a0b2e] ${mvp ? "h-20 w-20 text-3xl" : "h-16 w-16 text-2xl"}`}
                  style={{ background: p.color, borderColor: "#141415", boxShadow: `0 0 0 3px ${p.color}` }}
                  aria-hidden="true"
                >
                  {p.user.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xl font-bold">{p.user}</span>
                <span className="text-base tabular-nums text-[#a1a1a6]">{p.stat}</span>
              </div>
              <div className="w-full overflow-hidden" style={{ height: p.height }}>
                <div
                  className="flex h-full w-full flex-col items-center gap-1 rounded-t-xl border-x-2 border-t-2 pt-4"
                  style={{
                    borderColor: p.color,
                    background: mvp ? "#9146FF" : "#19191b",
                    ...play("sb-podium", 0.55, p.delay, "cubic-bezier(.2,.9,.3,1.1)"),
                  }}
                >
                  <span className="text-3xl font-black uppercase tracking-wide" style={{ color: mvp ? "#ffffff" : p.color }}>
                    {p.role}
                  </span>
                  <span className={`text-sm font-bold ${mvp ? "text-[#ededed]" : "text-[#a1a1a6]"}`}>{`#${p.rank}`}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const FRAME_VIEWS: readonly ComponentType[] = [ObsFrame, ChatFrame, FightFrame, EnragedFrame, ComboFrame, VictoryFrame];
