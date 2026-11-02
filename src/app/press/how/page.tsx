import type { ReactNode } from "react";
import type { Metadata } from "next";
import { BossArt } from "@/components/BossArt";

export const metadata: Metadata = {
  title: "How it works · Chat Raid Boss",
  description:
    "Twitch chat → commands parser → pure game engine → React OBS overlay and optional AI narrator. The Chat Raid Boss architecture in one slide.",
};

const PURPLE = "#9146FF";
const GOLD = "#ffd27a";

type StepProps = {
  index: number;
  kicker: string;
  title: string;
  body: ReactNode;
  connectorLabel?: string;
  featured?: boolean;
  children: ReactNode;
};

function Connector({ id, label }: { id: string; label: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute left-full top-[132px] z-10"
      width={72}
      height={64}
      viewBox="0 0 72 64"
      fill="none"
    >
      <defs>
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 z" fill={PURPLE} />
        </marker>
      </defs>
      <text
        x="36"
        y="18"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="11"
        fontWeight="700"
        fill="#c4a3ff"
      >
        {label}
      </text>
      <circle cx="6" cy="38" r="4" fill={PURPLE} />
      <path
        d="M12 38 L62 38"
        stroke={PURPLE}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="2 6"
        markerEnd={`url(#${id})`}
      />
    </svg>
  );
}

function Step({ index, kicker, title, body, connectorLabel, featured = false, children }: StepProps) {
  return (
    <li className="relative flex min-w-0 flex-1">
      <article
        aria-labelledby={`how-step-${index}`}
        className={`flex h-full w-full flex-col gap-5 rounded-3xl p-6 ring-1 ${
          featured ? "bg-[#232325] ring-[#9146FF]" : "bg-[#19191b] ring-white/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-mono text-lg font-black ${
              featured ? "bg-[#9146FF] text-white" : "bg-[#141415] text-[#c4a3ff] ring-2 ring-[#9146FF]"
            }`}
          >
            {index}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#c4a3ff]">
            <span className="sr-only">Step {index}: </span>
            {kicker}
          </span>
        </div>

        <div className="h-[150px] overflow-hidden rounded-2xl bg-[#141415] ring-1 ring-white/10">{children}</div>

        <div className="flex flex-col gap-2">
          <h2 id={`how-step-${index}`} className="text-balance text-2xl font-black leading-tight tracking-tight text-white">
            {title}
          </h2>
          <p className="text-pretty text-[15px] leading-relaxed text-white/80">{body}</p>
        </div>
      </article>
      {connectorLabel && <Connector id={`crb-how-conn-${index}`} label={connectorLabel} />}
    </li>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[13px] text-[#c4a3ff]">{children}</code>
  );
}

function ObsMock() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col gap-3 p-4 font-mono text-[13px]">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-white/70">
        <span>Browser Source</span>
        <span className="text-[#c4a3ff]">OBS</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-white/70">URL</span>
        <span className="truncate rounded-md bg-[#19191b] px-2 py-1.5 text-white ring-1 ring-[#9146FF]/60">
          …/overlay?channel=you
        </span>
      </div>
      <div className="flex gap-2">
        <span className="flex-1 rounded-md bg-[#19191b] px-2 py-1.5 text-white/85 ring-1 ring-white/10">W 1920</span>
        <span className="flex-1 rounded-md bg-[#19191b] px-2 py-1.5 text-white/85 ring-1 ring-white/10">H 1080</span>
      </div>
    </div>
  );
}

function ChatMock() {
  const lines: { user: string; msg: string; accent?: boolean }[] = [
    { user: "raider_42", msg: "!atk" },
    { user: "pixelmage", msg: "PogChamp PogChamp PogChamp" },
    { user: "goldfish", msg: "Cheer500 finish it!", accent: true },
    { user: "tankmain", msg: "!shield" },
  ];
  return (
    <ul aria-hidden="true" className="flex h-full flex-col justify-center gap-1.5 px-4 font-mono text-[13px]">
      {lines.map((l) => (
        <li key={l.user} className="truncate">
          <span className="font-bold text-[#c4a3ff]">{l.user}</span>
          <span className="text-white/70">: </span>
          <span className={l.accent ? "font-bold text-[#ffd27a]" : "text-white"}>{l.msg}</span>
        </li>
      ))}
    </ul>
  );
}

