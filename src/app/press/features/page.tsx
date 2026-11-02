import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features · Chat Raid Boss",
  description:
    "Built for every chat size: chat commands, emote combos, Bits, Channel Points, an AI narrator, and HP that scales from 10 to 10,000 viewers.",
};

function Tile({
  tag,
  title,
  blurb,
  children,
}: {
  tag: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <li className="flex min-h-0 min-w-0 flex-col gap-3 rounded-2xl bg-[#19191b] p-5 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-balance text-xl font-black leading-tight tracking-tight text-white">{title}</h2>
          <p className="text-pretty text-sm leading-relaxed text-white/75">{blurb}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#9146FF] px-2.5 py-0.5 font-mono text-xs font-bold text-white">
          {tag}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end">{children}</div>
    </li>
  );
}

const commands = [
  { cmd: "!atk", effect: "−240 dmg", tone: "text-[#ff8a94]" },
  { cmd: "!heal", effect: "+3 revived", tone: "text-[#7ee0c3]" },
  { cmd: "!shield", effect: "+1,200 ward", tone: "text-[#ffd27a]" },
  { cmd: "!ult", effect: "−9,999 dmg", tone: "text-[#ffd27a]" },
];

function CommandsMock() {
  return (
    <ul className="grid grid-cols-2 gap-2 font-mono text-sm" aria-label="Chat commands">
      {commands.map((c) => (
        <li
          key={c.cmd}
          className="flex flex-col gap-0.5 rounded-md bg-[#141415] px-3 py-2 ring-1 ring-white/[0.06]"
        >
          <span className="font-bold text-[#c4a3ff]">{c.cmd}</span>
          <span className={`font-semibold tabular-nums ${c.tone}`}>{c.effect}</span>
        </li>
      ))}
    </ul>
  );
}

const emotes = ["Pog", "Kappa", "Hype"];

function EmoteMock() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#141415] p-3 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-2">
        {emotes.map((e) => (
          <span
            key={e}
            className="grid h-11 w-14 place-items-center rounded-md bg-[#232325] font-mono text-xs font-bold text-white ring-1 ring-[#9146FF]/50"
          >
            {e}
          </span>
        ))}
        <span className="ml-auto font-mono text-3xl font-black tabular-nums text-[#ffd27a]">×3</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/75">
        <span className="font-bold uppercase tracking-[0.2em]">Combo</span>
        <span aria-hidden="true" className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-[#ffd27a]" />
        </span>
        <span className="font-mono font-semibold text-white">2.4s left</span>
      </div>
    </div>
  );
}

const cheers = [
  { user: "cheerbot_9k", bits: 100 },
  { user: "hypehana", bits: 500 },
  { user: "pixelpaladin", bits: 1000 },
];

