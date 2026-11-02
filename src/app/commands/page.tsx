import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BossArt } from "@/components/BossArt";
import { COMBO_WINDOW_MS, DEFAULT_CONFIG, KO_MS, PRESETS } from "@/lib/game";

export const metadata: Metadata = {
  title: "How to fight the boss · Chat Raid Boss",
  description:
    "Viewer guide for Chat Raid Boss: every chat command, emote combos, Bits, channel point power-ups, boss phases, cooldowns and end-of-raid awards.",
  openGraph: {
    title: "How to fight the boss · Chat Raid Boss",
    description: "Type !atk in chat and take down the boss with everyone else. Here's every command.",
  },
};

const secs = (ms: number) => `${Number((ms / 1000).toFixed(1))}s`;
const cooldowns = Object.values(PRESETS).map((p) => p.config.cooldownMs ?? DEFAULT_CONFIG.cooldownMs);
const COOLDOWN_MIN = secs(Math.min(...cooldowns));
const COOLDOWN_MAX = secs(Math.max(...cooldowns));
const COOLDOWN_STD = secs(DEFAULT_CONFIG.cooldownMs);
const KO_SECS = secs(KO_MS);
const COMBO_SECS = secs(COMBO_WINDOW_MS);

type Command = {
  syntax: string;
  aliases?: string;
  name: string;
  body: string;
  note?: string;
};

const CHAT_COMMANDS: Command[] = [
  {
    syntax: "!atk",
    aliases: "!attack",
    name: "Attack",
    body: "Swing at the boss for 18–34 damage. 12% crit chance for triple damage, 25% if you're subbed.",
    note: "Boss armor soaks hits first",
  },
  {
    syntax: "KEKW KEKW KEKW",
    name: "Emote combo",
    body: `Spam the same emote as chat. Every 3rd matching emote inside ${COMBO_SECS} fires a combo hit worth 40 × the combo count, so the longer chat keeps it going, the bigger it gets.`,
    note: "Ignores cooldown",
  },
  {
    syntax: "!heal",
    name: "Heal",
    body: "Revives the KO'd raider who has dealt the most damage. If nobody is down, it rallies the raid and adds hype.",
    note: "You can't heal while KO'd",
  },
  {
    syntax: "!shield",
    name: "Shield wall",
    body: "Each shield raised before the boss attacks blocks one KO. Enough shields and the whole strike bounces off.",
  },
  {
    syntax: "!ult",
    name: "Raid ultimate",
    body: "Only works when the Hype meter hits 100%. The first raider to type it deals 12% of the boss's max HP and shatters its armor.",
    note: "First one wins, then the meter resets",
  },
  {
    syntax: "cheer100",
    name: "Bits",
    body: "Every bit you cheer deals 2 damage and adds hype. Bits always land, even while you're KO'd or on cooldown.",
    note: "2 dmg per bit",
  },
];

const REDEMPTIONS = [
  { name: "Smite", body: "Deals 5% of the boss's max HP instantly." },
  { name: "Revive all", body: "Brings every KO'd raider back into the fight at once." },
  { name: "Freeze", body: "Delays the boss's next attack by 10 seconds." },
];

const PHASES = [
  {
    name: "Fight",
    range: "100% → 50% HP",
    body: "The boss strikes on a steady timer and hardens its armor after each attack. Pace yourselves and keep shields up.",
  },
  {
    name: "Enraged",
    range: "50% → 20% HP",
    body: "Attacks come about 30% faster and knock out more raiders per strike. Healers, this is your moment.",
  },
  {
    name: "Desperate",
    range: "20% → 0% HP",
    body: "Attacks come twice as fast, but the boss stops growing armor. Throw everything you have at it.",
  },
];

const AWARDS = [
  { name: "MVP", stat: "Most damage dealt", body: "Hits, crits, combos, ults and Bits all count." },
  { name: "Medic", stat: "Most heals", body: "Every !heal counts, revive or rally." },
  { name: "Tank", stat: "Most shields", body: "For the raider who kept the wall up." },
];

const FAQ = [
  {
    q: "Do I need to sign up or install anything?",
    a: "No. If you can type in this channel's chat, you're in the raid. Your first command adds you.",
  },
  {
    q: "Why didn't my !atk do anything?",
    a: "You were either on cooldown, KO'd, or the hit landed on the boss's armor. Wait a moment and try again.",
  },
  {
    q: "Why does the boss get more HP when people join?",
    a: "The boss scales with chat size so the fight stays close whether there are 10 raiders or 10,000.",
  },
  {
    q: "What happens if the timer runs out?",
    a: "The boss survives and chat loses. The streamer can start a rematch any time.",
  },
  {
    q: "Do subs get anything extra?",
    a: "Yes. Subscribers crit about twice as often (25% vs 12%).",
  },
];

