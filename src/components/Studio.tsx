"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Arena } from "./Arena";
import { BossSelect } from "./BossSelect";
import { ErrorBoundary } from "./ErrorBoundary";
import ShareKit from "./ShareKit";
import { RaidRecap } from "./RaidRecap";
import { SettingsIO } from "./SettingsIO";
import { UiIcon } from "./UiIcon";
import { useRaid } from "@/lib/useRaid";
import { DEFAULT_CONFIG, PRESETS, awards } from "@/lib/game";
import { paramsFromConfig } from "@/lib/config";
import { isMuted, setMuted } from "@/lib/sfx";
import type { GameConfig } from "@/lib/types";

type Lookup = { display_name: string; profile_image_url: string | null; live: { title: string; game: string; viewers: number } | null };

type TuneKey = "bossHp" | "hpPerRaider" | "durationSec" | "bossAttackEverySec" | "cooldownMs";
const TUNE_KEYS: TuneKey[] = ["bossHp", "hpPerRaider", "durationSec", "bossAttackEverySec", "cooldownMs"];
const DEFAULT_DEMO_RATE = 4;
const QUICK_SENDS = ["!atk", "!heal", "!ult", "PogChamp", "Cheer100"];

function suggestPreset(viewers: number) {
  if (viewers < 30) return "cozy";
  if (viewers < 300) return "standard";
  if (viewers < 5000) return "hype";
  return "mega";
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]";
const label = "block text-xs font-bold uppercase tracking-[0.18em] text-white/75";
const stepHead = "block min-w-0 text-sm font-bold uppercase tracking-[0.14em] text-white lg:text-xs lg:tracking-[0.18em] lg:text-white/75";
const stepNum = "mr-0.5 text-lg leading-none text-[#c4a3ff] lg:mr-0 lg:text-[length:inherit] lg:leading-[inherit] lg:text-inherit";
// 16px text on mobile prevents iOS Safari from zooming the page when an input is focused.
const input =
  "mt-1.5 w-full min-h-11 rounded-lg bg-[#141415] px-3 py-2.5 text-base normal-case tracking-normal text-white placeholder:text-sm placeholder:text-white/45 ring-1 ring-white/15 outline-none transition-shadow hover:ring-white/25 focus-visible:ring-2 focus-visible:ring-[#a970ff] aria-[invalid=true]:ring-[#ff8a94] lg:text-sm";
