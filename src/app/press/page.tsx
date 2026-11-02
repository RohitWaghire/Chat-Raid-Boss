import type { ReactNode } from "react";
import type { Metadata } from "next";
import { BossArt } from "@/components/BossArt";

export const metadata: Metadata = {
  title: "Press Kit · Chat Raid Boss",
  description: "Your whole chat. One raid boss. Twitch chat vs an AI-narrated raid boss, as a single OBS browser source.",
};

const HP = 38420;
const MAX_HP = 61000;
const HP_PCT = (HP / MAX_HP) * 100;

type FeedLine = { user: string; color: string; cmd: string; result: string; tone: string; sub?: boolean };

const feed: FeedLine[] = [
  { user: "pixelpaladin", color: "#c4a3ff", cmd: "!atk", result: "−240", tone: "text-[#ff8a94]", sub: true },
  { user: "modmaxine", color: "#7ee0c3", cmd: "!heal", result: "+3 revived", tone: "text-[#7ee0c3]" },
  { user: "tankytara", color: "#ffd27a", cmd: "!shield", result: "+1,200 ward", tone: "text-[#ffd27a]" },
  { user: "lurkerlou", color: "#8fc8ff", cmd: "!atk", result: "CRIT −612", tone: "text-[#ff8a94]" },
  { user: "cheerbot_9k", color: "#ff9fd0", cmd: "Cheer500", result: "−5,000", tone: "text-[#ff8a94]", sub: true },
  { user: "hypehana", color: "#c4a3ff", cmd: "!ult", result: "ULT −9,999", tone: "text-[#ffd27a]" },
];

const leaders = [
  { name: "hypehana", dmg: "14,210" },
  { name: "cheerbot_9k", dmg: "9,875" },
  { name: "pixelpaladin", dmg: "6,402" },
  { name: "lurkerlou", dmg: "4,118" },
  { name: "tankytara", dmg: "2,960" },
];

const chips = [
  { tag: "IRC", label: "Zero-setup chat" },
  { tag: "AI", label: "Boss that talks back" },
  { tag: "HP", label: "Scales to any crowd" },
];

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`flex flex-col gap-3 rounded-2xl bg-[#19191b] p-5 ring-1 ring-white/10 ${className}`}>
      <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">{title}</h2>
      {children}
    </section>
  );
}