export default function CommandsPage() {
  return (
    <div className="min-h-dvh bg-[#19191b] font-sans text-[#ededed]">
      <a
        href="#commands"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#9146FF] focus:px-4 focus:py-2 focus:text-[#ededed]"
      >
        Skip to commands
      </a>

      <header className="border-b border-[#ededed]/10">
        <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="rounded-sm font-mono text-sm font-bold tracking-tight text-[#ededed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bf94ff]">
            Chat Raid Boss
          </Link>
          <Link
            href="/overlay?demo=1"
            className="rounded-md border border-[#bf94ff]/40 px-3 py-1.5 text-sm font-medium text-[#bf94ff] transition-colors hover:bg-[#bf94ff]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bf94ff]"
          >
            Watch a demo
          </Link>
        </nav>
      </header>

      <main>
        <Hero />
        <CommandsSection />
        <RedemptionsSection />
        <PhasesSection />
        <CooldownSection />
        <AwardsSection />
        <FaqSection />
      </main>

      <footer className="border-t border-[#ededed]/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-[#ededed]/75 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Chat Raid Boss · a co-op boss fight for Twitch chat</p>
          <div className="flex gap-4">
            <Link href="/" className="underline decoration-[#bf94ff]/50 underline-offset-4 hover:text-[#ededed]">
              Home
            </Link>
            <Link href="/overlay?demo=1" className="underline decoration-[#bf94ff]/50 underline-offset-4 hover:text-[#ededed]">
              Demo overlay
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section aria-labelledby="page-title" className="mx-auto grid max-w-5xl items-center gap-8 px-4 pb-12 pt-10 sm:px-6 md:grid-cols-[1.2fr_1fr] md:pb-16 md:pt-16">
      <div className="flex flex-col gap-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#bf94ff]">Viewer guide</p>
        <h1 id="page-title" className="text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          How to fight the boss
        </h1>
        <p className="max-w-prose text-pretty text-base leading-relaxed text-[#ededed]/80 sm:text-lg">
          The boss on stream is fighting all of chat at once. Type commands in chat to hit it, revive fallen raiders and
          block its attacks. Take it down before the timer runs out.
        </p>
        <div className="flex flex-col gap-3 rounded-lg border border-[#9146FF]/50 bg-[#19191b] p-4 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm text-[#ededed]/80">New here? Type this in chat:</p>
          <kbd className="w-fit rounded-md bg-[#9146FF] px-3 py-1.5 font-mono text-lg font-bold text-[#ededed]">!atk</kbd>
        </div>
      </div>
      <div aria-hidden="true" className="mx-auto w-full max-w-sm">
        <BossArt phase="fight" hit={0} />
      </div>
    </section>
  );
}

function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#bf94ff]">{eyebrow}</p>
      <h2 id={id} className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {intro ? <p className="max-w-prose text-pretty leading-relaxed text-[#ededed]/75">{intro}</p> : null}
    </div>
  );
}

function Section({ labelledBy, children, id }: { labelledBy: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className="scroll-mt-6 border-t border-[#ededed]/10">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">{children}</div>
    </section>
  );
}

