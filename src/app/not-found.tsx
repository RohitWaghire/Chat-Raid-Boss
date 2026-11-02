import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404: The boss despawned | Chat Raid Boss",
  description: "The page you were looking for despawned. Head back to the studio, check the commands, or set up your overlay.",
  robots: { index: false },
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bf94ff]";

const SECONDARY_LINKS = [
  { href: "/commands", label: "Chat commands", hint: "Learn the attacks" },
  { href: "/obs", label: "OBS setup", hint: "Add the overlay" },
  { href: "/attract", label: "Attract mode", hint: "Watch an idle loop" },
] as const;

const PARTICLES = [
  { x: 92, y: 30, s: 6, o: 0.7 },
  { x: 108, y: 22, s: 5, o: 0.55 },
  { x: 80, y: 16, s: 4, o: 0.4 },
  { x: 120, y: 10, s: 4, o: 0.3 },
  { x: 100, y: 4, s: 3, o: 0.22 },
  { x: 132, y: 26, s: 3, o: 0.35 },
  { x: 68, y: 30, s: 3, o: 0.3 },
] as const;

function DespawnedBoss() {
  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nf-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bf94ff" stopOpacity="0.05" />
          <stop offset="0.55" stopColor="#9146FF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#9146FF" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="182" rx="58" ry="7" fill="#9146FF" opacity="0.18" />
      <ellipse
        cx="100"
        cy="182"
        rx="58"
        ry="7"
        fill="none"
        stroke="#bf94ff"
        strokeWidth="1.5"
        strokeDasharray="4 5"
        opacity="0.6"
      />

      <g fill="url(#nf-fade)" stroke="#bf94ff" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round">
        <path d="M84 62 L62 28 L92 52 Z" />
        <path d="M116 62 L138 28 L108 52 Z" />
        <path d="M58 180 C56 140 64 116 84 104 L80 74 C80 54 89 44 100 44 C111 44 120 54 120 74 L116 104 C136 116 144 140 142 180 Z" />
        <path d="M62 128 C46 136 38 152 40 168 L50 162 L54 172 L62 158 Z" />
        <path d="M138 128 C154 136 162 152 160 168 L150 162 L146 172 L138 158 Z" />
      </g>

      <g stroke="#ece6f7" strokeWidth="3" strokeLinecap="round">
        <path d="M86 70 L94 78 M94 70 L86 78" />
        <path d="M106 70 L114 78 M114 70 L106 78" />
      </g>
      <path d="M90 90 Q100 84 110 90" fill="none" stroke="#ece6f7" strokeWidth="2.5" strokeLinecap="round" />

      <g fill="#bf94ff">
        {PARTICLES.map((p) => (
          <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={p.s} height={p.s} opacity={p.o} />
        ))}
      </g>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-[#141415] px-6 py-16 text-center font-sans text-[#ece6f7]">
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <div className="w-44 sm:w-56">
          <DespawnedBoss />
        </div>

        <div className="flex w-full flex-col gap-1.5" aria-hidden="true">
          <div className="flex items-center justify-between font-mono text-xs font-semibold uppercase tracking-widest text-[#c9bfdc]">
            <span>Boss HP</span>
            <span>0 / 404</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#232325] ring-1 ring-white/10" />
        </div>
      </div>

      <div className="flex max-w-md flex-col items-center gap-3">
        <p className="font-mono text-sm font-semibold text-[#c4a3ff]">
          Error 404 · Target despawned
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">The boss despawned</h1>
        <p className="text-pretty text-base leading-relaxed text-[#c9bfdc]">
          {
            "No loot, no kill credit, no page. Whatever lived at this URL despawned before chat could land a hit. It doesn't exist or has moved."
          }
        </p>
      </div>

      <nav aria-label="Recovery" className="flex w-full max-w-xl flex-col items-center gap-4">
        <Link
          href="/"
          className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-[#9146FF] px-6 text-sm font-semibold text-[#ffffff] transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${focusRing}`}
        >
          Respawn at the studio
        </Link>

        <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {SECONDARY_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border border-white/10 bg-[#19191b] px-4 py-3 transition-colors duration-150 hover:border-[#9146FF] hover:bg-[#232325] motion-reduce:transition-none ${focusRing}`}
              >
                <span className="text-sm font-semibold text-[#ededed]">{l.label}</span>
                <span className="text-sm text-[#a1a1a6]">{l.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
