"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Arena } from "@/components/Arena";
import { AchievementToasts } from "@/components/AchievementToasts";
import { CompactArena } from "@/components/CompactArena";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { configFromParams } from "@/lib/config";
import { useRaid } from "@/lib/useRaid";
import { setMuted } from "@/lib/sfx";

/** Design width; the overlay scales uniformly to the browser-source width (720p, 1080p, 1440p all look identical). */
const DESIGN_W = 1280;
const CONNECTED_TOAST_MS = 2600;

type Tone = "neutral" | "amber" | "red" | "teal";
type Indicator = "spinner" | "ping" | "dots" | "static";

const TONES: Record<Tone, { ring: string; dot: string; text: string }> = {
  neutral: { ring: "border-white/15", dot: "bg-[#a1a1a6]", text: "text-[#a1a1a6]" },
  amber: { ring: "border-[#ffb547]/45", dot: "bg-[#ffb547]", text: "text-[#ffd08a]" },
  red: { ring: "border-[#ff6b6b]/50", dot: "bg-[#ff6b6b]", text: "text-[#ffa3a3]" },
  teal: { ring: "border-[#4affb4]/45", dot: "bg-[#4affb4]", text: "text-[#9dffd6]" },
};

function HudPill({
  tone,
  indicator,
  title,
  detail,
  fadeOut,
}: {
  tone: Tone;
  indicator: Indicator;
  title: string;
  detail?: ReactNode;
  fadeOut?: boolean;
}) {
  const t = TONES[tone];
  return (
    <div
      className={`flex items-center gap-3 rounded-md border ${t.ring} bg-[#19191b]/90 py-2 pl-3 pr-4 text-[#ededed]`}
      style={{
        animation: fadeOut
          ? `crb-hud-in 240ms cubic-bezier(.2,.8,.2,1) both, crb-hud-out ${CONNECTED_TOAST_MS}ms ease-in both`
          : "crb-hud-in 240ms cubic-bezier(.2,.8,.2,1) both",
      }}
    >
      <span aria-hidden="true" className="relative flex size-4 shrink-0 items-center justify-center">
        {indicator === "spinner" && (
          <span
            className={`size-4 rounded-full border-2 border-current border-r-transparent ${t.text}`}
            style={{ animation: "crb-hud-spin 900ms linear infinite" }}
          />
        )}
        {indicator === "ping" && (
          <>
            <span className={`absolute size-2.5 rounded-full ${t.dot}`} style={{ animation: "crb-hud-ping 1.6s ease-out infinite" }} />
            <span className={`relative size-2.5 rounded-full ${t.dot}`} />
          </>
        )}
        {indicator === "dots" && (
          <span className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full ${t.dot}`}
                style={{ animation: `crb-hud-bounce 1.2s ease-in-out ${i * 150}ms infinite` }}
              />
            ))}
          </span>
        )}
        {indicator === "static" && (
          <span className={`size-2.5 rounded-full ${t.dot}`} style={{ animation: "crb-hud-breathe 2s ease-in-out infinite" }} />
        )}
      </span>
      <span className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-sm font-semibold tracking-wide">{title}</span>
        {detail && <span className={`text-sm ${t.text}`}>{detail}</span>}
      </span>
    </div>
  );
}

export function OverlayClient() {
  const q = useSearchParams();
  const channel = (q.get("channel") ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 25);
  const demo = q.get("demo") === "1" || !channel;
  const sound = q.get("sound") !== "0";
  const waitForMod = q.get("wait") === "1";
  const config = useMemo(() => configFromParams(q), [q]);
  const { state, status, narrator, now } = useRaid({ channel, demo, config, autostart: !waitForMod, eventsub: q.get("eventsub") === "1" });
  const [scale, setScale] = useState(1);
  const [everConnected, setEverConnected] = useState(false);
  const [connectedToast, setConnectedToast] = useState(false);

  useEffect(() => {
    document.body.classList.add("overlay");
    const fit = () => setScale(window.innerWidth / DESIGN_W);
    fit();
    window.addEventListener("resize", fit);
    return () => {
      document.body.classList.remove("overlay");
      window.removeEventListener("resize", fit);
    };
  }, []);

  // OBS browser sources may autoplay audio; regular browsers unlock on first click.
  useEffect(() => {
    if (!sound) return;
    setMuted(false);
    const unlock = () => setMuted(false);
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      setMuted(true);
    };
  }, [sound]);

  // Brief "connected" confirmation, then the HUD gets out of the way of the stream.
  useEffect(() => {
    if (status !== "connected" || demo) return;
    setEverConnected(true);
    setConnectedToast(true);
    const id = setTimeout(() => setConnectedToast(false), CONNECTED_TOAST_MS);
    return () => clearTimeout(id);
  }, [status, demo]);

  const chan = <span className="font-mono">#{channel}</span>;
  let hud: ReactNode = null;
  if (!demo && status === "idle") {
    hud = <HudPill tone="neutral" indicator="spinner" title="Loading overlay" />;
  } else if (!demo && status === "connecting") {
    hud = everConnected ? (
      <HudPill tone="amber" indicator="dots" title="Reconnecting to chat" detail={chan} />
    ) : (
      <HudPill tone="amber" indicator="spinner" title="Connecting to" detail={chan} />
    );
  } else if (!demo && status === "error") {
    hud = <HudPill tone="red" indicator="static" title="Chat connection lost" detail="retrying shortly" />;
  } else if (!demo && status === "closed") {
    hud = <HudPill tone="neutral" indicator="static" title="Chat disconnected" detail={chan} />;
  } else if (state.phase === "lobby") {
    hud = <HudPill tone="teal" indicator="ping" title="Waiting for a mod" detail="to start the raid" />;
  } else if (state.feed.length === 0 && !demo) {
    hud = <HudPill tone="teal" indicator="ping" title="Raid is live" detail="type in chat to attack" />;
  } else if (connectedToast) {
    hud = <HudPill tone="teal" indicator="static" title="Connected to" detail={chan} fadeOut />;
  }

  return (
    <main
      style={{ width: DESIGN_W, transform: `scale(${scale})`, transformOrigin: "top left" }}
      className="relative p-6"
      data-testid="overlay"
    >
      <h1 className="sr-only">Chat Raid Boss live overlay</h1>
      <div role="status" aria-live="polite" className="pointer-events-none absolute left-1/2 top-9 z-20 flex -translate-x-1/2 justify-center">
        {hud}
      </div>
      <ErrorBoundary label="Overlay hiccup">
        {q.get("layout") === "compact" ? (
          <div className="flex justify-end"><CompactArena state={state} now={now} /></div>
        ) : (
        <div className="rounded-3xl bg-transparent">
          <Arena state={state} status={status} narrator={narrator} channel={demo ? "" : channel} now={now} transparent />
          <AchievementToasts state={state} />
        </div>
        )}
      </ErrorBoundary>
    </main>
  );
}
