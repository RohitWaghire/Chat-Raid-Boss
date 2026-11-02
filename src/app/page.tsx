import type { ReactNode } from "react";
import LandingTools from "@/components/LandingTools";
import { Studio } from "@/components/Studio";
import { BossArt } from "@/components/BossArt";

const features = [
  {
    tag: "IRC",
    title: "No bot account to set up",
    body: "We read public chat over Twitch's IRC WebSocket anonymously. No bot account, no OAuth, nothing to authorize.",
  },
  {
    tag: "AI",
    title: "An AI narrator taunts raiders",
    body: "The boss targets raiders while an AI narrator taunts top damage dealers by name.",
  },
  {
    tag: "HP",
    title: "Boss HP adapts to your chat",
    body: "Boss HP scales with each new raider, keeping fights close from 10 to 10,000 viewers.",
  },
];

const steps = [
  ["Connect", "Type your channel name. Leave it blank to practice against simulated chat first."],
  ["Add to OBS", "Copy the browser-source URL. The overlay is transparent and starts on load."],
  ["Let chat fight", "Chat attacks, heals and shields together while the boss fights back live."],
];

const feed = [
  { user: "pixelpaladin", cmd: "!atk", dmg: "−28", tone: "text-[#ff8a94]" },
  { user: "modmaxine", cmd: "!heal", dmg: "+3 revived", tone: "text-[#c4a3ff]" },
  { user: "cheerbot_9k", cmd: "Cheer500", dmg: "−1,000", tone: "text-[#ff8a94]" },
];

const reasons = [
  {
    title: "Join with one command",
    body: "Type one command to join the fight.",
  },
  {
    title: "No bot to maintain",
    body: "The fight runs without a bot account or tokens to refresh.",
  },
  {
    title: "Awards for each raid",
    body: "Every finish records the top damage dealer, healer, and shield user.",
  },
  {
    title: "Fits your OBS scene",
    body: "A transparent browser source you can size and position like any other OBS layer.",
  },
];

const faqs = [
  {
    q: "How do I add it to OBS?",
    a: "Configure your fight in the Raid studio below and copy the overlay URL. In OBS, add a Browser source, paste the URL, and set the size to match your canvas (for example 1920×1080). The background is transparent and the raid starts as soon as the source loads.",
  },
  {
    q: "Is it free?",
    a: "Yes. Chat Raid Boss itself costs nothing to use. The only optional cost is the AI narrator, which runs on your own OpenAI API key and is billed by OpenAI.",
  },
  {
    q: "Does it need a bot account?",
    a: "No. The overlay reads your public chat anonymously over Twitch's IRC WebSocket. There is no bot account to create, no OAuth to approve and nothing posted to your chat.",
  },
  {
    q: "Do I need an OpenAI key?",
    a: "Only if you want the AI narrator. Without a key the boss still fights, scales and reacts to chat. Add an OpenAI key to unlock the narrator that roasts raiders by name.",
  },
];

const stats = [
  { value: "1", label: "OBS browser source" },
  { value: "0", label: "Bot accounts or OAuth" },
  { value: "$0", label: "To use; narrator is optional" },
  { value: "<1 min", label: "From channel name to live" },
];

const heroPoints = ["No bot account", "No OAuth", "No install"];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]";
const eyebrow = "text-xs font-bold uppercase tracking-[0.28em] text-[#c4a3ff]";
const sectionTitle =
  "text-balance text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl";
const cardTitle = "text-lg font-black leading-snug tracking-tight text-white";
const bodyText = "text-sm leading-relaxed text-white/75 text-pretty";
const sectionRule = "border-t border-white/[0.08] py-14 sm:py-20";
const navLink = `inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition-colors hover:text-white ${focusRing}`;

function Svg({ children, className = "h-6 w-6" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const featureIcons: Record<string, ReactNode> = {
  IRC: (
    <Svg>
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <path d="M2 9a15 15 0 0 1 20 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </Svg>
  ),
  AI: (
    <Svg>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z" />
      <path d="M12 8.5v.01M12 11.5v4" />
    </Svg>
  ),
  HP: (
    <Svg>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      <path d="M9 11h6M12 8v6" />
    </Svg>
  ),
};

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  );
}

