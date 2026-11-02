"use client";
import { useEffect, useState, type CSSProperties } from "react";

type Props = {
  bossName: string;
  maxHp: number;
  /** ms epoch, 0 = not started */
  startedAt: number;
};

const TOTAL_MS = 2400;
const NAME_DELAY_MS = 120;
const OUT_AT_MS = 2000;
const SWEEP_DELAY_MS = 220;
const SWEEP_MS = 720;
const COUNT_AT_MS = 560;
const TICK_MS = 440;
const COUNT_FROM = 3;
const DIGITS = Array.from({ length: COUNT_FROM }, (_, i) => COUNT_FROM - i);

const KEYFRAMES = `
@keyframes crb-ri-out{from{opacity:1}to{opacity:0}}
@keyframes crb-ri-fade{from{opacity:0}to{opacity:1}}
@keyframes crb-ri-band{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes crb-ri-slam{0%{opacity:0;transform:scale(1.9)}55%{opacity:1;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
@keyframes crb-ri-sweep{from{transform:translateX(-150%) skewX(-20deg)}to{transform:translateX(650%) skewX(-20deg)}}
@keyframes crb-ri-tick{0%{opacity:0;transform:scale(1.7)}22%{opacity:1;transform:scale(1)}78%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}
@keyframes crb-ri-count{from{transform:translateY(0)}to{transform:translateY(-100%)}}
`;

type Run = { key: number; elapsed: number; reduced: boolean };

/**
 * Raid-start banner for a software-rendered OBS browser source.
 * Six animated elements max (wrapper fade-out, band scaleY-in, light sweep, name slam,
 * countdown tick pulse, countdown digit strip), transform/opacity only, no per-frame renders:
 * one effect per `startedAt`, one setTimeout to unmount. Negative animation delays let a
 * source that mounts mid-intro (scene switch / refresh) pick up at the correct point.
 * The digit strip uses steps() so 3-2-1 needs one node instead of three.
 */
export function RaidIntro({ bossName, maxHp, startedAt }: Props) {
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    const elapsed = startedAt > 0 ? Date.now() - startedAt : Number.POSITIVE_INFINITY;
    if (elapsed >= TOTAL_MS) {
      setRun(null);
      return;
    }
    const e = Math.max(0, elapsed);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setRun({ key: startedAt, elapsed: e, reduced });
    const id = window.setTimeout(() => setRun(null), TOTAL_MS - e);
    return () => window.clearTimeout(id);
  }, [startedAt]);

  if (!run) return null;

  const { elapsed: e, reduced } = run;
  const hp = maxHp.toLocaleString();

  const wrapperAnim: CSSProperties = {
    animation: `crb-ri-out 400ms ease-in ${OUT_AT_MS - e}ms both`,
    willChange: "opacity",
  };
  const bandAnim: CSSProperties = reduced
    ? { animation: `crb-ri-fade 200ms ease-out ${-e}ms both`, willChange: "opacity" }
    : {
        animation: `crb-ri-band 260ms cubic-bezier(.2,.8,.2,1) ${-e}ms both`,
        willChange: "transform",
      };
  const nameAnim: CSSProperties | undefined = reduced
    ? undefined
    : {
        animation: `crb-ri-slam 380ms cubic-bezier(.2,.9,.3,1.25) ${NAME_DELAY_MS - e}ms both`,
        willChange: "transform, opacity",
      };
  const sweepAnim: CSSProperties = {
    animation: `crb-ri-sweep ${SWEEP_MS}ms cubic-bezier(.55,0,.25,1) ${SWEEP_DELAY_MS - e}ms both`,
    willChange: "transform",
    background:
      "linear-gradient(90deg, transparent, rgba(253,247,251,0.32) 50%, transparent)",
  };
  const tickAnim: CSSProperties = reduced
    ? {
        animation: `crb-ri-fade 150ms linear ${COUNT_AT_MS - e}ms both`,
        willChange: "opacity",
      }
    : {
        animation: `crb-ri-tick ${TICK_MS}ms cubic-bezier(.2,.9,.3,1) ${COUNT_AT_MS - e}ms ${COUNT_FROM} both`,
        willChange: "transform, opacity",
      };
  const stripAnim: CSSProperties = {
    animation: `crb-ri-count ${TICK_MS * COUNT_FROM}ms steps(${COUNT_FROM}, end) ${COUNT_AT_MS - e}ms both`,
    willChange: "transform",
  };

  return (
    <>
      <style href="crb-raid-intro-keyframes" precedence="medium">
        {KEYFRAMES}
      </style>
      <div
        key={run.key}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[39%] z-20 h-[22%] [contain:layout_paint]"
        style={wrapperAnim}
      >
        <div
          className="@container relative flex h-full w-full items-center justify-center gap-[2.5cqw] overflow-hidden border-y-4 border-[#ff4d6d] bg-[#141415]/92 px-[3cqw]"
          style={bandAnim}
        >
          <div className="flex h-[1.25em] w-[1.05em] shrink-0 items-center justify-center border-2 border-[#ff4d6d] text-[clamp(1.5rem,7cqw,9rem)] font-black leading-none text-[#fdf7fb]">
            <div className="h-[1em] overflow-hidden" style={tickAnim}>
              <div className="flex flex-col font-mono tabular-nums" style={stripAnim}>
                {DIGITS.map((d) => (
                  <span key={d} className="flex h-[1em] items-center justify-center">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-start gap-[0.6cqw] text-left">
            <span className="flex items-center gap-[0.8cqw] text-[clamp(0.625rem,1.1cqw,1.5rem)] font-black uppercase leading-none tracking-[0.5em] text-[#ff8fa3]">
              <span className="h-[2px] w-[3cqw] bg-[#ff4d6d]" />
              Raid starting
            </span>
            <span
              className="block max-w-full origin-left truncate text-[clamp(1.25rem,6cqw,8rem)] font-black uppercase italic leading-[0.9] tracking-tight text-[#fdf7fb]"
              style={nameAnim}
            >
              {bossName}
            </span>
            <span className="text-[clamp(0.75rem,1.4cqw,2rem)] font-bold leading-none text-[#fdf7fb]">
              <span className="font-mono tabular-nums">{hp}</span> HP · type{" "}
              <span className="font-mono text-[#ff8fa3]">!atk</span> in chat
            </span>
          </div>

          {!reduced && (
            <div className="absolute inset-y-0 left-0 w-[18%]" style={sweepAnim} />
          )}
        </div>
      </div>
      <p role="status" className="sr-only">
        {`Raid start: ${bossName}, ${hp} HP. Type !atk in chat to attack.`}
      </p>
    </>
  );
}