const ghostBtn = `rounded-lg bg-white/[0.07] text-white ring-1 ring-white/10 transition-colors hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const linkBtn = `inline-flex min-h-11 items-center self-start rounded-sm text-xs font-semibold text-[#c4a3ff] underline decoration-[#c4a3ff]/40 underline-offset-4 hover:decoration-[#c4a3ff] lg:min-h-0 ${focusRing}`;
const block = "flex min-w-0 scroll-mt-6 flex-col gap-4 border-t border-white/[0.08] px-4 py-5 first:border-t-0 sm:px-5 lg:gap-3";
const hint = "text-sm leading-relaxed text-white/70 lg:text-xs";
const chip = "rounded-md px-2 py-0.5 text-xs font-semibold normal-case tracking-normal ring-1";
const stepRow = "flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1";
const checkRow = "flex min-h-11 items-start gap-3 rounded-lg p-2 text-sm leading-relaxed lg:min-h-0 lg:gap-2.5 lg:p-0 lg:text-xs";

function phaseLabel(phase: string) {
  if (phase === "lobby") return "Lobby";
  if (phase === "victory") return "Victory";
  if (phase === "defeat") return "Defeat";
  if (phase === "enraged") return "Enraged";
  if (phase === "desperate") return "Desperate";
  return "Fighting";
}

function chatTone(demo: boolean, status: string) {
  if (demo) return { dot: "bg-white/50", pulse: false, text: "Simulated chat running" };
  if (status === "connected") return { dot: "bg-[#FF4655]", pulse: true, text: "Connected to live chat" };
  if (status === "idle" || status === "connecting") return { dot: "bg-[#ffcc4d]", pulse: true, text: "Connecting to chat…" };
  return { dot: "bg-[#ff8a94]", pulse: false, text: `Chat ${status}` };
}

function Spinner() {
  return <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-[hud-spin_0.7s_linear_infinite]" />;
}

function CheckIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function Slider({
  name,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
  help,
  base,
  onReset,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  fmt?: (n: number) => string;
  help?: string;
  base?: number;
  onReset?: () => void;
}) {
  const id = useId();
  const show = (n: number) => (fmt ? fmt(n) : n.toLocaleString());
  const changed = base !== undefined && value !== base;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className={label}>
        <span className="flex min-w-0 items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{name}</span>
            {changed && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4a3ff]" />}
          </span>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs normal-case tracking-normal tabular-nums ${changed ? "bg-[#9146FF]/25 text-white" : "text-white"}`}>
            {show(value)}
          </span>
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          aria-valuetext={show(value)}
          aria-describedby={help ? `${id}-help` : undefined}
          className={`mt-1 h-11 w-full cursor-pointer rounded-full accent-[#9146FF] lg:mt-2 lg:h-5 ${focusRing}`}
        />
      </label>
      <div className="flex min-w-0 items-start justify-between gap-3">
        {help && (
          <p id={`${id}-help`} className={`${hint} min-w-0`}>
            {help}
          </p>
        )}
        {onReset && base !== undefined && (
          changed ? (
            <button
              type="button"
              onClick={onReset}
              aria-label={`Reset ${name} to preset value ${show(base)}`}
              className={`min-h-11 shrink-0 rounded-md px-3 py-0.5 text-xs font-semibold text-[#c4a3ff] ring-1 ring-[#c4a3ff]/30 transition-colors hover:bg-[#c4a3ff]/10 lg:min-h-0 lg:px-1.5 ${focusRing}`}
            >
              {"↺ "}
              {show(base)}
            </button>
          ) : (
            <span className="shrink-0 py-0.5 text-xs text-white/60">Preset</span>
          )
        )}
      </div>
    </div>
  );
}

type Step = { id: string; name: string; done: boolean; optional?: boolean; detail: string };

function StepNav({ steps }: { steps: Step[] }) {
  const currentIdx = steps.findIndex((s) => !s.done && !s.optional);
  const current = currentIdx >= 0 ? steps[currentIdx] : null;
  return (
    <nav aria-label="Setup progress" className="flex min-w-0 flex-col gap-2.5 border-b border-white/[0.08] px-4 py-4 sm:px-5">
      <ol className="flex min-w-0 items-center gap-1">
        {steps.map((s, i) => {
          const isCurrent = i === currentIdx;
          return (
            <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
              <a
                href={`#${s.id}`}
                aria-current={isCurrent ? "step" : undefined}
                className={`group flex min-h-11 min-w-0 flex-1 flex-col items-center gap-1.5 rounded-md py-1 ${focusRing}`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ring-1 transition-colors ${
                    s.done
                      ? "bg-[#9146FF] text-white ring-[#9146FF]"
                      : isCurrent
                        ? "bg-[#9146FF]/20 text-white ring-2 ring-[#c4a3ff]"
                        : s.optional
                          ? "border border-dashed border-white/40 bg-transparent text-white/75 ring-0"
                          : "bg-[#141415] text-white/70 ring-white/20 group-hover:ring-white/40"
                  }`}
                >
                  {s.done ? <CheckIcon /> : i + 1}
                </span>
                <span className={`max-w-full truncate text-xs font-semibold ${isCurrent || s.done ? "text-white" : "text-white/70"}`}>{s.name}</span>
                <span className="sr-only">
                  {s.done ? "done" : s.optional ? "optional" : isCurrent ? "current step" : "to do"}: {s.detail}
                </span>
              </a>
              {i < steps.length - 1 && <span aria-hidden="true" className={`mb-5 h-px w-1.5 shrink-0 sm:w-2 ${s.done ? "bg-[#9146FF]" : "bg-white/15"}`} />}
            </li>
          );
        })}
      </ol>
      <p className="text-pretty text-sm leading-relaxed text-white/75 lg:text-xs">
        {current ? (
          <>
            <span className="font-semibold text-[#c4a3ff]">Next:</span> {current.detail}
          </>
        ) : (
          <>
            <span className="font-semibold text-[#3ddc97]">All set.</span> Paste the URL into an OBS Browser source.
          </>
        )}
      </p>
    </nav>
  );
}

export function Studio() {
  const [channelInput, setChannelInput] = useState("");
  const [channel, setChannel] = useState("");
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [preset, setPreset] = useState("standard");
  const [mine, setMine] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [lookupErr, setLookupErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingLogin, setPendingLogin] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0);
  const [origin, setOrigin] = useState("");
  const [muted, setMutedState] = useState(true);
  const [waitForMod, setWaitForMod] = useState(false);
  const [compact, setCompact] = useState(false);
  const [eventsub, setEventsub] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [demoRate, setDemoRate] = useState(DEFAULT_DEMO_RATE);
  const urlRef = useRef<HTMLInputElement>(null);
  const bossInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const demo = channel === "";
  const { state, status, narrator, now, start, reset, inject } = useRaid({ channel, demo, config, eventsub, demoRate });
  const set = (patch: Partial<GameConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const overlayUrl = useMemo(() => {
    const p = paramsFromConfig(config);
    if (channel) p.set("channel", channel);
    else p.set("demo", "1");
    if (waitForMod) p.set("wait", "1");
    if (compact) p.set("layout", "compact");
    if (eventsub && channel) p.set("eventsub", "1");
    return `${origin}/overlay?${p}`;
  }, [channel, config, origin, waitForMod, eventsub, compact]);

  const presetBase = useMemo(() => ({ ...DEFAULT_CONFIG, ...(PRESETS[preset]?.config ?? {}) }) as GameConfig, [preset]);
  const tweaked = TUNE_KEYS.filter((k) => config[k] !== presetBase[k]).length;
  const presetKeys = Object.keys(PRESETS);
  const presetName = PRESETS[preset]?.label ?? preset;
  const tone = chatTone(demo, String(status));
  const phase = String(state.phase);
  const inLobby = state.phase === "lobby";

  function applyPreset(k: string) {
    setPreset(k);
    set(PRESETS[k].config);
  }

  function resetTuning() {
    const patch: Partial<GameConfig> = {};
    for (const k of TUNE_KEYS) patch[k] = presetBase[k];
    set(patch);
  }

  function onPresetKey(e: React.KeyboardEvent<HTMLButtonElement>, k: string) {
    const i = presetKeys.indexOf(k);
    const len = presetKeys.length;
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % len;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + len) % len;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = len - 1;
    if (n < 0) return;
    e.preventDefault();
    applyPreset(presetKeys[n]);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[n]?.focus();
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const login = channelInput.trim().toLowerCase().replace(/^.*twitch\.tv\//, "").replace(/[/?#].*$/, "");
    setLookupErr("");
    if (!login) return setChannel("");
    if (!/^[a-z0-9_]{3,25}$/.test(login)) return setLookupErr("That doesn't look like a Twitch username (3–25 letters, numbers, _).");
    setPendingLogin(login);
    setLoading(true);
    try {
      const r = await fetch(`/api/twitch/user?login=${login}`);
      const j = await r.json();
      if (!r.ok) setLookupErr(j.error ?? "Lookup failed");
      else {
        setLookup(j.user);
        setChannel(login);
        if (j.user?.live?.viewers != null) applyPreset(suggestPreset(j.user.live.viewers));
      }
    } catch {
      setLookupErr("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMute() {
    const m = !isMuted();
    setMuted(m);
    setMutedState(m);
  }

  function copyUrl() {
    if (navigator.clipboard) navigator.clipboard.writeText(overlayUrl).catch(() => urlRef.current?.select());
    else urlRef.current?.select();
    setCopied(true);
    setCopyCount((c) => c + 1);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  function sendAsMe(raw: string) {
    const t = raw.trim();
    if (!t) return;
    const cheer = t.match(/^cheer(\d{1,6})/i);
    inject({ id: `me-${Date.now()}`, user: "You", color: "#FFFFFF", text: t, bits: cheer ? +cheer[1] : 0, isSub: true, isMod: true, ts: Date.now() });
  }

  const steps: Step[] = [
    { id: "step-channel", name: "Channel", done: !demo, optional: demo, detail: demo ? "Optional: connect your Twitch channel for real chat" : `Reading #${channel}` },
    { id: "step-preset", name: "Preset", done: true, detail: `${presetName} preset` },
    { id: "step-boss", name: "Boss", done: config.bossName.trim() !== "", detail: "Give your boss a name" },
    { id: "step-start", name: "Start", done: !inLobby, detail: "Start a test raid to preview the fight" },
    { id: "step-obs", name: "OBS", done: copyCount > 0, detail: "Copy the overlay URL into OBS" },
  ];

  const lookupState = loading ? "loading" : lookupErr ? "error" : !demo ? "connected" : "idle";

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <section
        className="order-3 flex min-w-0 flex-col overflow-clip rounded-2xl bg-[#19191b] ring-1 ring-white/10 shadow-none max-lg:[&_input]:scroll-mb-36 lg:order-none"
        aria-label="Raid setup"
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:px-5">
          <span className="shrink-0 text-xs font-bold uppercase tracking-[0.22em] text-white/75">Control panel</span>
          <span className="flex min-w-0 items-center gap-2 rounded-md bg-[#141415] px-2.5 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/10">
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot} ${tone.pulse ? "animate-[crb-studio-pulse_1.6s_ease-in-out_infinite]" : ""}`} />
            <span className="truncate">{demo ? "Demo chat" : `#${channel}`}</span>
            <span className="sr-only">{`, ${tone.text}`}</span>
          </span>
        </div>

        <StepNav steps={steps} />

        <form id="step-channel" onSubmit={connect} className={block} aria-busy={loading}>
          <div className={stepRow}>
            <label className={stepHead} htmlFor="ch">
              <span className={stepNum}>1</span> Twitch channel
            </label>
            {lookupState === "connected" && (
              <span className={`${chip} flex shrink-0 items-center gap-1 bg-[#3ddc97]/10 text-[#7ff0bf] ring-[#3ddc97]/30`}>
                <CheckIcon /> Connected
              </span>
            )}
            {lookupState === "idle" && <span className={`${chip} shrink-0 bg-white/[0.05] text-white/75 ring-white/15`}>Optional</span>}
          </div>
          <div className="flex min-w-0 gap-2">
            <input
              id="ch"
              value={channelInput}
              onChange={(e) => {
                setChannelInput(e.target.value);
                if (lookupErr) setLookupErr("");
              }}
              placeholder="channel name or twitch.tv link"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={lookupErr ? true : undefined}
              aria-describedby="ch-status ch-hint"
              className={`${input} mt-0 min-w-0 flex-1`}
            />
            <button
              disabled={loading}
              className="flex min-h-11 min-w-24 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#9146FF] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#7c2ff0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
            >
              {loading && <Spinner />}
              {loading ? "…" : channel ? "Switch" : "Connect"}
            </button>
          </div>
          <div id="ch-status" aria-live="polite" className="empty:hidden">
            {loading && (
              <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-white/80 animate-[crb-studio-rise_180ms_ease-out]">
                Looking up <span className="break-all font-mono text-[#e0ccff]">{pendingLogin}</span> on Twitch…
              </p>
            )}
          </div>
          {lookupErr && (
            <p className="flex min-w-0 items-start gap-2 rounded-lg bg-[#ff4655]/10 px-3 py-2 text-sm font-medium text-[#ff8a94] ring-1 ring-[#ff4655]/30 animate-[crb-studio-rise_180ms_ease-out] lg:text-xs" role="alert">
              <UiIcon name="warning" className="mt-0.5 size-4 shrink-0" />
              {lookupErr}
            </p>
          )}
          <p id="ch-hint" className={hint}>
            {demo ? "Leave blank to practice with simulated chat." : `Reading real chat from #${channel}. No login needed.`}
          </p>
          {lookup && !demo && (
            <div className="flex min-w-0 items-center gap-3 rounded-lg bg-[#141415] p-2.5 text-xs ring-1 ring-white/10 animate-[crb-studio-rise_220ms_ease-out]">
              {lookup.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lookup.profile_image_url} alt="" className="h-9 w-9 shrink-0 rounded-full ring-2 ring-[#9146FF]" />
              ) : (
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9146FF]/25 text-sm font-black text-white ring-2 ring-[#9146FF]">
                  {lookup.display_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1 break-words">
                <b className="text-sm text-white">{lookup.display_name}</b>
                <div className="text-white/75">
                  {lookup.live ? (
                    <span className="inline-flex flex-wrap items-center gap-x-1.5">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
                      <span>Live · {lookup.live.game}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lookup.live.viewers.toLocaleString()} viewers · preset selected</span>
                    </span>
                  ) : "Offline (or Helix keys not set)"}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-white/70">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot} ${tone.pulse ? "animate-[crb-studio-pulse_1.6s_ease-in-out_infinite]" : ""}`} />
                  {tone.text}
                </div>
              </div>
            </div>
          )}
          {!demo && (
            <button type="button" onClick={() => { setChannel(""); setChannelInput(""); setLookup(null); }} className={linkBtn}>
              Back to demo chat
            </button>
          )}
        </form>

        <div id="step-preset" className={block}>
          <div className={stepRow}>
            <p className={stepHead}>
              <span className={stepNum}>2</span> Difficulty preset
            </p>
            {tweaked > 0 && <span className={`${chip} shrink-0 bg-[#9146FF]/15 text-[#e0ccff] ring-[#9146FF]/40`}>Customized</span>}
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Difficulty preset">
            {Object.entries(PRESETS).map(([k, p]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={preset === k}
                tabIndex={preset === k ? 0 : -1}
                onClick={() => applyPreset(k)}
                onKeyDown={(e) => onPresetKey(e, k)}
                className={`relative min-h-11 min-w-0 rounded-lg px-3 py-2.5 text-left text-sm ring-1 transition-colors ${focusRing} ${
                  preset === k ? "bg-[#9146FF]/20 text-white ring-2 ring-[#a970ff]" : "bg-[#141415] text-white ring-white/10 hover:bg-white/[0.06] hover:ring-white/20"
                }`}
              >
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <b className="truncate">{p.label}</b>
                  <span aria-hidden="true" className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ring-1 ${preset === k ? "ring-[#c4a3ff]" : "ring-white/30"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full bg-[#c4a3ff] transition-transform ${preset === k ? "scale-100" : "scale-0"}`} />
                  </span>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-white/70">{p.hint}</span>
              </button>
            ))}
          </div>

          <div id="step-boss" className="flex min-w-0 scroll-mt-6 flex-col gap-3 pt-2">
            <BossSelect
              value={config.bossName}
              onSelect={(bossName) => set({ bossName })}
              onCustom={() => bossInputRef.current?.focus()}
            />
            <div className="flex min-w-0 flex-col gap-1.5">
              <label className={label}>Boss name
                <input
                  ref={bossInputRef}
                  value={config.bossName}
                  maxLength={30}
                  onChange={(e) => set({ bossName: e.target.value })}
                  aria-describedby="boss-name-meta"
                  className={input}
                />
              </label>
              <p id="boss-name-meta" className="flex min-w-0 justify-between gap-3 text-xs text-white/70">
                <span className="min-w-0">{config.bossName.trim() ? "Shown on the overlay health bar." : "Empty names fall back to the default boss."}</span>
                <span className="shrink-0 font-mono tabular-nums">{config.bossName.length}/30</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setAdvanced((a) => !a)} className={linkBtn} aria-expanded={advanced} aria-controls="advanced-tuning">
              {advanced ? "Hide" : "Show"} advanced tuning
            </button>
            {tweaked > 0 && (
              <button type="button" onClick={resetTuning} className={`min-h-11 rounded-md px-3 py-1 text-xs font-semibold text-[#c4a3ff] ring-1 ring-[#c4a3ff]/30 transition-colors hover:bg-[#c4a3ff]/10 lg:min-h-0 lg:px-2 ${focusRing}`}>
                {`↺ Reset ${tweaked} to ${presetName}`}
              </button>
            )}
          </div>
          {advanced && (
            <div id="advanced-tuning" className="flex min-w-0 flex-col gap-5 rounded-xl bg-[#141415] p-4 ring-1 ring-white/10 animate-[crb-studio-rise_200ms_ease-out]">
              <Slider name="Base HP" value={config.bossHp} min={500} max={100000} step={500} onChange={(n) => set({ bossHp: n })}
                help="Starting health before anyone joins." base={presetBase.bossHp} onReset={() => set({ bossHp: presetBase.bossHp })} />
              <Slider name="+HP per raider" value={config.hpPerRaider} min={0} max={500} step={10} onChange={(n) => set({ hpPerRaider: n })}
                help="Added for each new chatter who attacks. Keeps big chats from melting the boss." base={presetBase.hpPerRaider} onReset={() => set({ hpPerRaider: presetBase.hpPerRaider })} />
              <Slider name="Time limit" value={config.durationSec} min={60} max={600} step={30} onChange={(n) => set({ durationSec: n })} fmt={(n) => `${n}s`}
                help="Chat loses if the boss is still standing when time runs out." base={presetBase.durationSec} onReset={() => set({ durationSec: presetBase.durationSec })} />
              <Slider name="Boss attacks every" value={config.bossAttackEverySec} min={4} max={30} step={1} onChange={(n) => set({ bossAttackEverySec: n })} fmt={(n) => `${n}s`}
                help="Lower means more pressure. Chat has to heal more often." base={presetBase.bossAttackEverySec} onReset={() => set({ bossAttackEverySec: presetBase.bossAttackEverySec })} />
              <Slider name="Per-user cooldown" value={config.cooldownMs} min={0} max={5000} step={100} onChange={(n) => set({ cooldownMs: n })} fmt={(n) => `${(n / 1000).toFixed(1)}s`}
                help="Minimum gap between one chatter's attacks, so spammers can't solo the boss." base={presetBase.cooldownMs} onReset={() => set({ cooldownMs: presetBase.cooldownMs })} />
              {demo && (
                <Slider name="Demo chat speed" value={demoRate} min={1} max={30} step={1} onChange={setDemoRate} fmt={(n) => `${n} msg/s`}
                  help="Studio preview only. It isn't saved to the overlay URL." base={DEFAULT_DEMO_RATE} onReset={() => setDemoRate(DEFAULT_DEMO_RATE)} />
              )}
              <SettingsIO config={config} onImport={(c) => setConfig(c)} />
            </div>
          )}
          <p className={hint}>Boss HP scales with each new raider, keeping fights close from 10 to 10,000 viewers.</p>
        </div>

        {/* On mobile this bar is moved to the end of the panel (order-last) so `sticky bottom-0` keeps it pinned for the whole panel scroll. */}
        <div
          id="step-start"
          className="sticky bottom-0 z-20 order-last flex min-w-0 scroll-mt-6 flex-col gap-2 border-t border-white/[0.12] bg-[#141415]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-16px_32px_-16px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-5 lg:static lg:order-none lg:gap-2 lg:border-white/[0.08] lg:bg-white/[0.02] lg:px-5 lg:py-5 lg:shadow-none lg:backdrop-blur-none"
        >
          <p className="flex min-w-0 items-center justify-between gap-2 text-xs text-white/75" aria-live="polite">
            <span className="min-w-0 truncate">
              <span className="font-semibold text-white">{config.bossName.trim() || DEFAULT_CONFIG.bossName}</span> · {presetName}
              {tweaked > 0 ? " (custom)" : ""}
            </span>
            <span className="shrink-0 font-semibold">{phaseLabel(phase)}</span>
          </p>
          <div className="flex min-w-0 gap-2">
            <button
              onClick={start}
              data-testid="start"
              className="relative min-h-12 min-w-0 flex-1 overflow-hidden rounded-lg bg-[#9146FF] px-4 py-3 font-black tracking-wide text-white shadow-none transition-colors hover:bg-[#7c2ff0] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="relative inline-flex items-center justify-center gap-2 truncate">
                <UiIcon name={state.phase === "lobby" ? "swords" : "reset"} />
                {state.phase === "lobby" ? "Start raid" : "Restart raid"}
              </span>
            </button>
            <button onClick={reset} className={`${ghostBtn} min-h-12 shrink-0 px-4 py-3 text-sm font-semibold`}>Reset</button>
            <button onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? "Unmute sounds" : "Mute sounds"} data-testid="mute" className={`${ghostBtn} min-h-12 min-w-12 shrink-0 px-3 py-3 text-lg`}>
              <UiIcon name={muted ? "volume-off" : "volume"} className="size-[18px]" />
            </button>
          </div>
        </div>

        <div id="step-obs" className={block}>
          <div className={stepRow}>
            <p className={stepHead}>
              <span className={stepNum}>3</span> Add to OBS
            </p>
            {copyCount > 0 && (
              <span className={`${chip} flex shrink-0 items-center gap-1 bg-[#3ddc97]/10 text-[#7ff0bf] ring-[#3ddc97]/30`}>
                <CheckIcon /> Copied
              </span>
            )}
          </div>
          {demo && (
            <p className="rounded-lg bg-[#ffcc4d]/10 px-3 py-2 text-sm leading-relaxed text-[#ffe08a] ring-1 ring-[#ffcc4d]/30 lg:text-xs">
              This URL runs simulated chat. Connect a channel in step 1 to use your real chat.
            </p>
          )}
          <div className="flex min-w-0 gap-2">
            <input
              ref={urlRef}
              readOnly
              value={overlayUrl}
              aria-label="Overlay URL"
              data-testid="overlay-url"
              className={`min-h-11 min-w-0 flex-1 truncate rounded-lg bg-[#141415] px-3 py-2.5 font-mono text-base text-[#d9c6ff] ring-1 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#a970ff] lg:text-xs ${copied ? "ring-[#3ddc97]/70" : "ring-[#9146FF]/40"}`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyUrl}
              className={`${ghostBtn} relative min-h-11 shrink-0 px-4 text-sm font-bold lg:px-3 lg:text-xs ${copied ? "bg-[#9146FF] ring-[#9146FF] hover:bg-[#9146FF]" : ""}`}
            >
              {copied && (
                <span key={`ring-${copyCount}`} aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[#c4a3ff] animate-[crb-studio-ring_600ms_ease-out_forwards]" />
              )}
              <span key={`label-${copyCount}`} className={`relative inline-block ${copied ? "animate-[crb-studio-pop_320ms_ease-out]" : ""}`}>
                {copied ? "✓ Copied" : "Copy"}
              </span>
            </button>
            <a href={overlayUrl || "/overlay?demo=1"} target="_blank" rel="noreferrer" className={`${ghostBtn} grid min-h-11 min-w-11 shrink-0 place-items-center px-3 text-sm`} aria-label="Open overlay in new tab">↗</a>
          </div>
          <span className="sr-only" aria-live="polite">{copied ? "Overlay URL copied to clipboard" : ""}</span>
          {copied && (
            <p aria-hidden="true" className="text-sm font-medium text-[#7ff0bf] animate-[crb-studio-rise_200ms_ease-out] lg:text-xs">
              Copied. Now paste it into the URL field of an OBS Browser source.
            </p>
          )}
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-white/70 lg:gap-1 lg:text-xs">
            <li className="block pl-4 -indent-4 lg:flex lg:gap-2 lg:pl-0 lg:indent-0">
              <span aria-hidden="true" className="inline-block w-4 indent-0 text-[#a970ff] lg:w-auto">›</span>Sources → + → Browser · Width 1920 · Height 1080 (any 16:9 works)
            </li>
            <li className="block pl-4 -indent-4 lg:flex lg:gap-2 lg:pl-0 lg:indent-0">
              <span aria-hidden="true" className="inline-block w-4 indent-0 text-[#a970ff] lg:w-auto">›</span>Background is transparent. Tick &quot;Control audio via OBS&quot; for sounds.{" "}
              <a href="/obs" className="-my-3 inline-block py-3 indent-0 text-[#c4a3ff] underline lg:my-0 lg:py-0">Full OBS guide</a>
            </li>
          </ul>
          <div className="flex flex-col gap-1 rounded-xl bg-[#141415] p-2 ring-1 ring-white/10 lg:gap-2.5 lg:p-3">
            <label className={`${checkRow} cursor-pointer text-white/80 active:bg-white/[0.04] lg:active:bg-transparent`}>
              <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} data-testid="compact-toggle" className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[#9146FF] lg:h-4 lg:w-4 ${focusRing}`} />
              <span className="min-w-0">Compact corner widget (top-right) instead of the full arena</span>
            </label>
            <label className={`${checkRow} cursor-pointer text-white/80 active:bg-white/[0.04] lg:active:bg-transparent`}>
              <input type="checkbox" checked={waitForMod} onChange={(e) => setWaitForMod(e.target.checked)} className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[#9146FF] lg:h-4 lg:w-4 ${focusRing}`} />
              <span className="min-w-0">Wait for a mod to type <code className="rounded bg-white/[0.07] px-1 py-0.5 font-mono text-[#c4a3ff]">!raid start</code> (instead of starting on load)</span>
            </label>
            <label className={`${checkRow} ${demo ? "cursor-not-allowed text-white/60" : "cursor-pointer text-white/80"}`}>
              <input type="checkbox" checked={eventsub} onChange={(e) => setEventsub(e.target.checked)} className={`mt-0.5 h-5 w-5 shrink-0 rounded accent-[#9146FF] disabled:cursor-not-allowed lg:h-4 lg:w-4 ${focusRing}`} disabled={demo} aria-describedby={demo ? "eventsub-note" : undefined} />
              <span className="min-w-0">Channel Points power-ups via EventSub (needs server keys)</span>
            </label>
            {demo && <p id="eventsub-note" className="pb-1.5 pl-10 text-sm text-white/60 lg:pb-0 lg:pl-6 lg:text-xs">Connect a channel to enable.</p>}
          </div>
        </div>

        <form
          className={block}
          onSubmit={(e) => {
            e.preventDefault();
            if (!mine.trim()) return;
            sendAsMe(mine);
            setMine("");
          }}
        >
          <label className={label} htmlFor="me">Test as a chatter</label>
          <input id="me" value={mine} onChange={(e) => setMine(e.target.value)} placeholder="!atk · !heal · !ult · PogChamp · Cheer100" className={`${input} mt-0 font-mono`} />
          <div className="flex flex-wrap gap-2 lg:gap-1.5" role="group" aria-label="Quick send">
            {QUICK_SENDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => sendAsMe(cmd)}
                className={`min-h-11 rounded-md bg-white/[0.06] px-3 py-1 font-mono text-sm text-[#e0ccff] ring-1 ring-white/10 transition-colors hover:bg-[#9146FF]/25 hover:ring-[#a970ff]/50 active:scale-95 lg:min-h-0 lg:px-2 lg:text-xs ${focusRing}`}
              >
                {cmd}
              </button>
            ))}
          </div>
          <p className={hint}>Press Enter to send. Your messages hit the boss as a sub + mod.</p>
        </form>
      </section>

      {/* Preview leads on mobile so the pinned start bar and the fight are on screen together. */}
      <div className="contents lg:sticky lg:top-6 lg:flex lg:min-w-0 lg:flex-col lg:gap-3">
        <div className="order-1 flex min-w-0 flex-col gap-3 lg:order-none">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/75">
              Live preview
              <span className={`${chip} ${inLobby ? "bg-white/[0.05] text-white/75 ring-white/15" : "bg-[#FF4655]/15 text-[#ffb3ba] ring-[#FF4655]/40"}`}>
                {phaseLabel(phase)}
              </span>
            </span>
            <span className="text-xs text-white/65">What your viewers see in OBS</span>
          </div>
          <div className="min-w-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <ErrorBoundary label="Preview hiccup">
              <Arena state={state} status={status} narrator={narrator} channel={channel} now={now} />
            </ErrorBoundary>
          </div>
        </div>
        {(state.phase === "victory" || state.phase === "defeat") && (() => {
          const a = awards(state);
          const ps = Object.values(state.players);
          const q = new URLSearchParams({
            boss: state.config.bossName, outcome: state.phase,
            raiders: String(ps.length), damage: String(ps.reduce((n, p) => n + p.damage, 0)),
            secs: String(Math.max(0, Math.round(((state.endedAt || state.endsAt) - state.startedAt) / 1000))),
            ...(channel ? { channel } : {}),
            ...(a.mvp ? { mvp: a.mvp.name, mvpDmg: String(a.mvp.damage) } : {}),
            ...(a.medic ? { medic: a.medic.name } : {}), ...(a.tank ? { tank: a.tank.name } : {}),
          });
          return (
            <a href={`/r?${q}`} target="_blank" rel="noreferrer" data-testid="result-card" className={`${linkBtn} order-2 justify-self-start lg:order-none lg:mt-2`}>
              Share the raid result card ↗
            </a>
          );
        })()}
        {(state.phase === "victory" || state.phase === "defeat") && (
          <div className="order-2 min-w-0 lg:order-none lg:mt-4"><RaidRecap state={state} /></div>
        )}
        <div className="order-4 min-w-0 lg:order-none lg:mt-4"><ShareKit channel={channel} /></div>
        {inLobby && (
          <div className="order-2 flex min-w-0 flex-col items-stretch gap-3 rounded-2xl border border-dashed border-white/20 bg-[#19191b] p-4 sm:flex-row sm:items-center sm:justify-between lg:order-none">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-bold text-white text-balance">The boss is waiting in the lobby</p>
              <p className="text-sm leading-relaxed text-white/70 text-pretty lg:text-xs">
                {demo
                  ? "Start a test raid and simulated viewers will pile in so you can see the fight."
                  : `Start a test raid, then type !atk in #${channel} to land the first hit.`}
              </p>
            </div>
            <button onClick={start} className={`${ghostBtn} min-h-11 shrink-0 px-4 py-2 text-sm font-semibold`}>
              Start preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
