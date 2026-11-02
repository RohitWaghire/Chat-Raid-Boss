import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Add Chat Raid Boss to OBS — Setup Guide",
  description:
    "Step-by-step guide to adding the Chat Raid Boss overlay to OBS Studio as a Browser Source, plus troubleshooting for blank overlays, missing sound, low FPS, Streamlabs and Twitch Studio.",
  alternates: { canonical: "/obs" },
  openGraph: {
    title: "Add Chat Raid Boss to OBS",
    description: "Five steps to get the Chat Raid Boss overlay running in OBS Studio.",
    type: "article",
  },
}

/* Palette (all AA on #19191b / panel surfaces):
   bg #19191b · panel #19191b · line #313134 · text #ededed · muted #a1a1a6 · accent #b98aff · fill #9146FF */

function ObsWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#313134] bg-[#19191b] font-sans text-[13px] text-[#ededed] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 border-b border-[#313134] bg-[#232325] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#313134]" />
        <span className="size-2.5 rounded-full bg-[#313134]" />
        <span className="size-2.5 rounded-full bg-[#313134]" />
        <span className="ml-2 truncate text-xs text-[#a1a1a6]">{title}</span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  )
}

function MockCheckbox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2">
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded border ${
          checked ? "border-[#9146FF] bg-[#9146FF]" : "border-[#5c5c63] bg-[#19191b]"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3.5 text-[#ffffff]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1">{label}</span>
      <span
        className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
          checked ? "bg-[#9146FF] text-[#ffffff]" : "border border-[#5c5c63] text-[#a1a1a6]"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </div>
  )
}

function MockField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-xs text-[#a1a1a6] sm:w-20 sm:shrink-0 sm:text-right">{label}</span>
      <span
        className={`flex min-w-0 flex-1 items-center rounded border bg-[#19191b] px-2.5 py-1.5 font-mono text-xs ${
          highlight ? "border-[#b98aff] ring-2 ring-[#9146FF]/40" : "border-[#313134]"
        }`}
      >
        <span className="truncate">{value}</span>
        {highlight && <span className="ml-0.5 h-4 w-px shrink-0 animate-pulse bg-[#ededed]" />}
      </span>
    </div>
  )
}

function SourcesDock({ items, active }: { items: string[]; active?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <div
          key={item}
          className={`flex items-center gap-2 rounded px-2 py-1.5 ${
            item === active ? "bg-[#9146FF] text-[#ffffff]" : "bg-[#232325]"
          }`}
        >
          <span className="size-3 rounded-sm border border-current opacity-70" />
          <span className="truncate">{item}</span>
          <span className="ml-auto flex h-2.5 w-4 items-center justify-center rounded-full border border-current opacity-80">
            <span className="size-1 rounded-full bg-current" />
          </span>
        </div>
      ))}
    </div>
  )
}

