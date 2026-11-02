"use client"

import Link from "next/link"
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import type { ReactNode } from "react"

const RESULT_CARD_SRC =
  "/api/result-card?boss=Buffer%20Lich&outcome=victory&raiders=1284&damage=152340&secs=171&mvp=hypehana&mvpDmg=14210&medic=medmaxine&tank=tankytara"

const BOSSES = [
  { name: "The Lag Wyrm", slug: "lag-wyrm", trait: `Medium · "Your inputs arrive… eventually."` },
  { name: "Buffer Lich", slug: "buffer-lich", trait: `Hard · "Loading your doom… 99%…"` },
  { name: "Captain Copypasta", slug: "captain-copypasta", trait: `Easy · "Say it again. Louder."` },
  { name: "The Ban Hammer", slug: "ban-hammer", trait: `Brutal · "Timeouts are for the weak."` },
] as const

const PRESS_LINKS = [
  { href: "/press", label: "Press kit overview" },
  { href: "/press/how", label: "How it works" },
  { href: "/press/features", label: "Feature list" },
] as const

const LAYOUTS = [
  { value: "full", label: "Full", hint: "Boss art, health bar, and raid feed" },
  { value: "compact", label: "Compact", hint: "Slim health strip for busy scenes" },
] as const

type BossSlug = (typeof BOSSES)[number]["slug"]
type OverlayLayout = (typeof LAYOUTS)[number]["value"]
type OverlayOptions = { boss: BossSlug; layout: OverlayLayout; sound: boolean; demo: boolean }
type CopyStatus = "idle" | "copied" | "manual"

function buildOverlayPath({ boss, layout, sound, demo }: OverlayOptions) {
  const params = new URLSearchParams({
    boss,
    layout,
    sound: sound ? "1" : "0",
    demo: demo ? "1" : "0",
  })
  return `/overlay?${params.toString()}`
}

const subscribeNoop = () => () => {}
const getClientOrigin = () => window.location.origin
const getServerOrigin = () => ""

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a970ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#19191b]"

const peerFocusRing =
  "peer-focus-visible:ring-2 peer-focus-visible:ring-[#a970ff] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#19191b]"

const textLink = `inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-[#a970ff] underline decoration-[#a970ff]/50 underline-offset-4 transition-opacity hover:opacity-80 ${focusRing}`

const primaryLink = `inline-flex min-h-11 items-center justify-center rounded-lg bg-[#9146FF] px-4 text-sm font-semibold text-white underline underline-offset-4 transition-transform motion-safe:hover:-translate-y-0.5 ${focusRing}`

const chipBase =
  "inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-md px-4 text-sm font-semibold ring-1 transition-colors"

const chipOff = "bg-white/[0.03] text-white/80 ring-white/15 hover:bg-white/[0.07] hover:text-white"

const chipOn = "bg-[#9146FF] text-white ring-[#a970ff]"

const fieldLabel = "font-mono text-xs font-medium uppercase tracking-widest text-white/70"

function Arrow() {
  return (
    <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">
      {"→"}
    </span>
  )
}

