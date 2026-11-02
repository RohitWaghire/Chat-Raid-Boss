"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { Arena } from "@/components/Arena";
import { useRaid } from "@/lib/useRaid";
import type { GameConfig, Phase } from "@/lib/types";

type Scene = 0 | 1 | 2;

const STAGE_W = 1920;
const STAGE_H = 1080;
const SCENE_MS: Record<Scene, number> = { 0: 5_000, 1: 30_000, 2: 8_000 };
/** How long the end screen stays up once the fight resolves. */
const END_HOLD_MS = 5_000;
const MIN_END_HOLD_MS = 2_500;
const PINNED_RESTART_MS = 6_000;
const OVERLAY_PATH = "/?channel=yourchannel";
const COMMANDS = ["!atk", "!heal", "!shield", "!ult"] as const;

// Module-level so its identity is stable: useRaid resets the game whenever config changes.
const DEMO_CONFIG: GameConfig = {
  bossName: "The Lag Wyrm",
  bossHp: 4000,
  hpPerRaider: 20,
  durationSec: 40,
  bossAttackEverySec: 5,
  cooldownMs: 0,
};

const CAPTIONS: Record<Phase, { tag: string; text: string }> = {
  lobby: { tag: "How it works", text: "Chat types !atk to hit" },
  fight: { tag: "How it works", text: "Chat types !atk to hit" },
  enraged: { tag: "Phase 2", text: "Boss enrages at 50%" },
  desperate: { tag: "Phase 3", text: "Desperate at 20% — finish it!" },
  victory: { tag: "Victory", text: "Victory: MVP, Medic, Tank awards" },
  defeat: { tag: "Defeat", text: "The boss survives — chat runs it back" },
};

function parseScene(v: string | null): Scene | null {
  return v === "0" || v === "1" || v === "2" ? (Number(v) as Scene) : null;
}

function useFitScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}

const noopSubscribe = () => () => {};
function useHost() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.host,
    () => "your-app.vercel.app",
  );
}

export default function AttractMode() {
  const params = useSearchParams();
  const pinned = parseScene(params.get("scene"));
  const loop = params.get("loop") !== "0";

  const { state, status, narrator, now, start, reset, over } = useRaid({
    channel: "",
    demo: true,
    config: DEMO_CONFIG,
    autostart: true,
    narrate: false,
    demoRate: 12,
  });

  const [scene, setScene] = useState<Scene>(pinned ?? 0);
  const [pass, setPass] = useState(0);
  const [stopped, setStopped] = useState(false);
  const sceneStartedAt = useRef(0);
  const mounted = useRef(false);
  const scale = useFitScale();

  // Entering the demo always starts a fresh fight; the title card idles in the lobby.
  useEffect(() => {
    sceneStartedAt.current = Date.now();
    const first = !mounted.current;
    mounted.current = true;
    if (scene === 1) {
      reset();
      start();
    } else if (scene === 0 || first) {
      reset();
    }
  }, [scene, pass, reset, start]);

  const demoOver = scene === 1 && over;

  useEffect(() => {
    if (pinned !== null || stopped) return;
    let ms = SCENE_MS[scene];
    if (demoOver) {
      const remaining = SCENE_MS[1] - (Date.now() - sceneStartedAt.current);
      ms = Math.min(END_HOLD_MS, Math.max(MIN_END_HOLD_MS, remaining));
    }
    const id = setTimeout(() => {
      if (scene === 0) return setScene(1);
      if (scene === 1) return setScene(2);
      if (!loop) return setStopped(true);
      reset();
      setScene(0);
      setPass((p) => p + 1);
    }, ms);
    return () => clearTimeout(id);
  }, [scene, demoOver, pinned, stopped, loop, reset]);

  // ?scene=1 keeps replaying the fight on its own.
  useEffect(() => {
    if (pinned !== 1 || !demoOver || !loop) return;
    const id = setTimeout(() => setPass((p) => p + 1), PINNED_RESTART_MS);
    return () => clearTimeout(id);
  }, [pinned, demoOver, loop]);

  const caption = CAPTIONS[state.phase];
  // Remount the lower third when the demo is entered (so it animates in view), but not when leaving it.
  const lowerThirdKey = `${pass}-${scene === 0 ? "pre" : "in"}-${caption.text}`;

  return (
    <main
      data-testid="attract"
      data-scene={scene}
      className="fixed inset-0 overflow-hidden bg-[#141415] font-sans text-[#ededed] antialiased"
    >
      <style>{KEYFRAMES}</style>
      <h1 className="sr-only">Chat Raid Boss — attract mode demo loop</h1>

      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        <SceneLayer active={scene === 0} label="Title">
          <TitleCard key={scene === 0 ? `title-${pass}` : "title-idle"} />
        </SceneLayer>

        <SceneLayer active={scene === 1} label="Live demo">
          <div className="absolute left-16 top-24 w-[1280px] origin-top-left overflow-hidden rounded-3xl bg-black/70" style={{ transform: "scale(1.4)" }}>
            <Arena state={state} status={status} narrator={narrator} channel="" now={now} />
          </div>
          <div className="pointer-events-none absolute left-12 top-10 flex items-center gap-3 rounded-full bg-[#141415]/85 px-5 py-2.5 text-lg font-semibold tracking-wide text-[#ededed] ring-1 ring-[#9146FF]/50">
            <span className="ar-anim ar-pulse h-2.5 w-2.5 rounded-full bg-[#9146FF]" aria-hidden="true" />
            Live demo · simulated chat at 12 msg/s
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {`${caption.tag}: ${caption.text}`}
          </p>
          <LowerThird key={lowerThirdKey} tag={caption.tag} text={caption.text} />
        </SceneLayer>

        <SceneLayer active={scene === 2} label="Setup">
          <OutroCard key={scene === 2 ? `outro-${pass}` : "outro-idle"} />
        </SceneLayer>

        {pinned === null && <SceneProgress scene={scene} pass={pass} stopped={stopped} />}
      </div>
    </main>
  );
}