function IrcMock() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col justify-center gap-1.5 px-4 font-mono text-[13px] leading-relaxed">
      <span className="text-white/70">{"// in the browser"}</span>
      <span className="truncate text-white">
        <span className="text-[#c4a3ff]">ws</span> irc-ws.chat.twitch.tv
      </span>
      <span className="text-white">
        <span className="text-[#c4a3ff]">NICK</span> justinfan48213
      </span>
      <span className="text-white">
        <span className="text-[#c4a3ff]">JOIN</span> #you
      </span>
      <span className="text-[#ffd27a]">{"← PRIVMSG …"}</span>
    </div>
  );
}

function BossMock() {
  return (
    <div aria-hidden="true" className="flex h-full items-center gap-3 p-3">
      <div className="h-[110px] w-[110px] shrink-0 rounded-xl bg-[#19191b] p-1 ring-1 ring-white/10">
        <BossArt phase="fight" hit={0} />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[38%] rounded-full bg-[#9146FF]" />
        </div>
        <div className="rounded-xl rounded-tl-sm bg-[#232325] px-3 py-2 text-[13px] leading-snug text-white ring-1 ring-[#ffd27a]/60">
          {'"@raider_42, was that a hit or a high-five?"'}
        </div>
        <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ffd27a]">AI narrator · optional</span>
      </div>
    </div>
  );
}

const FACTS: { title: string; detail: string }[] = [
  { title: "No bot account", detail: "Reads chat as an anonymous justinfan guest" },
  { title: "No OAuth", detail: "Nothing to authorize, no tokens to leak" },
  { title: "60fps", detail: "Animates transform and opacity only" },
  { title: "Transparent", detail: "Drops cleanly over any OBS scene" },
];

function FactIcon({ index }: { index: number }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: GOLD,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
  switch (index) {
    case 0:
      return (
        <svg {...common}>
          <rect x="5" y="8" width="14" height="11" rx="3" />
          <path d="M12 4v4M9 13h.01M15 13h.01M3 3l18 18" />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 7.5-2M3 3l18 18" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
          <path d="M9 12h6" />
        </svg>
      );
  }
}

function FactStrip() {
  return (
    <section aria-label="Key facts" className="rounded-2xl bg-[#19191b] ring-1 ring-white/10">
      <ul className="grid grid-cols-4 divide-x divide-white/10">
        {FACTS.map((fact, i) => (
          <li key={fact.title} className="flex items-center gap-4 px-6 py-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#141415] ring-1 ring-[#ffd27a]/40">
              <FactIcon index={i} />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-lg font-black tracking-tight text-white">{fact.title}</span>
              <span className="text-sm leading-relaxed text-white/75">{fact.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <main tabIndex={0} aria-label="Slide" className="grid min-h-screen place-items-center overflow-auto bg-[#141415] p-8">
      <div
        data-testid="how-frame"
        className="relative flex h-[900px] w-[1600px] shrink-0 flex-col justify-between gap-8 overflow-hidden rounded-[28px] bg-[#141415] px-14 pb-10 pt-12 ring-1 ring-white/10"
      >
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-[#9146FF]" />

        <header className="flex items-end justify-between gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-lg bg-[#9146FF] text-xs font-black text-white"
              >
                CRB
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#c4a3ff]">
                Chat Raid Boss · How it works
              </span>
            </div>
            <h1 className="text-balance text-6xl font-black tracking-tight text-white">
              From chat message to <span className="text-[#c4a3ff]">boss fight</span>
            </h1>
          </div>
          <p className="max-w-sm text-pretty text-right text-base leading-relaxed text-white/80">
            Four steps, one browser source. Everything runs client-side inside OBS.
          </p>
        </header>

        <ol aria-label="How Chat Raid Boss works" className="flex h-[452px] gap-18">
          <Step
            index={1}
            kicker="Setup"
            title="Streamer adds an OBS browser source"
            body="Paste one overlay URL with your channel name. That is the whole install."
            connectorLabel="go live"
          >
            <ObsMock />
          </Step>
          <Step
            index={2}
            kicker="Play"
            title="Chat types commands, emotes and bits"
            body={
              <>
                <Code>!atk</Code>, emote combos and cheers become attacks, shields and team damage.
              </>
            }
            connectorLabel="IRC"
          >
            <ChatMock />
          </Step>
          <Step
            index={3}
            kicker="Listen"
            title="Overlay reads Twitch IRC anonymously"
            body="A WebSocket in the browser joins your channel as a guest. No server in between."
            connectorLabel="state"
          >
            <IrcMock />
          </Step>
          <Step
            index={4}
            kicker="React"
            title="Boss reacts, AI narrator roasts top raiders"
            body="HP drops, phases shift, and an optional rate-limited narrator calls out the MVPs."
            featured
          >
            <BossMock />
          </Step>
        </ol>

        <FactStrip />
      </div>
    </main>
  );
}