function CommandsSection() {
  return (
    <Section id="commands" labelledBy="commands-title">
      <SectionHeading
        id="commands-title"
        eyebrow="Chat commands"
        title="What to type"
        intro="Commands work anywhere in your message and aren't case sensitive."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHAT_COMMANDS.map((c) => (
          <li key={c.name} className="flex flex-col gap-3 rounded-lg border border-[#ededed]/10 bg-[#19191b] p-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <code className="rounded bg-[#19191b] px-2 py-1 font-mono text-base font-bold text-[#bf94ff]">{c.syntax}</code>
              {c.aliases ? (
                <span className="font-mono text-sm text-[#ededed]/70">
                  or <code>{c.aliases}</code>
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold">{c.name}</h3>
            <p className="text-sm leading-relaxed text-[#ededed]/80">{c.body}</p>
            {c.note ? (
              <p className="mt-auto w-fit rounded-full border border-[#9146FF]/50 px-2.5 py-0.5 text-xs font-medium text-[#bf94ff]">
                {c.note}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RedemptionsSection() {
  return (
    <Section labelledBy="redeem-title">
      <SectionHeading
        id="redeem-title"
        eyebrow="Channel points"
        title="Power-ups"
        intro="If the streamer has them set up, look for these rewards in the channel points menu under chat."
      />
      <ul className="grid gap-4 sm:grid-cols-3">
        {REDEMPTIONS.map((r) => (
          <li key={r.name} className="flex flex-col gap-2 rounded-lg bg-[#9146FF] p-5 text-[#ededed]">
            <h3 className="font-mono text-lg font-bold">{r.name}</h3>
            <p className="text-sm leading-relaxed">{r.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function PhasesSection() {
  return (
    <Section labelledBy="phases-title">
      <SectionHeading
        id="phases-title"
        eyebrow="Boss phases"
        title="It gets angrier as it weakens"
        intro={`Every time the boss strikes, it knocks out random active raiders for ${KO_SECS}. KO'd raiders can't attack or heal until someone uses !heal on them.`}
      />
      <ol className="grid gap-4 md:grid-cols-3">
        {PHASES.map((p, i) => (
          <li key={p.name} className="flex flex-col gap-3 rounded-lg border border-[#ededed]/10 bg-[#19191b] p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">
                <span className="sr-only">Phase {i + 1}: </span>
                {p.name}
              </h3>
              <span className="font-mono text-xs text-[#bf94ff]">{p.range}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#19191b]" aria-hidden="true">
              <div
                className="h-full origin-left rounded-full bg-[#9146FF]"
                style={{ transform: `scaleX(${[1, 0.5, 0.2][i]})` }}
              />
            </div>
            <p className="text-sm leading-relaxed text-[#ededed]/80">{p.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function CooldownSection() {
  const rules = [
    {
      title: "Personal cooldown",
      body: `After !atk, !heal, !shield or !ult you wait about ${COOLDOWN_STD} before your next command counts (${COOLDOWN_MIN}–${COOLDOWN_MAX} depending on how big the raid is). Spamming faster just gets ignored.`,
    },
    {
      title: "Emotes are free",
      body: "Emote combos skip the cooldown, so the whole chat can pile on together.",
    },
    {
      title: "Bits always count",
      body: "Cheers bypass both the cooldown and KO. You paid for them, so they always land.",
    },
  ];
  return (
    <Section labelledBy="cooldown-title">
      <SectionHeading id="cooldown-title" eyebrow="Anti-spam" title="Cooldowns" />
      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
        {rules.map((r) => (
          <div key={r.title} className="flex flex-col gap-2 border-l-0 border-t border-[#9146FF]/60 pt-4">
            <dt className="font-semibold">{r.title}</dt>
            <dd className="text-sm leading-relaxed text-[#ededed]/80">{r.body}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function AwardsSection() {
  return (
    <Section labelledBy="awards-title">
      <SectionHeading
        id="awards-title"
        eyebrow="End of raid"
        title="Awards"
        intro="When the fight ends, win or lose, the overlay calls out the top raiders."
      />
      <ul className="grid gap-4 sm:grid-cols-3">
        {AWARDS.map((a) => (
          <li key={a.name} className="flex flex-col gap-1 rounded-lg border border-[#ededed]/10 bg-[#19191b] p-5">
            <h3 className="font-mono text-xl font-black text-[#bf94ff]">{a.name}</h3>
            <p className="font-medium">{a.stat}</p>
            <p className="text-sm leading-relaxed text-[#ededed]/75">{a.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function FaqSection() {
  return (
    <Section labelledBy="faq-title">
      <SectionHeading id="faq-title" eyebrow="FAQ" title="Quick answers" />
      <div className="flex flex-col divide-y divide-[#ededed]/10 rounded-lg border border-[#ededed]/10 bg-[#19191b]">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bf94ff] [&::-webkit-details-marker]:hidden">
              <h3 className="text-base">{f.q}</h3>
              <span aria-hidden="true" className="font-mono text-[#bf94ff] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pt-3 text-sm leading-relaxed text-[#ededed]/80">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/overlay?demo=1"
          className="rounded-md bg-[#9146FF] px-5 py-3 text-center font-semibold text-[#ededed] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bf94ff]"
        >
          Try the demo overlay
        </Link>
        <Link
          href="/"
          className="rounded-md border border-[#ededed]/20 px-5 py-3 text-center font-semibold text-[#ededed] transition-colors hover:bg-[#ededed]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bf94ff]"
        >
          Back to home
        </Link>
      </div>
    </Section>
  );
}
