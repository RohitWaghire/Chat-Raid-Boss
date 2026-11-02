"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

type ShareKitProps = {
  channel: string;
};

type PanelVariant = {
  variant: "play" | "commands" | "bits";
  label: string;
  alt: string;
};

const PANELS: PanelVariant[] = [
  {
    variant: "play",
    label: "How to play",
    alt: "Twitch panel: How to play Chat Raid Boss — type commands in chat to attack the boss",
  },
  {
    variant: "commands",
    label: "Commands",
    alt: "Twitch panel: list of Chat Raid Boss chat commands such as !atk",
  },
  {
    variant: "bits",
    label: "Bits",
    alt: "Twitch panel: cheer Bits to deal bonus damage to the raid boss",
  },
];

const COPIED_MS = 1600;
const MANUAL_MS = 4000;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a970ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141415]";

const noopSubscribe = () => () => {};
const getClientOrigin = () => window.location.origin;
const getServerOrigin = () => "";

function useOrigin() {
  return useSyncExternalStore(noopSubscribe, getClientOrigin, getServerOrigin);
}

function toSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "channel";
}

type CopyStatus = "idle" | "copied" | "manual";

function useCopy() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const flag = useCallback((next: Exclude<CopyStatus, "idle">) => {
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), next === "copied" ? COPIED_MS : MANUAL_MS);
  }, []);

  const copy = useCallback(
    async (text: string, field: HTMLInputElement | HTMLTextAreaElement | null) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          flag("copied");
          return;
        }
        throw new Error("Clipboard API unavailable");
      } catch {
        if (!field) return;
        field.focus();
        field.select();
        field.setSelectionRange(0, text.length);
        let ok = false;
        try {
          // Legacy fallback for insecure contexts / iframes without clipboard permission.
          ok = document.execCommand("copy");
        } catch {
          ok = false;
        }
        // Text stays selected so the user can finish with a keyboard shortcut.
        flag(ok ? "copied" : "manual");
      }
    },
    [flag],
  );

  return { status, copied: status === "copied", copy };
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function SwordIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
      <path d="m13 19 6-6" />
      <path d="m16 16 4 4" />
      <path d="m19 21 2-2" />
    </svg>
  );
}

