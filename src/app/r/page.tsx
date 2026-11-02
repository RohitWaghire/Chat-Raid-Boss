import type { Metadata } from "next";
import Link from "next/link";

type RawSP = Record<string, string | string[] | undefined>;
type SP = Promise<RawSP>;

const KEYS = ["boss", "outcome", "channel", "raiders", "damage", "secs", "mvp", "mvpDmg", "medic", "tank"] as const;
const MAX_LEN = 40;
const TWITCH_LOGIN = /^[a-zA-Z0-9_]{1,25}$/;

function clean(v: string | string[] | undefined, max = MAX_LEN): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

function int(v: string | string[] | undefined): number | null {
  const s = clean(v, 15);
  if (!/^\d+$/.test(s)) return null;
  const n = Number.parseInt(s, 10);
  return Number.isSafeInteger(n) ? n : null;
}

function query(sp: RawSP) {
  const q = new URLSearchParams();
  for (const k of KEYS) {
    const v = clean(sp[k]);
    if (v) q.set(k, v);
  }
  return q.toString();
}

function parse(sp: RawSP) {
  const channelRaw = clean(sp.channel, 25);
  return {
    win: clean(sp.outcome) === "victory",
    boss: clean(sp.boss) || "The boss",
    channel: TWITCH_LOGIN.test(channelRaw) ? channelRaw : "",
    raiders: int(sp.raiders),
    damage: int(sp.damage),
    secs: int(sp.secs),
    mvp: clean(sp.mvp, 25),
    mvpDmg: int(sp.mvpDmg),
    medic: clean(sp.medic, 25),
    tank: clean(sp.tank, 25),
  };
}

const nf = new Intl.NumberFormat("en-US");

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const { win, boss } = parse(sp);
  const title = win ? `Chat beat ${boss}!` : `${boss} survived the raid`;
  const img = `/api/result-card?${query(sp)}`;
  return {
    title: `${title} · Chat Raid Boss`,
    description: "A live boss fight your Twitch chat plays together. See the raid result.",
    openGraph: { title, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [img] },
  };
}

function Stat({ label, value, sub, wide }: { label: string; value: React.ReactNode; sub?: string; wide?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10 ${wide ? "col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</dt>
      <dd className="flex flex-col">
        <span className="truncate text-xl font-black tabular-nums text-white sm:text-2xl">{value}</span>
        {sub ? <span className="text-sm text-white/70 tabular-nums">{sub}</span> : null}
      </dd>
    </div>
  );
}

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = query(sp);
  const r = parse(sp);

  const accent = r.win ? "bg-[#f5c542] text-[#141415]" : "bg-[#ff6b6b] text-[#141415]";
  const accentText = r.win ? "text-[#f5c542]" : "text-[#ff6b6b]";
  const outcomeWord = r.win ? "Victory" : "Defeat";
  const headline = r.win ? `Chat beat ${r.boss}` : `${r.boss} survived the raid`;

  const dash = <span aria-label="not recorded">—</span>;

  return (
    <main className="min-h-dvh bg-[#141415] text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Chat Raid Boss · Raid result</p>

          <div className={`flex flex-col gap-2 rounded-2xl p-6 sm:p-8 ${accent}`}>
            <span className="text-sm font-bold uppercase tracking-[0.3em]">{r.win ? "Boss defeated" : "Raid wiped"}</span>
            <span aria-hidden="true" className="text-6xl font-black uppercase leading-none tracking-tight sm:text-8xl">
              {outcomeWord}
            </span>
          </div>

          <h1 className="text-balance text-3xl font-black leading-tight sm:text-4xl">
            <span className="sr-only">{outcomeWord}: </span>
            {headline}
          </h1>
          {r.channel ? (
            <p className="text-pretty leading-relaxed text-white/80">
              {"Played live by chat on "}
              <a
                href={`https://twitch.tv/${r.channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#c4a3ff] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]"
              >
                twitch.tv/{r.channel}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          ) : null}
        </header>

        <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
          <h2 id="stats-heading" className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Raid stats
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Raiders" value={r.raiders !== null ? nf.format(r.raiders) : dash} />
            <Stat label="Total damage" value={r.damage !== null ? nf.format(r.damage) : dash} />
            <Stat label="Time" value={r.secs !== null ? <time dateTime={`PT${r.secs}S`}>{formatTime(r.secs)}</time> : dash} />
            <Stat
              label="MVP"
              value={r.mvp ? <span className={accentText}>{r.mvp}</span> : dash}
              sub={r.mvpDmg !== null ? `${nf.format(r.mvpDmg)} dmg` : undefined}
              wide
            />
            <Stat label="Medic" value={r.medic || dash} />
            <Stat label="Tank" value={r.tank || dash} />
          </dl>
        </section>

        <section aria-labelledby="card-heading" className="flex flex-col gap-3">
          <h2 id="card-heading" className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Share card
          </h2>
          <figure className="overflow-hidden rounded-xl ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/result-card?${q}`}
              width={1200}
              height={630}
              alt={`${outcomeWord} result card for the raid against ${r.boss}, showing raid stats and awards`}
              className="block aspect-[1200/630] h-auto w-full bg-white/[0.04]"
            />
          </figure>
        </section>

        <nav aria-label="Next steps" className="flex flex-col gap-3 sm:flex-row">
          {r.channel ? (
            <a
              href={`https://twitch.tv/${r.channel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#9146FF] px-5 font-bold text-white hover:bg-[#8a45f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]"
            >
              Watch on Twitch<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          <Link
            href="/"
            className={`inline-flex min-h-12 items-center justify-center rounded-lg px-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              r.channel ? "text-white ring-1 ring-white/30 hover:bg-white/10" : "bg-[#9146FF] text-white hover:bg-[#8a45f0]"
            }`}
          >
            Make your own raid boss
          </Link>
          <Link
            href="/commands"
            className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 font-semibold text-[#c4a3ff] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c4a3ff]"
          >
            How to play
          </Link>
        </nav>
      </div>
    </main>
  );
}