function Step1Mock() {
  return (
    <ObsWindow title="OBS Studio — Sources">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a1a1a6]">Sources</p>
          <SourcesDock items={["Game Capture", "Mic/Aux"]} />
          <div className="flex items-center gap-1 border-t border-[#313134] pt-2">
            <span className="relative flex size-7 items-center justify-center rounded border-2 border-[#b98aff] bg-[#9146FF] text-base font-bold text-[#ffffff]">
              +
              <span className="absolute -inset-1 animate-ping rounded border border-[#b98aff] opacity-40" />
            </span>
            {["−", "Settings", "↑", "↓"].map((g) => (
              <span key={g} className="flex size-7 items-center justify-center rounded bg-[#232325] text-[#a1a1a6]">
                {g}
              </span>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-col rounded-md border border-[#313134] bg-[#232325] py-1 sm:w-48">
          {["Audio Input Capture", "Browser", "Color Source", "Display Capture", "Game Capture", "Image", "Scene"].map(
            (item) => (
              <span
                key={item}
                className={`px-3 py-1.5 ${item === "Browser" ? "bg-[#9146FF] font-semibold text-[#ffffff]" : "text-[#ededed]"}`}
              >
                {item}
              </span>
            ),
          )}
        </div>
      </div>
    </ObsWindow>
  )
}

function Step2Mock() {
  return (
    <ObsWindow title={"Properties for 'Chat Raid Boss'"}>
      <div className="flex flex-col gap-3">
        <MockCheckbox label="Local file" checked={false} />
        <MockField label="URL" value="https://…/overlay?channel=yourname" highlight />
        <div className="grid grid-cols-2 gap-3">
          <MockField label="Width" value="1920" />
          <MockField label="Height" value="1080" />
        </div>
        <MockField label="Custom CSS" value="body { background-color: rgba(0,0,0,0); }" />
      </div>
    </ObsWindow>
  )
}

function Step3Mock() {
  return (
    <ObsWindow title={"Properties for 'Chat Raid Boss'"}>
      <div className="flex flex-col divide-y divide-[#313134]">
        <MockCheckbox label="Control audio via OBS" checked />
        <MockCheckbox label="Shutdown source when not visible" checked={false} />
        <MockCheckbox label="Refresh browser when scene becomes active" checked />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <span className="rounded bg-[#232325] px-3 py-1.5 text-[#ededed]">Cancel</span>
        <span className="rounded bg-[#9146FF] px-3 py-1.5 font-semibold text-[#ffffff]">OK</span>
      </div>
    </ObsWindow>
  )
}

function Step4Mock() {
  return (
    <ObsWindow title="OBS Studio — Preview">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative aspect-video flex-1 overflow-hidden rounded bg-[#232325]">
          <div className="absolute inset-0 flex items-end p-2">
            <span className="rounded bg-[#19191b] px-1.5 py-0.5 text-[11px] text-[#a1a1a6]">Game Capture</span>
          </div>
          <div className="absolute inset-0 border-2 border-[#e5484d]">
            {["-left-1 -top-1", "-right-1 -top-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((pos) => (
              <span key={pos} className={`absolute size-2 bg-[#e5484d] ${pos}`} />
            ))}
            <div className="mx-auto mt-3 w-3/5">
              <div className="mb-1 text-center text-[11px] font-semibold text-[#ededed]">Raid boss</div>
              <div className="h-2 overflow-hidden rounded-full bg-[#19191b]">
                <div className="h-full w-3/4 bg-[#9146FF]" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:w-44">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a1a1a6]">Sources</p>
          <SourcesDock items={["Chat Raid Boss", "Game Capture", "Mic/Aux"]} active="Chat Raid Boss" />
          <p className="text-[11px] leading-relaxed text-[#a1a1a6]">Top of list = drawn on top</p>
        </div>
      </div>
    </ObsWindow>
  )
}

function Step5Mock() {
  return (
    <ObsWindow title="OBS Studio — Test">
      <div className="flex flex-col gap-3">
        <MockField label="URL" value="https://…/overlay?demo=1" highlight />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <SourcesDock items={["Chat Raid Boss", "Game Capture"]} active="Chat Raid Boss" />
          </div>
          <div className="flex w-full flex-col rounded-md border border-[#313134] bg-[#232325] py-1 sm:w-44">
            {["Copy", "Paste", "Filters", "Interact", "Properties", "Refresh"].map((item) => (
              <span
                key={item}
                className={`px-3 py-1.5 ${item === "Interact" ? "bg-[#9146FF] font-semibold text-[#ffffff]" : "text-[#ededed]"}`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ObsWindow>
  )
}

type Step = { title: string; body: ReactNode; mock: ReactNode; caption: string }

const steps: Step[] = [
  {
    title: "Add a Browser source",
    body: (
      <>
        In the <strong className="text-[#ededed]">Sources</strong> dock, click <Kbd>+</Kbd> and choose{" "}
        <strong className="text-[#ededed]">Browser</strong>. Name it something like &ldquo;Chat Raid Boss&rdquo; and
        press OK.
      </>
    ),
    mock: <Step1Mock />,
    caption: "The Sources dock with the plus button pressed and Browser highlighted in the menu.",
  },
  {
    title: "Paste your overlay URL",
    body: (
      <>
        Paste your overlay link into <strong className="text-[#ededed]">URL</strong>, replacing{" "}
        <Code>yourname</Code> with your channel name. Set <strong className="text-[#ededed]">Width</strong> to{" "}
        <Code>1920</Code> and <strong className="text-[#ededed]">Height</strong> to <Code>1080</Code>.
      </>
    ),
    mock: <Step2Mock />,
    caption: "Browser source properties with the URL field filled in and width 1920, height 1080.",
  },
  {
    title: "Set the source options",
    body: (
      <>
        Scroll down in the same window. Turn <strong className="text-[#ededed]">Shutdown source when not visible</strong>{" "}
        OFF so the fight keeps going while you switch scenes. Turn{" "}
        <strong className="text-[#ededed]">Refresh browser when scene becomes active</strong> ON and{" "}
        <strong className="text-[#ededed]">Control audio via OBS</strong> ON.
      </>
    ),
    mock: <Step3Mock />,
    caption:
      "Checkboxes: Control audio via OBS on, Shutdown source when not visible off, Refresh browser when scene becomes active on.",
  },
  {
    title: "Fill the canvas, above your game",
    body: (
      <>
        Right-click the source → <strong className="text-[#ededed]">Transform</strong> →{" "}
        <strong className="text-[#ededed]">Fit to screen</strong> (or <Kbd>Ctrl</Kbd>+<Kbd>F</Kbd>). Then drag it above
        your Game Capture in the Sources list so the boss draws on top.
      </>
    ),
    mock: <Step4Mock />,
    caption: "Preview showing the overlay covering the full canvas, listed above Game Capture in Sources.",
  },
  {
    title: "Test with demo mode",
    body: (
      <>
        Temporarily change the URL to <Code>/overlay?demo=1</Code> to spawn a practice boss. Right-click the source and
        choose <strong className="text-[#ededed]">Interact</strong> to watch it live and click around. Switch back to
        your channel URL when you&apos;re happy.
      </>
    ),
    mock: <Step5Mock />,
    caption: "URL set to the demo overlay and the source context menu with Interact highlighted.",
  },
]

const troubleshooting: { q: string; a: ReactNode }[] = [
  {
    q: "The overlay is blank",
    a: (
      <>
        Double-check the channel name in your URL — it must match your Twitch login exactly, with no spaces or{" "}
        <Code>@</Code>. Then open the source&apos;s Properties and click{" "}
        <strong className="text-[#ededed]">Refresh cache of current page</strong>.
      </>
    ),
  },
  {
    q: "There's no sound",
    a: (
      <>
        Make sure <strong className="text-[#ededed]">Control audio via OBS</strong> is on. In the Audio Mixer, click
        the ⋮ next to the source → <strong className="text-[#ededed]">Advanced Audio Properties</strong>, and set Audio
        Monitoring to <strong className="text-[#ededed]">Monitor and Output</strong> if you want to hear it yourself.
        Check the source isn&apos;t muted.
      </>
    ),
  },
  {
    q: "Low FPS or stuttering",
    a: (
      <>
        Go to <strong className="text-[#ededed]">Settings → Advanced → Sources</strong> and enable{" "}
        <strong className="text-[#ededed]">Browser Source Hardware Acceleration</strong>, then restart OBS. Keep the
        source at 1920×1080 rather than scaling a larger page down.
      </>
    ),
  },
  {
    q: "Using Streamlabs Desktop",
    a: (
      <>
        Add a <strong className="text-[#ededed]">Browser Source</strong> from the + menu in Sources. The fields are the
        same: paste the URL, set 1920×1080, and leave &ldquo;Shutdown source when not visible&rdquo; unchecked.
      </>
    ),
  },
  {
    q: "Using Twitch Studio",
    a: (
      <>
        Edit your scene, add a layer → <strong className="text-[#ededed]">Embed Webpage</strong>, paste the URL and
        stretch it to fill the canvas. Twitch Studio has fewer audio options, so test sound with demo mode first.
      </>
    ),
  },
]

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-[#232325] px-1.5 py-0.5 font-mono text-[0.9em] text-[#c4a3ff]">{children}</code>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-[#313134] bg-[#232325] px-1.5 py-0.5 font-mono text-[0.85em] text-[#ededed]">
      {children}
    </kbd>
  )
}

export default function ObsSetupPage() {
  return (
    <div className="min-h-dvh bg-[#19191b] font-sans text-[#ededed]">
      <header className="border-b border-[#313134]">
        <nav aria-label="Main" className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/"
            className="rounded font-semibold text-[#ededed] outline-none focus-visible:ring-2 focus-visible:ring-[#b98aff]"
          >
            Chat Raid Boss
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="rounded text-[#a1a1a6] outline-none hover:text-[#ededed] focus-visible:ring-2 focus-visible:ring-[#b98aff]"
            >
              Home
            </Link>
            <Link
              href="/commands"
              className="rounded text-[#a1a1a6] outline-none hover:text-[#ededed] focus-visible:ring-2 focus-visible:ring-[#b98aff]"
            >
              Commands
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-14 px-4 py-10 sm:py-16">
        <section className="flex flex-col gap-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#b98aff]">OBS Studio setup</p>
          <h1 className="text-balance text-3xl font-bold leading-tight sm:text-5xl">Add Chat Raid Boss to OBS</h1>
          <p className="max-w-2xl text-pretty leading-relaxed text-[#a1a1a6]">
            Five steps, about two minutes. You&apos;ll add the overlay as a Browser source, tune a few settings, and test
            it with a practice boss before going live.
          </p>
          <nav aria-label="Steps" className="mt-2">
            <ol className="flex flex-wrap gap-2 text-sm">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <a
                    href={`#step-${i + 1}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[#313134] px-3 py-1.5 text-[#a1a1a6] outline-none transition-transform hover:-translate-y-0.5 hover:text-[#ededed] focus-visible:ring-2 focus-visible:ring-[#b98aff]"
                  >
                    <span className="font-mono text-[#b98aff]">{i + 1}</span>
                    {step.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </section>

        <ol className="flex flex-col gap-14">
          {steps.map((step, i) => (
            <li key={step.title} id={`step-${i + 1}`} className="scroll-mt-6">
              <article className="grid gap-5 md:grid-cols-5 md:gap-8">
                <div className="flex flex-col gap-3 md:col-span-2">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#9146FF] font-mono font-bold text-[#ffffff]"
                    >
                      {i + 1}
                    </span>
                    <h2 className="text-balance text-xl font-semibold">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h2>
                  </div>
                  <p className="text-pretty leading-relaxed text-[#a1a1a6]">{step.body}</p>
                </div>
                <figure className="md:col-span-3">
                  <div aria-hidden="true">{step.mock}</div>
                  <figcaption className="sr-only">{step.caption}</figcaption>
                </figure>
              </article>
            </li>
          ))}
        </ol>

        <section aria-labelledby="troubleshooting" className="flex flex-col gap-5">
          <h2 id="troubleshooting" className="text-2xl font-bold">
            Troubleshooting
          </h2>
          <div className="flex flex-col gap-3">
            {troubleshooting.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-[#313134] bg-[#19191b] open:border-[#5c5c63]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-4 py-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#b98aff] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-[#b98aff] transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-pretty leading-relaxed text-[#a1a1a6]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-start gap-4 rounded-xl border border-[#313134] bg-[#19191b] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Overlay running?</h2>
            <p className="leading-relaxed text-[#a1a1a6]">Teach your chat how to fight the boss.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/commands"
              className="rounded-md bg-[#9146FF] px-4 py-2 font-semibold text-[#ffffff] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#b98aff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#19191b]"
            >
              View chat commands
            </Link>
            <Link
              href="/"
              className="rounded-md border border-[#313134] px-4 py-2 font-semibold text-[#ededed] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#b98aff]"
            >
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