function BitsMock() {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5 font-mono text-sm" aria-label="Recent cheers">
        {cheers.map((c) => (
          <li
            key={c.user}
            className="flex items-center justify-between gap-3 rounded-md bg-[#141415] px-3 py-1.5 ring-1 ring-white/[0.06]"
          >
            <span className="min-w-0 truncate">
              <span className="font-semibold text-[#ff9fd0]">{c.user}</span>{" "}
              <span className="text-white/85">Cheer{c.bits}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-[#ff8a94]">
              −{(c.bits * 2).toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-right font-mono text-xs text-white/75">
        1 bit <span aria-hidden="true">→</span>
        <span className="sr-only">equals</span> 2 dmg
      </p>
    </div>
  );
}

const rewards = [
  { name: "Smite", cost: "5,000", ring: "ring-[#ff8a94]/60", text: "text-[#ff8a94]" },
  { name: "Revive all", cost: "2,500", ring: "ring-[#7ee0c3]/60", text: "text-[#7ee0c3]" },
  { name: "Freeze", cost: "1,000", ring: "ring-[#8fc8ff]/60", text: "text-[#8fc8ff]" },
];

function PointsMock() {
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-3 gap-2" aria-label="Channel Point rewards">
        {rewards.map((r) => (
          <li
            key={r.name}
            className={`flex flex-col items-center gap-1 rounded-lg bg-[#141415] px-2 py-3 text-center ring-1 ${r.ring}`}
          >
            <span className={`text-sm font-black leading-tight ${r.text}`}>{r.name}</span>
            <span className="font-mono text-xs tabular-nums text-white/75">{r.cost} pts</span>
          </li>
        ))}
      </ul>
      <p className="truncate font-mono text-xs text-white/75">
        <span className="font-bold text-[#c4a3ff]">EventSub</span> channel_points_custom_reward_redemption.add
      </p>
    </div>
  );
}

function NarratorMock() {
  return (
    <figure className="flex flex-col gap-2">
      <blockquote className="rounded-xl bg-[#232325] px-4 py-3 text-sm leading-relaxed text-white ring-1 ring-[#9146FF]/50">
        {"\u201C"}hypehana has dealt 14,210 damage and still can{"\u2019"}t parry a lurker. Bold strategy.{"\u201D"}
      </blockquote>
      <figcaption className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold uppercase tracking-[0.2em] text-[#c4a3ff]">AI Narrator</span>
        <span className="font-mono text-white/75">targets #1 raider</span>
      </figcaption>
    </figure>
  );
}

const scaling = [
  { viewers: "10", hp: "1,000", width: "w-[8%]" },
  { viewers: "100", hp: "10,000", width: "w-[30%]" },
  { viewers: "1,000", hp: "100,000", width: "w-[62%]" },
  { viewers: "10,000", hp: "1,000,000", width: "w-full" },
];

function ScalingMock() {
  return (
    <table className="w-full border-separate border-spacing-y-1.5 font-mono text-xs">
      <caption className="sr-only">Boss HP by raider count, 100 HP per raider</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Raiders</th>
          <th scope="col">HP bar</th>
          <th scope="col">Boss HP</th>
        </tr>
      </thead>
      <tbody>
        {scaling.map((s) => (
          <tr key={s.viewers}>
            <th scope="row" className="w-14 pr-2 text-left font-semibold tabular-nums text-white/80">
              {s.viewers}
            </th>
            <td className="w-full">
              <span aria-hidden="true" className="relative block h-3 overflow-hidden rounded bg-white/[0.07]">
                <span className={`absolute inset-y-0 left-0 rounded bg-[#FF4655] ${s.width}`} />
              </span>
            </td>
            <td className="whitespace-nowrap pl-3 text-right font-bold tabular-nums text-white">{s.hp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Mention = {
  title: string;
  blurb: string;
  href?: string;
  span?: "wide";
};

const mentions: Mention[] = [
  { title: "Compact layout", blurb: "Slim HP bar for busy scenes." },
  { title: "Chat cheat sheet", blurb: "Commands, on screen.", href: "/overlay/cheatsheet" },
  { title: "Victory burst", blurb: "A finale on the killing blow." },
  { title: "Raid recap", blurb: "Damage, MVPs and clear time." },
  { title: "Import / export", blurb: "Settings as one JSON file." },
  { title: "Attract mode", blurb: "Idle loop between raids.", href: "/attract" },
  { title: "Storyboard", blurb: "Every raid beat, frame by frame.", href: "/press/storyboard", span: "wide" },
];

const seasonalBosses = ["Pumpkin King", "Frost Troll", "Lord Lurker"];

const cardBase =
  "relative flex min-h-0 min-w-0 flex-col gap-1 rounded-xl bg-[#141415] p-3 ring-1 ring-white/10 transition-shadow";
const cardLinked =
  "has-[a:hover]:ring-[#a970ff]/70 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[#c4a3ff]";

function MentionCard({ title, blurb, href, span }: Mention) {
  return (
    <li className={`${cardBase} ${href ? cardLinked : ""} ${span === "wide" ? "col-span-2" : ""}`}>
      <h3 className="text-sm font-bold leading-tight text-white">
        {href ? (
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <p className="text-pretty text-xs leading-snug text-white/75">{blurb}</p>
      {href && (
        <p className="mt-auto truncate font-mono text-xs font-semibold text-[#c4a3ff]">
          {href}
          <span aria-hidden="true"> →</span>
        </p>
      )}
    </li>
  );
}

function SeasonalCard() {
  return (
    <li className={`${cardBase} col-span-2 gap-2 ring-[#ffd27a]/40`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold leading-tight text-white">Seasonal boss pack</h3>
        <span className="rounded-full bg-[#ffd27a] px-2 py-0.5 font-mono text-xs font-bold text-[#1a0b2e]">
          3 bosses
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Bosses in the seasonal pack">
        {seasonalBosses.map((b) => (
          <li
            key={b}
            className="rounded-md bg-[#232325] px-2 py-1 text-xs font-semibold text-[#ffd27a] ring-1 ring-[#ffd27a]/30"
          >
            {b}
          </li>
        ))}
      </ul>
    </li>
  );
}

function MentionsPanel() {
  return (
    <section
      aria-labelledby="mentions-heading"
      className="flex min-h-0 flex-col gap-3 rounded-2xl bg-[#19191b] p-4 ring-1 ring-white/10"
    >
      <h2 id="mentions-heading" className="text-xs font-bold uppercase tracking-[0.24em] text-white/80">
        Also in the box
      </h2>
      <ul className="grid min-h-0 flex-1 grid-cols-2 grid-rows-5 gap-2">
        <SeasonalCard />
        {mentions.map((m) => (
          <MentionCard key={m.title} {...m} />
        ))}
      </ul>
    </section>
  );
}

const awards = [
  { title: "MVP", user: "hypehana", stat: "14,210 dmg", badge: "bg-[#ffd27a]", text: "text-[#ffd27a]" },
  { title: "Medic", user: "modmaxine", stat: "41 revives", badge: "bg-[#7ee0c3]", text: "text-[#7ee0c3]" },
  { title: "Tank", user: "tankytara", stat: "18,400 blocked", badge: "bg-[#8fc8ff]", text: "text-[#8fc8ff]" },
];

function AwardsStrip() {
  return (
    <section
      aria-labelledby="awards-heading"
      className="flex items-center gap-6 rounded-2xl bg-[#19191b] px-6 py-4 ring-1 ring-white/10"
    >
      <h2 id="awards-heading" className="shrink-0 text-xs font-bold uppercase tracking-[0.24em] text-white/80">
        End-of-raid awards
      </h2>
      <ul className="grid flex-1 grid-cols-3 gap-4">
        {awards.map((a) => (
          <li key={a.title} className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-9 min-w-16 place-items-center rounded-md px-2 font-mono text-xs font-black uppercase text-[#1a0b2e] ${a.badge}`}
            >
              {a.title}
            </span>
            <span className="min-w-0 truncate font-semibold text-white">{a.user}</span>
            <span className={`ml-auto shrink-0 font-mono text-sm tabular-nums ${a.text}`}>{a.stat}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PressFeaturesPage() {
  return (
    <main
      tabIndex={0}
      aria-label="Slide"
      className="grid min-h-screen place-items-center overflow-auto bg-[#141415] p-8 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#c4a3ff]"
    >
      <div
        data-testid="press-frame"
        className="relative flex h-[900px] w-[1600px] shrink-0 overflow-hidden rounded-[28px] bg-[#141415] ring-1 ring-white/10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(145,70,255,0.22),transparent_55%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-[#9146FF]" />

        <div className="relative flex w-full min-h-0 flex-col gap-5 px-14 pb-10 pt-11">
          <header className="flex items-end justify-between gap-10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-[#9146FF] text-xs font-black text-white"
                >
                  CRB
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#c4a3ff]">Chat Raid Boss</span>
              </div>
              <h1 className="text-balance text-5xl font-black leading-none tracking-tight text-white">
                Built for every <span className="text-[#a970ff]">chat size</span>
              </h1>
            </div>
            <p className="max-w-md text-pretty text-right text-lg leading-relaxed text-white/75">
              Six ways your viewers hit the boss, from a ten-person lurk to a ten-thousand-viewer raid.
            </p>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-4 gap-5">
            <ul className="col-span-3 grid min-h-0 grid-cols-3 grid-rows-2 gap-5" aria-label="Features">
              <Tile tag="CHAT" title="Chat commands" blurb="Anyone in chat can fight. No extension, no sign-up.">
                <CommandsMock />
              </Tile>
              <Tile tag="EMOTE" title="Emote combos" blurb="Spam the same emote together to stack a damage multiplier.">
                <EmoteMock />
              </Tile>
              <Tile tag="BITS" title="Bits = 2 dmg/bit" blurb="Every cheer converts straight into boss damage.">
                <BitsMock />
              </Tile>
              <Tile tag="PTS" title="Channel Points" blurb="Custom rewards via EventSub: smite, revive all, freeze.">
                <PointsMock />
              </Tile>
              <Tile tag="AI" title="AI narrator" blurb="The boss reads the leaderboard and roasts top raiders by name.">
                <NarratorMock />
              </Tile>
              <Tile tag="HP" title="HP scales per raider" blurb="100 HP per raider keeps fights tense from 10 to 10,000 viewers.">
                <ScalingMock />
              </Tile>
            </ul>

            <MentionsPanel />
          </div>

          <AwardsStrip />

          <footer>
            <p className="text-center font-mono text-sm font-semibold text-white/80">
              Transparent OBS overlay
              <span aria-hidden="true" className="text-[#a970ff]">
                {" · "}
              </span>
              <span className="sr-only">, </span>
              60fps at 1080p
              <span aria-hidden="true" className="text-[#a970ff]">
                {" · "}
              </span>
              <span className="sr-only">, </span>
              no bot account
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