function BossCard() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-[#19191b] p-4 ring-1 ring-white/10 shadow-none animate-[hud-rise_.7s_ease-out_both] motion-reduce:animate-none min-[400px]:p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/75">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF4655] animate-[crb-blink_1.4s_ease-in-out_infinite] motion-reduce:animate-none" />
          Raid in progress
        </span>
        <span className="font-mono text-xs text-white/75 tabular-nums">02:47</span>
      </div>

      <div className="mt-5 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a94]">World boss</p>
          <p className="mt-1 text-xl font-black leading-tight tracking-tight text-white min-[400px]:text-2xl sm:text-3xl">
            The Lag Wyrm
          </p>
        </div>
        <div aria-hidden="true" className="-my-5 w-24 shrink-0 sm:w-28">
          <BossArt phase="fight" hit={7} variant="lag-wyrm" />
        </div>
      </div>

      <div className="relative mt-3 h-5 overflow-hidden rounded bg-white/[0.07] ring-1 ring-white/10">
        <div className="absolute inset-y-0 left-0 w-[63%] bg-[#FF4655]/35" />
        <div className="absolute inset-y-0 left-0 w-[63%] bg-[#FF4655]" />
        <div className="absolute inset-0 grid grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="border-r border-[#19191b]/70 last:border-r-0" />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/75">
        <span className="font-mono tabular-nums"><span className="text-white">38,420</span> / 61,000 HP</span>
        <span><span className="font-semibold text-white">1,284</span> raiders</span>
        <span>
          Combo <span className="font-semibold text-[#c4a3ff]">×12</span>
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-2 border-t border-white/[0.08] pt-4 font-mono text-xs">
        {feed.map((f, i) => (
          <li
            key={f.user}
            className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-[#141415] px-3 py-2 ring-1 ring-white/[0.06] animate-[hud-rise_.6s_ease-out_both] motion-reduce:animate-none"
            style={{ animationDelay: `${0.4 + i * 0.15}s` }}
          >
            <span className="min-w-0 truncate">
              <span className="text-[#c4a3ff]">{f.user}</span> <span className="text-white/80">{f.cmd}</span>
            </span>
            <span className={`shrink-0 font-bold ${f.tone}`}>{f.dmg}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-md bg-[#9146FF]/15 px-3 py-2.5 text-sm leading-relaxed text-white ring-1 ring-[#9146FF]/40">
        <span className="font-bold text-[#c4a3ff]">Narrator:</span> {"\u201C"}pixelpaladin swings again. Adorable.
        Someone heal the lurkers before I eat them.{"\u201D"}
      </p>
    </div>
  );
}

function StatStrip() {
  return (
    <section aria-label="At a glance" className="border-t border-white/[0.08] py-8 sm:py-10">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-1 bg-[#19191b] px-5 py-5 sm:px-6">
            <dt className="text-sm leading-snug text-white/75">{s.label}</dt>
            <dd className="font-mono text-3xl font-black tracking-tight text-white tabular-nums sm:text-4xl">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WhyStreamers() {
  return (
    <section aria-labelledby="love-title" className={sectionRule}>
      <div className="flex flex-col gap-2">
        <p className={eyebrow}>For streamers</p>
        <h2 id="love-title" className={sectionTitle}>
          What a raid adds to your stream
        </h2>
      </div>
      <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((r) => (
          <li key={r.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#9146FF]/20 text-[#c4a3ff] ring-1 ring-[#9146FF]/40"
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-base font-black leading-snug tracking-tight text-white">{r.title}</h3>
              <p className={bodyText}>{r.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Features() {
  return (
    <section aria-labelledby="features-title" className={sectionRule}>
      <div className="flex flex-col gap-2">
        <p className={eyebrow}>Features</p>
        <h2 id="features-title" className={sectionTitle}>
          Ready for live chat
        </h2>
      </div>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map((f) => (
          <li
            key={f.title}
            className="flex flex-col gap-4 rounded-2xl bg-[#19191b] p-6 ring-1 ring-white/10 transition-colors hover:ring-[#9146FF]/50"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-xl bg-[#9146FF]/15 text-[#c4a3ff] ring-1 ring-[#9146FF]/40"
              >
                {featureIcons[f.tag]}
              </span>
              <span aria-hidden="true" className="font-mono text-xs font-bold tracking-[0.2em] text-white/75">
                {f.tag}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className={cardTitle}>{f.title}</h3>
              <p className={bodyText}>{f.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className={sectionRule}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className={eyebrow}>Three steps</p>
          <h2 id="how-title" className={sectionTitle}>
            How it works
          </h2>
        </div>
        <p className="text-sm font-semibold text-white/75">Set up in under a minute.</p>
      </div>
      <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#9146FF] font-mono text-sm font-black text-white"
              >
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="hidden h-px flex-1 bg-gradient-to-r from-[#9146FF]/60 to-white/10 md:block" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className={cardTitle}>
                <span className="sr-only">Step {i + 1}: </span>
                {t}
              </h3>
              <p className={`max-w-sm ${bodyText}`}>{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`scroll-mt-6 ${sectionRule}`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14">
        <div className="flex flex-col gap-2">
          <p className={eyebrow}>FAQ</p>
          <h2 id="faq-title" className={sectionTitle}>
            Questions before your first raid
          </h2>
        </div>
        <div className="flex flex-col overflow-hidden rounded-2xl bg-[#19191b] ring-1 ring-white/10">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-white/[0.08] last:border-b-0">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold text-white transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c4a3ff] [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.07] font-mono text-base text-[#c4a3ff] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-white/75 text-pretty">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.08] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2.5 font-black tracking-tight text-white">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#9146FF] text-[0.625rem] font-black text-white"
            >
              CRB
            </span>
            Chat Raid Boss
          </p>
          <p className="max-w-md text-sm leading-relaxed text-white/75">
            Built with OpenAI Codex for the Codex × TwitchCon Hackathon. Not affiliated with Twitch.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/commands" className={navLink}>
                Viewer guide
              </a>
            </li>
            <li>
              <a href="/obs" className={navLink}>
                OBS setup
              </a>
            </li>
            <li>
              <a href="#faq" className={navLink}>
                FAQ
              </a>
            </li>
            <li>
              <a href="/overlay?demo=1" target="_blank" rel="noreferrer" className={navLink}>
                Demo overlay ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
        <nav className="flex items-center justify-between gap-3" aria-label="Primary">
          <a
            href="#top"
            className="flex min-w-0 items-center gap-2.5 rounded-sm font-black tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c4a3ff]"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#9146FF] text-xs font-black text-white"
            >
              CRB
            </span>
            <span className="truncate">Chat Raid Boss</span>
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="/commands" className={navLink}>
              Viewer guide
            </a>
            <a href="/obs" className={`hidden sm:inline-flex ${navLink}`}>
              OBS setup
            </a>
            <a
              href="/overlay?demo=1"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex min-h-10 shrink-0 items-center rounded-lg bg-white/[0.07] px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.14] ${focusRing}`}
            >
              Open overlay ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </nav>

        <section
          id="top"
          aria-labelledby="hero-title"
          className="grid items-center gap-12 pb-14 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:pb-20 lg:pt-20"
        >
          <div className="flex min-w-0 flex-col gap-6 animate-[hud-rise_.6s_ease-out_both] motion-reduce:animate-none">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#c4a3ff]">
              <span aria-hidden="true" className="h-px w-8 bg-[#9146FF]" />
              Codex × TwitchCon
            </p>
            <h1
              id="hero-title"
              className="text-balance text-[2.5rem] font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Your whole chat vs. <span className="text-white sm:block">one raid boss.</span>
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
              A free OBS overlay where chat uses{" "}
              <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-[#c4a3ff]">!atk</code>,
              heals and shields together while an AI narrator taunts raiders by name.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
              {heroPoints.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <span className="text-[#c4a3ff]">
                    <CheckIcon />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href="#setup"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#9146FF] px-6 py-3 font-bold text-white shadow-none transition-colors hover:bg-[#7c2ff0] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Set up your raid
              </a>
              <a
                href="/overlay?demo=1"
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-12 w-full items-center justify-center rounded-lg px-6 py-3 font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/[0.07] active:translate-y-px sm:w-auto ${focusRing}`}
              >
                Watch a demo fight ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
          <BossCard />
        </section>

        <StatStrip />

        <WhyStreamers />

        <Features />

        <HowItWorks />

        <LandingTools />

        <section id="setup" aria-labelledby="setup-title" className={`scroll-mt-6 ${sectionRule}`}>
          <div className="mb-8 flex flex-col gap-2">
            <p className={eyebrow}>Raid studio</p>
            <h2 id="setup-title" className={sectionTitle}>
              Configure your fight, then copy the overlay
            </h2>
          </div>
          <div className="min-w-0">
            <Studio />
          </div>
        </section>

        <Faq />
      </main>
      <Footer />
    </div>
  );
}