function CopyButton({
  copied,
  onClick,
  label,
}: {
  copied: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-11 min-w-[5.5rem] shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 motion-safe:active:scale-95 ${
        copied ? "bg-[#5c16c5]" : "bg-[#9146FF] hover:bg-[#6a22d6]"
      } ${FOCUS_RING}`}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <span
          className={`absolute inset-0 motion-safe:transition-[transform,opacity] motion-safe:duration-200 ${
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <CopyIcon />
        </span>
        <span
          className={`absolute inset-0 motion-safe:transition-[transform,opacity] motion-safe:duration-200 ${
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <CheckIcon />
        </span>
      </span>
      <span>{copied ? "Copied" : "Copy"}</span>
      <span className="sr-only"> {label}</span>
    </button>
  );
}

function SectionHeading({ children, htmlFor, id }: { children: React.ReactNode; htmlFor?: string; id?: string }) {
  const className = "text-xs font-semibold uppercase tracking-wider text-white/75";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <h3 id={id} className={className}>
      {children}
    </h3>
  );
}

type TileState = "loading" | "ready" | "error";

function PanelTile({ panel, slug }: { panel: PanelVariant; slug: string }) {
  const src = `/panel?variant=${panel.variant}`;
  const [state, setState] = useState<TileState>("loading");

  // Lazy images can finish loading before hydration attaches onLoad.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setState(node.naturalWidth > 0 ? "ready" : "error");
  }, []);

  return (
    <li className="group flex min-w-0 flex-col gap-2">
      <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition-[box-shadow,transform] duration-200 group-hover:ring-[#a970ff]/60 group-focus-within:ring-2 group-focus-within:ring-[#a970ff] motion-safe:group-hover:-translate-y-0.5">
        {state === "loading" && (
          <span aria-hidden="true" className="absolute inset-0 bg-white/5 motion-safe:animate-pulse" />
        )}
        {state === "error" && (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-white/70">
            No preview
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={panel.alt}
          width={320}
          height={160}
          loading="lazy"
          decoding="async"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            state === "ready" ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      <p className="truncate text-xs font-medium text-white/90" aria-hidden="true">
        {panel.label}
      </p>
      <a
        href={src}
        download={`${slug}-panel-${panel.variant}.png`}
        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2 text-xs font-semibold text-[#bf94ff] ring-1 ring-inset ring-white/10 transition-[background-color,transform] duration-150 hover:bg-white/10 hover:text-white motion-safe:active:scale-95 ${FOCUS_RING}`}
      >
        <DownloadIcon />
        <span>PNG</span>
        <span className="sr-only">
          {" "}
          — download {panel.label} panel image
        </span>
      </a>
    </li>
  );
}

function CopyField({
  label,
  hint,
  value,
  multiline = false,
  copyLabel,
  successMessage,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: string;
  multiline?: boolean;
  copyLabel: string;
  successMessage: string;
}) {
  const inputId = useId();
  const hintId = useId();
  const statusId = useId();
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const { status, copied, copy } = useCopy();

  const fieldClass = `min-h-11 w-full min-w-0 rounded-lg bg-white/5 px-3 font-mono text-sm text-white/90 ring-1 ring-inset transition-[box-shadow] duration-150 selection:bg-[#9146FF] selection:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a970ff] ${
    copied ? "ring-[#a970ff]/70" : "ring-white/10"
  }`;

  const describedBy = [hint ? hintId : null, statusId].filter(Boolean).join(" ");

  const message =
    status === "copied"
      ? successMessage
      : status === "manual"
        ? "Text selected. Press Ctrl+C or Command+C to copy."
        : "";

  return (
    <div className="flex flex-col gap-2">
      <SectionHeading htmlFor={inputId}>{label}</SectionHeading>
      {hint && (
        <p id={hintId} className="text-sm leading-relaxed text-white/75">
          {hint}
        </p>
      )}
      <div className={`flex gap-2 ${multiline ? "items-start" : "items-center"}`}>
        {multiline ? (
          <textarea
            ref={fieldRef}
            id={inputId}
            readOnly
            rows={3}
            value={value}
            onFocus={(e) => e.currentTarget.select()}
            aria-describedby={describedBy}
            className={`${fieldClass} resize-none py-2.5 leading-relaxed`}
          />
        ) : (
          <input
            ref={fieldRef}
            id={inputId}
            type="text"
            readOnly
            value={value}
            onFocus={(e) => e.currentTarget.select()}
            aria-describedby={describedBy}
            className={`${fieldClass} truncate`}
          />
        )}
        <CopyButton label={copyLabel} copied={copied} onClick={() => copy(value, fieldRef.current)} />
      </div>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`min-h-5 text-xs leading-5 ${status === "manual" ? "text-[#f5c451]" : "text-[#bf94ff]"}`}
      >
        {message}
      </p>
    </div>
  );
}

export default function ShareKit({ channel }: ShareKitProps) {
  const headingId = useId();
  const panelsHeadingId = useId();

  const origin = useOrigin();
  const guideUrl = `${origin}/commands`;
  const commandText = `Fight the boss! Type !atk in chat. Guide: ${guideUrl}`;
  const slug = toSlug(channel);

  return (
    <section
      aria-labelledby={headingId}
      className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-[#141415] text-white shadow-2xl shadow-black/40 ring-1 ring-white/10"
    >
      <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9146FF] text-white">
          <SwordIcon />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 id={headingId} className="text-base font-semibold tracking-tight text-white text-balance">
            Streamer kit
          </h2>
          <p className="truncate text-sm text-white/75">
            for <span className="font-medium text-[#bf94ff]">{channel || "your channel"}</span>
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-5 py-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <SectionHeading id={panelsHeadingId}>Twitch panels</SectionHeading>
            <span className="text-xs text-white/70">320 × 160 PNG</span>
          </div>
          <ul aria-labelledby={panelsHeadingId} className="grid grid-cols-3 gap-3">
            {PANELS.map((panel) => (
              <PanelTile key={panel.variant} panel={panel} slug={slug} />
            ))}
          </ul>
        </div>

        <div className="h-px bg-white/10" aria-hidden="true" />

        <CopyField
          label="Viewer guide"
          value={guideUrl}
          copyLabel="viewer guide link"
          successMessage="Viewer guide link copied to clipboard"
        />

        <CopyField
          label={"!raid chat command"}
          hint={
            <>
              Paste as the response for a Nightbot or StreamElements{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[#bf94ff]">!raid</code> command.
            </>
          }
          value={commandText}
          multiline
          copyLabel="chat command"
          successMessage="Chat command copied to clipboard"
        />
      </div>
    </section>
  );
}