function ChatFeed() {
  return (
    <Panel title="Live chat">
      <ul className="flex flex-col gap-2 font-mono text-sm">
        {feed.map((line, i) => (
          <li
            key={`${line.user}-${i}`}
            className="flex items-center justify-between gap-3 rounded-md bg-[#141415] px-3 py-2 ring-1 ring-white/[0.06]"
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              {line.sub && (
                <span aria-label="Subscriber" className="rounded-sm bg-[#9146FF] px-1 text-[10px] font-bold leading-4 text-white">
                  SUB
                </span>
              )}
              <span className="truncate font-semibold" style={{ color: line.color }}>
                {line.user}
              </span>
              <span className="text-white/85">{line.cmd}</span>
            </span>
            <span className={`shrink-0 font-bold tabular-nums ${line.tone}`}>{line.result}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Leaderboard() {
  return (
    <Panel title="Top raiders">
      <ol className="flex flex-col gap-1.5 text-sm">
        {leaders.map((l, i) => (
          <li key={l.name} className="flex items-center gap-3 rounded-md px-2 py-1.5 even:bg-white/[0.03]">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-xs font-black ${
                i === 0 ? "bg-[#ffd27a] text-[#1a0b2e]" : "bg-white/[0.08] text-white/80"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold text-white">{l.name}</span>
            <span className="font-mono tabular-nums text-white/75">{l.dmg}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function HpBar() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff8a94]">World boss</p>
          <p className="text-3xl font-black tracking-tight text-white">The Lurker King</p>
        </div>
        <p className="font-mono text-base tabular-nums text-white/80">
          <span className="font-bold text-white">{HP.toLocaleString("en-US")}</span> / {MAX_HP.toLocaleString("en-US")}
        </p>
      </div>
      <div
        role="meter"
        aria-label="Boss HP"
        aria-valuemin={0}
        aria-valuemax={MAX_HP}
        aria-valuenow={HP}
        className="relative h-6 overflow-hidden rounded-md bg-white/[0.07] ring-1 ring-white/15"
      >
        <div className="absolute inset-y-0 left-0 bg-[#FF4655]/35" style={{ width: `${HP_PCT + 6}%` }} />
        <div className="absolute inset-y-0 left-0 bg-[#FF4655]" style={{ width: `${HP_PCT}%` }} />
        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="border-r border-[#19191b]/70 last:border-r-0" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-white/75">
        <span>
          <span className="font-semibold text-white">1,284</span> raiders
        </span>
        <span className="flex items-center gap-2">
          Hype
          <span aria-hidden="true" className="relative h-2 w-28 overflow-hidden rounded-full bg-white/10">
            <span className="absolute inset-y-0 left-0 w-[82%] rounded-full bg-[#a970ff]" />
          </span>
          <span className="font-mono font-semibold text-[#c4a3ff]">82%</span>
        </span>
      </div>
    </div>
  );
}

export default function PressPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#141415] p-8">
      <div
        data-testid="press-frame"
        className="relative flex h-[900px] w-[1600px] shrink-0 overflow-hidden rounded-[28px] bg-[#141415] ring-1 ring-white/10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(145,70,255,0.28),transparent_60%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-[#9146FF]" />

        <div className="relative grid w-full grid-cols-[520px_1fr_400px] gap-10 px-14 py-14">
          {/* Left: identity */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-lg bg-[#9146FF] text-sm font-black text-white">
                CRB
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#c4a3ff]">Codex × TwitchCon</span>
            </div>

            <div className="flex flex-col gap-6">
              <h1 className="text-balance text-[88px] font-black leading-[0.95] tracking-tight text-white">
                Chat Raid <span className="text-[#a970ff]">Boss</span>
              </h1>
              <p className="text-pretty text-3xl font-bold leading-snug text-white/90">Your whole chat. One raid boss.</p>
              <p className="max-w-md text-lg leading-relaxed text-white/70">
                Every <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-base text-[#c4a3ff]">!atk</code> hits an
                AI-narrated boss that roasts your viewers by name. One OBS browser source.
              </p>
            </div>

            <ul className="flex flex-wrap gap-3" aria-label="Features">
              {chips.map((c) => (
                <li
                  key={c.tag}
                  className="flex items-center gap-2.5 rounded-full bg-[#9146FF]/15 py-2 pl-2 pr-4 text-sm font-semibold text-white ring-1 ring-[#9146FF]/45"
                >
                  <span className="rounded-full bg-[#9146FF] px-2 py-0.5 font-mono text-xs font-bold text-white">{c.tag}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Center: boss */}
          <div className="flex flex-col items-center gap-5">
            <HpBar />
            <div className="relative flex w-full flex-1 items-center justify-center">
              <div className="h-[440px] w-[440px]">
                <BossArt phase="fight" hit={0} />
              </div>
              <figure className="absolute bottom-0 left-1/2 w-[520px] -translate-x-1/2">
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-[#232325] ring-1 ring-[#9146FF]/50 [clip-path:polygon(0_0,100%_0,0_100%)]"
                />
                <blockquote className="rounded-2xl bg-[#232325] px-5 py-4 text-lg leading-relaxed text-white ring-1 ring-[#9146FF]/50">
                  {"\u201C"}pixelpaladin swings again. Adorable. Someone heal the lurkers before I eat them.{"\u201D"}
                </blockquote>
                <figcaption className="mt-2 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#c4a3ff]">
                  AI Narrator
                </figcaption>
              </figure>
            </div>
          </div>

          {/* Right: chat + leaderboard */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#FF4655]" />
                Raid in progress
              </span>
              <span className="font-mono text-sm tabular-nums text-white/75">02:47</span>
            </div>
            <ChatFeed />
            <Leaderboard />
          </div>
        </div>
      </div>
    </main>
  );
}