function SceneLayer({ active, label, children }: { active: boolean; label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      aria-hidden={!active}
      inert={!active}
      data-active={active}
      className={`ar-layer absolute inset-0 ${active ? "" : "pointer-events-none"}`}
    >
      {children}
    </section>
  );
}

/**
 * Transform-only entrance: content slides up from behind a clipping mask, so any visible
 * glyph is always rendered at full opacity (and full contrast).
 */
function Reveal({
  children,
  delay = 0,
  from,
  className = "",
  maskClassName = "",
}: {
  children: ReactNode;
  delay?: number;
  from?: string;
  className?: string;
  maskClassName?: string;
}) {
  const style = { animationDelay: `${delay}ms` } as CSSProperties & { "--ar-from"?: string };
  if (from) style["--ar-from"] = from;
  return (
    <div className={`overflow-hidden ${maskClassName}`}>
      <div className={`ar-anim ar-reveal ${className}`} style={style}>
        {children}
      </div>
    </div>
  );
}

function TitleCard() {
  const title = "Chat Raid Boss";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10 px-24 text-center">
      <Reveal
        delay={100}
        maskClassName="-m-1 p-1"
        className="rounded-full px-5 py-2 text-xl font-semibold uppercase tracking-[0.3em] text-[#c4a3ff] ring-1 ring-[#9146FF]/60"
      >
        Twitch overlay
      </Reveal>

      <div className="flex flex-col items-center gap-6">
        <p
          role="heading"
          aria-level={1}
          aria-label={title}
          className="-my-4 flex overflow-hidden py-4 text-[176px] font-black leading-none tracking-tight text-[#ededed]"
        >
          {Array.from(title).map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`ar-anim ar-reveal ar-letter inline-block ${ch === " " ? "w-12" : ""} ${i >= 9 ? "text-[#9146FF]" : ""}`}
              style={{ animationDelay: `${200 + i * 45}ms` }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </p>
        <span
          aria-hidden="true"
          className="ar-anim ar-sweep block h-2 w-[880px] origin-left rounded-full bg-[#9146FF]"
          style={{ animationDelay: "850ms" }}
        />
      </div>

      <Reveal delay={1100} maskClassName="-my-2 py-2">
        <p className="text-balance text-5xl font-medium leading-snug text-[#a1a1a6]">chat fights a boss together</p>
      </Reveal>

      <Reveal delay={1500} maskClassName="-m-1 p-1">
        <ul aria-label="Chat commands" className="flex items-center gap-4 font-mono text-2xl">
          {COMMANDS.map((cmd) => (
            <li key={cmd} className="rounded-lg bg-[#232325] px-4 py-2 text-[#ededed] ring-1 ring-[#36363a]">
              {cmd}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

function LowerThird({ tag, text }: { tag: string; text: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-24" aria-hidden="true">
      <div
        className="ar-anim ar-reveal ar-reveal-fast flex items-center gap-6 rounded-2xl bg-[#141415]/90 py-5 pl-5 pr-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-[#9146FF]/50"
        style={{ "--ar-from": "calc(100% + 12rem)" } as CSSProperties}
      >
        <span className="rounded-xl bg-[#9146FF] px-4 py-2 text-xl font-bold uppercase tracking-widest text-[#ffffff]">
          {tag}
        </span>
        <span className="text-balance text-5xl font-bold leading-tight text-[#ededed]">{text}</span>
      </div>
    </div>
  );
}

function OutroCard() {
  const host = useHost();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-16 px-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <Reveal maskClassName="-my-6 py-6">
          <p className="text-balance text-[112px] font-black leading-none tracking-tight text-[#ededed]">
            Paste one URL into OBS.
          </p>
        </Reveal>
        <Reveal delay={180} maskClassName="-my-6 py-6">
          <p className="text-balance text-[112px] font-black leading-none tracking-tight text-[#9146FF]">
            No bot, no OAuth.
          </p>
        </Reveal>
      </div>

      <Reveal
        delay={500}
        from="calc(100% + 9rem)"
        maskClassName="-m-32 p-32"
        className="flex w-[1280px] flex-col overflow-hidden rounded-2xl bg-[#19191b] text-left shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-[#36363a]"
      >
        <div className="flex items-center gap-3 border-b border-[#36363a] px-6 py-4">
          <span className="h-3.5 w-3.5 rounded-full bg-[#404044]" aria-hidden="true" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#404044]" aria-hidden="true" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#404044]" aria-hidden="true" />
          <span className="ml-4 text-xl font-semibold text-[#a1a1a6]">OBS · Sources · Browser</span>
        </div>
        <div className="flex items-center gap-5 px-6 py-6">
          <span className="text-2xl font-semibold text-[#a1a1a6]">URL</span>
          <div className="flex flex-1 items-center gap-4 rounded-xl bg-[#141415] px-6 py-5 ring-2 ring-[#9146FF]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="#9146FF" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#9146FF" strokeWidth="2" />
            </svg>
            <span className="truncate font-mono text-3xl text-[#ededed]">
              https://{host}
              <span className="text-[#9146FF]">{OVERLAY_PATH}</span>
            </span>
            <span className="ar-anim ar-caret h-9 w-0.5 shrink-0 bg-[#ededed]" aria-hidden="true" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#36363a] px-6 py-4 text-xl text-[#a1a1a6]">
          <span>Width 1920 · Height 1080</span>
          <span className="rounded-lg bg-[#9146FF] px-5 py-2 font-semibold text-[#ffffff]">OK</span>
        </div>
      </Reveal>
    </div>
  );
}

function SceneProgress({ scene, pass, stopped }: { scene: Scene; pass: number; stopped: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-12 bottom-8 flex gap-3" aria-hidden="true">
      {([0, 1, 2] as const).map((i) => (
        <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#232325]">
          <div
            key={`${pass}-${scene === i}`}
            className={`h-full w-full origin-left bg-[#9146FF] ${scene === i && !stopped ? "ar-anim ar-fill" : ""}`}
            style={{
              transform: i < scene || (stopped && i === scene) ? "scaleX(1)" : scene === i ? undefined : "scaleX(0)",
              animationDuration: `${SCENE_MS[i]}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Scene crossfade: outgoing layer drops out in 120ms, incoming fades in over 180ms after it,
// so no text container sits below full opacity for more than 300ms. Scale settles via transform.
const KEYFRAMES = `
@keyframes ar-reveal { from { transform: translate3d(0, var(--ar-from, calc(100% + 2rem)), 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes ar-sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ar-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes ar-caret { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
@keyframes ar-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .45; transform: scale(.8); } }
.ar-layer {
  opacity: 0;
  transform: scale(1.03);
  transition: opacity 120ms linear, transform 700ms cubic-bezier(.2,.8,.2,1);
  will-change: opacity, transform;
}
.ar-layer[data-active="true"] {
  opacity: 1;
  transform: scale(1);
  transition: opacity 180ms linear 120ms, transform 700ms cubic-bezier(.2,.8,.2,1);
}
.ar-reveal { animation: ar-reveal 800ms cubic-bezier(.2,.8,.2,1) both; }
.ar-letter { animation-duration: 700ms; }
.ar-reveal-fast { animation-duration: 550ms; }
.ar-sweep { animation: ar-sweep 900ms cubic-bezier(.7,0,.2,1) both; }
.ar-fill { animation-name: ar-fill; animation-timing-function: linear; animation-fill-mode: both; }
.ar-caret { animation: ar-caret 1s steps(1) infinite; }
.ar-pulse { animation: ar-pulse 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .ar-layer, .ar-layer[data-active="true"] { transition: none !important; transform: none; }
  .ar-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
}
`;