function ChipIndicator({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-4 place-items-center rounded-full text-[10px] leading-none ring-1 ${
        on ? "bg-white text-[#9146FF] ring-white" : "ring-white/40"
      }`}
    >
      {on ? "✓" : ""}
    </span>
  )
}

function ToggleChip({
  label,
  pressed,
  onToggle,
  testId,
}: {
  label: string
  pressed: boolean
  onToggle: () => void
  testId: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      data-testid={testId}
      className={`${chipBase} ${pressed ? chipOn : chipOff} ${focusRing}`}
    >
      <ChipIndicator on={pressed} />
      {label}
      <span className={`font-mono text-xs ${pressed ? "text-white/90" : "text-white/60"}`}>
        {pressed ? "On" : "Off"}
      </span>
    </button>
  )
}

function UrlPreview({ path, origin }: { path: string; origin: string }) {
  const [base, query = ""] = path.split("?")
  const pairs = query ? query.split("&") : []

  return (
    <code className="block break-all font-mono text-sm leading-relaxed">
      <span className="text-white/60">{origin}</span>
      <span className="text-white">{base}</span>
      {pairs.map((pair, index) => {
        const [key, value] = pair.split("=")
        return (
          <span key={key}>
            <span className="text-white/60">{index === 0 ? "?" : "&"}</span>
            <span className="text-[#c9a5ff]">{key}</span>
            <span className="text-white/60">{"="}</span>
            <span className="text-white">{value}</span>
          </span>
        )
      })}
    </code>
  )
}

function OverlayUrlBuilder() {
  const [options, setOptions] = useState<OverlayOptions>({
    boss: "buffer-lich",
    layout: "full",
    sound: true,
    demo: false,
  })
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")
  const resetTimer = useRef<number | undefined>(undefined)
  const previewRef = useRef<HTMLDivElement>(null)
  const origin = useSyncExternalStore(subscribeNoop, getClientOrigin, getServerOrigin)

  const bossSelectId = useId()
  const previewLabelId = useId()
  const layoutHintId = useId()

  const overlayPath = buildOverlayPath(options)
  const overlayUrl = `${origin}${overlayPath}`
  const activeLayout = LAYOUTS.find((layout) => layout.value === options.layout) ?? LAYOUTS[0]

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const update = useCallback(<K extends keyof OverlayOptions>(key: K, value: OverlayOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
    setCopyStatus("idle")
  }, [])

  const handleCopy = useCallback(async () => {
    window.clearTimeout(resetTimer.current)
    try {
      await navigator.clipboard.writeText(overlayUrl)
      setCopyStatus("copied")
    } catch {
      const node = previewRef.current
      const selection = window.getSelection()
      if (node && selection) {
        const range = document.createRange()
        range.selectNodeContents(node)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      setCopyStatus("manual")
    }
    resetTimer.current = window.setTimeout(() => setCopyStatus("idle"), 2500)
  }, [overlayUrl])

  const statusMessage =
    copyStatus === "copied"
      ? "Overlay URL copied to clipboard."
      : copyStatus === "manual"
        ? "Couldn’t copy automatically. The URL is selected. Press Ctrl+C or ⌘C."
        : ""

  return (
    <div
      data-testid="overlay-url-builder"
      className="grid grid-cols-1 gap-8 rounded-3xl bg-[#19191b] p-6 ring-1 ring-white/10 sm:p-8 lg:grid-cols-5"
    >
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-[#a970ff]">Overlay builder</p>
          <h3 className="text-pretty text-2xl font-bold text-white">Build your browser source URL</h3>
          <p className="text-pretty text-sm leading-relaxed text-white/75">
            Pick a boss and options, then paste the URL into an OBS browser source. The URL updates as you go.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={bossSelectId} className={fieldLabel}>
            Boss
          </label>
          <div className="relative">
            <select
              id={bossSelectId}
              value={options.boss}
              onChange={(event) => update("boss", event.target.value as BossSlug)}
              data-testid="overlay-boss-select"
              className={`min-h-11 w-full appearance-none rounded-lg bg-[#19191b] py-2 pl-3 pr-10 text-sm font-semibold text-white ring-1 ring-white/15 ${focusRing}`}
            >
              {BOSSES.map((boss) => (
                <option key={boss.slug} value={boss.slug}>
                  {boss.name}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60"
            >
              {"▾"}
            </span>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${fieldLabel} mb-2`}>Layout</legend>
          <div className="flex flex-wrap gap-2">
            {LAYOUTS.map((layout) => {
              const checked = options.layout === layout.value
              return (
                <label key={layout.value} className="relative">
                  <input
                    type="radio"
                    name="overlay-layout"
                    value={layout.value}
                    checked={checked}
                    onChange={() => update("layout", layout.value)}
                    aria-describedby={layoutHintId}
                    data-testid={`overlay-layout-${layout.value}`}
                    className="peer sr-only"
                  />
                  <span className={`${chipBase} ${checked ? chipOn : chipOff} ${peerFocusRing}`}>
                    <ChipIndicator on={checked} />
                    {layout.label}
                  </span>
                </label>
              )
            })}
          </div>
          <p id={layoutHintId} className="text-sm leading-relaxed text-white/65">
            {activeLayout.hint}
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${fieldLabel} mb-2`}>Options</legend>
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              label="Sound"
              pressed={options.sound}
              onToggle={() => update("sound", !options.sound)}
              testId="overlay-toggle-sound"
            />
            <ToggleChip
              label="Demo mode"
              pressed={options.demo}
              onToggle={() => update("demo", !options.demo)}
              testId="overlay-toggle-demo"
            />
          </div>
          <p className="text-sm leading-relaxed text-white/65">
            Demo mode runs a simulated fight so you can test placement without going live.
          </p>
        </fieldset>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-3">
        <p id={previewLabelId} className={fieldLabel}>
          Browser source URL
        </p>
        <div
          ref={previewRef}
          role="group"
          aria-labelledby={previewLabelId}
          data-testid="overlay-url-preview"
          className="rounded-xl bg-[#19191b] p-4 ring-1 ring-white/10 sm:p-5"
        >
          <UrlPreview path={overlayPath} origin={origin} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            data-testid="overlay-url-copy"
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
              copyStatus === "copied"
                ? "bg-white text-[#3b1678]"
                : "bg-[#9146FF] text-white hover:bg-[#8a45f0]"
            } ${focusRing}`}
          >
            <span aria-hidden="true">{copyStatus === "copied" ? "✓" : "⧉"}</span>
            {copyStatus === "copied" ? "Copied" : "Copy URL"}
          </button>
          <a
            href={overlayPath}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="overlay-url-open"
            className={`group ${textLink}`}
          >
            Preview overlay <Arrow />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>

        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="overlay-url-status"
          className="min-h-6 text-sm leading-relaxed text-white/80"
        >
          {statusMessage}
        </p>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:gap-x-6">
          <Link href="/overlay/cheatsheet" data-testid="overlay-cheatsheet-link" className={`group ${textLink}`}>
            Overlay parameter cheatsheet <Arrow />
          </Link>
          <Link href="/attract" data-testid="overlay-attract-link" className={`group ${textLink}`}>
            Attract screen for BRB scenes <Arrow />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ToolCard({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string
  eyebrow: string
  children: ReactNode
  className?: string
}) {
  return (
    <li
      className={`flex flex-col gap-4 rounded-2xl bg-[#19191b] p-6 ring-1 ring-white/10 transition-transform motion-safe:hover:-translate-y-1 ${className}`}
    >
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-[#a970ff]">{eyebrow}</p>
      <h3 className="text-pretty text-xl font-bold text-white">{title}</h3>
      {children}
    </li>
  )
}

export default function LandingTools() {
  return (
    <section aria-labelledby="landing-tools-heading" className="bg-[#19191b] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex max-w-2xl flex-col gap-3">
          <h2
            id="landing-tools-heading"
            className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Set up your first raid
          </h2>
          <p className="text-pretty text-base leading-relaxed text-white/75">
            Build the overlay, share commands, download panels, and post the result card.
          </p>
        </header>

        <OverlayUrlBuilder />

        <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard eyebrow="Streamer" title="OBS setup guide">
            <p className="text-sm leading-relaxed text-white/75">
              Add the boss overlay as a browser source, size it, and test a fight in under five minutes.
            </p>
            <div className="mt-auto">
              <Link href="/obs" className={`group ${primaryLink}`}>
                Open OBS guide&nbsp;<Arrow />
              </Link>
            </div>
          </ToolCard>

          <ToolCard eyebrow="Chat" title="Viewer guide">
            <p className="text-sm leading-relaxed text-white/75">
              Every command your raiders can type (attack, heal, shield, ult), with cooldowns explained.
            </p>
            <div className="mt-auto">
              <Link href="/commands" className={`group ${textLink}`}>
                See all commands <Arrow />
              </Link>
            </div>
          </ToolCard>

          <ToolCard eyebrow="Channel" title="Twitch panels">
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/panel?variant=play"
                width={320}
                height={160}
                loading="lazy"
                decoding="async"
                alt="Twitch about panel reading 'Play Chat Raid Boss' in purple pixel styling"
                className="h-auto w-full"
              />
            </div>
            <div className="mt-auto">
              <Link href="/panel?variant=play" className={`group ${textLink}`}>
                Get panel images <Arrow />
              </Link>
            </div>
          </ToolCard>

          <ToolCard eyebrow="Recap" title="Shareable result card" className="sm:col-span-2">
            <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RESULT_CARD_SRC}
                width={1200}
                height={630}
                loading="lazy"
                decoding="async"
                alt="Victory result card: 1,284 raiders defeated Buffer Lich in 2 minutes 51 seconds dealing 152,340 damage. MVP hypehana with 14,210 damage, top medic medmaxine, top tank tankytara."
                className="h-auto w-full"
              />
            </div>
            <p className="text-sm leading-relaxed text-white/75">
              Every fight ends with a card your chat can post, showing the MVP, medic, tank, and total damage.
            </p>
            <div>
              <a href={RESULT_CARD_SRC} className={`group ${textLink}`}>
                Open sample card <Arrow />
              </a>
            </div>
          </ToolCard>

          <ToolCard eyebrow="Encounters" title="Pick your boss">
            <ul role="list" className="flex flex-col gap-2">
              {BOSSES.map((boss) => (
                <li key={boss.slug}>
                  <Link
                    href={`/obs?boss=${boss.slug}`}
                    className={`group flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 ring-1 ring-white/10 transition-transform motion-safe:hover:translate-x-0.5 ${focusRing}`}
                  >
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4">
                        {boss.name}
                      </span>
                      <span className="text-sm text-white/65">{boss.trait}</span>
                    </span>
                    <span aria-hidden="true" className="text-[#a970ff]">
                      {"→"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ToolCard>

          <ToolCard eyebrow="Media" title="Press kit">
            <p className="text-sm leading-relaxed text-white/75">
              Logos, screenshots, and a fact sheet for coverage and collabs.
            </p>
            <ul role="list" className="mt-auto flex flex-col">
              {PRESS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`group ${textLink}`}>
                    {link.label} <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </ToolCard>
        </ul>
      </div>
    </section>
  )
}
