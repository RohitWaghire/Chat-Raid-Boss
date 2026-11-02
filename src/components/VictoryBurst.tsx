"use client"

import { useEffect, useState, type CSSProperties } from "react"

const DURATION_MS = 2600
const RAY_COUNT = 12
const SHARD_COUNT = 18

type Vars = CSSProperties & Record<`--${string}`, string>

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const SHARD_CLIPS = [
  "polygon(50% 0, 100% 38%, 78% 100%, 8% 82%, 0 24%)",
  "polygon(0 0, 100% 18%, 62% 100%)",
  "polygon(22% 0, 100% 52%, 48% 100%, 0 64%)",
  "polygon(40% 0, 100% 100%, 0 78%)",
  "polygon(0 12%, 72% 0, 100% 70%, 30% 100%)",
]

const SHARD_COLORS = ["var(--crb-p)", "var(--crb-g)", "var(--crb-p)", "var(--crb-w)", "var(--crb-g)", "var(--crb-p)"]

const SHARDS = Array.from({ length: SHARD_COUNT }, (_, i) => {
  const angle = (i / SHARD_COUNT) * Math.PI * 2 + (seeded(i, 1) - 0.5) * 0.5
  const clusterRadius = 24 + seeded(i, 2) * 96
  const flyDistance = 520 + seeded(i, 3) * 260
  const size = Math.round(58 + seeded(i, 4) * 64)
  const spin = Math.round((seeded(i, 5) - 0.5) * 1080)
  return {
    size,
    clip: SHARD_CLIPS[i % SHARD_CLIPS.length],
    color: SHARD_COLORS[i % SHARD_COLORS.length],
    vars: {
      "--ox": `${Math.round(Math.cos(angle) * clusterRadius)}px`,
      "--oy": `${Math.round(Math.sin(angle) * clusterRadius * 1.2)}px`,
      "--tx": `${Math.round(Math.cos(angle) * flyDistance)}px`,
      "--ty": `${Math.round(Math.sin(angle) * flyDistance * 0.75)}px`,
      "--r": `${spin}deg`,
    },
  }
})

const CRACK_PATHS = [
  "M780 290 L842 248 L905 262 L990 180 L1080 160 L1280 60",
  "M780 290 L860 322 L940 310 L1030 382 L1140 400 L1280 472",
  "M780 290 L792 372 L760 452 L802 542 L770 640 L792 720",
  "M780 290 L720 342 L640 330 L560 412 L430 432 L300 522 L160 540",
  "M780 290 L742 230 L680 202 L642 110 L560 62 L520 0",
  "M780 290 L822 210 L810 130 L872 40 L862 0",
  "M842 248 L882 198 L952 190 L1010 120",
  "M640 330 L600 262 L520 242 L420 180 L330 190",
]

const CSS = `
.crb-vb-root{--crb-g:#F5C542;--crb-p:#8B5CF6;--crb-w:#FFFFFF;--crb-d:#140B22;--crb-r:#E5383B;contain:layout paint style}
.crb-vb-anim{animation-duration:${DURATION_MS}ms;animation-fill-mode:both;animation-timing-function:linear;will-change:transform,opacity}
.crb-vb-flash{animation-name:crb-vb-flash}
.crb-vb-rays{animation-name:crb-vb-rays;animation-timing-function:cubic-bezier(.2,.6,.3,1)}
.crb-vb-ray{transform-origin:50% 0;clip-path:polygon(50% 0,100% 100%,0 100%);animation-name:crb-vb-ray}
.crb-vb-shard{animation-name:crb-vb-shard}
.crb-vb-stamp{transform:rotate(-7deg);animation-name:crb-vb-stamp}
.crb-vb-sub{animation-name:crb-vb-sub}
.crb-vb-vignette{animation-name:crb-vb-vignette;animation-timing-function:ease-in-out}
.crb-vb-cracks{animation-name:crb-vb-out}
.crb-vb-crack{stroke-dasharray:1;stroke-dashoffset:1;animation:crb-vb-draw 520ms cubic-bezier(.3,.7,.2,1) both}
@keyframes crb-vb-flash{0%{opacity:0}2%{opacity:.95}14%{opacity:0}35%{opacity:0}37%{opacity:.28}44%{opacity:0}100%{opacity:0}}
@keyframes crb-vb-rays{0%{opacity:0;transform:rotate(0deg)}6%{opacity:1}72%{opacity:1}92%{opacity:0}100%{opacity:0;transform:rotate(34deg)}}
@keyframes crb-vb-ray{0%{transform:rotate(var(--a)) scaleY(0)}16%{transform:rotate(var(--a)) scaleY(1)}100%{transform:rotate(var(--a)) scaleY(1.08)}}
@keyframes crb-vb-shard{
0%{opacity:0;transform:translate(var(--ox),var(--oy)) rotate(0deg) scale(.6)}
4%{opacity:1;transform:translate(var(--ox),var(--oy)) rotate(0deg) scale(1)}
8%{opacity:1;transform:translate(var(--ox),var(--oy)) rotate(0deg) scale(1);animation-timing-function:cubic-bezier(.12,.75,.3,1)}
40%{opacity:1}
50%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--r)) scale(.7)}
100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--r)) scale(.7)}}
@keyframes crb-vb-stamp{
0%,26%{opacity:0;transform:rotate(-7deg) scale(2.2);animation-timing-function:cubic-bezier(.55,0,.9,.4)}
36%{opacity:1;transform:rotate(-7deg) scale(.93);animation-timing-function:ease-out}
41%{transform:rotate(-7deg) scale(1.05);animation-timing-function:ease-in-out}
46%{transform:rotate(-7deg) scale(1)}
85%{opacity:1;transform:rotate(-7deg) scale(1)}
100%{opacity:0;transform:rotate(-7deg) scale(1.04)}}
@keyframes crb-vb-sub{0%,42%{opacity:0;transform:translateY(14px)}50%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(0)}}
@keyframes crb-vb-vignette{0%{opacity:0}18%{opacity:.9}38%{opacity:.45}58%{opacity:.85}82%{opacity:.6}100%{opacity:0}}
@keyframes crb-vb-out{0%,85%{opacity:1}100%{opacity:0}}
@keyframes crb-vb-draw{to{stroke-dashoffset:0}}
@keyframes crb-vb-fade{0%{opacity:0}12%{opacity:1}85%{opacity:1}100%{opacity:0}}
.crb-vb-flash,.crb-vb-rays{display:none}
@media (prefers-reduced-motion:reduce){
.crb-vb-fx{display:none!important}
.crb-vb-stamp,.crb-vb-sub{animation-name:crb-vb-fade!important;will-change:opacity}
}
`

export function VictoryBurst({ win, bossName }: { win: boolean; bossName: string }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  if (done) return null

  const accent = win ? "var(--crb-g)" : "var(--crb-r)"

  return (
    <div aria-hidden="true" className="crb-vb-root pointer-events-none absolute inset-0 z-20 overflow-hidden font-sans">
      <style>{CSS}</style>

      {win ? (
        <>
          <div className="crb-vb-fx crb-vb-anim crb-vb-rays absolute left-1/2 top-1/2 h-0 w-0">
            {Array.from({ length: RAY_COUNT }, (_, i) => (
              <div
                key={i}
                className="crb-vb-anim crb-vb-ray absolute top-0"
                style={
                  {
                    left: -70,
                    width: 140,
                    height: 820,
                    background: i % 2 === 0 ? "var(--crb-g)" : "var(--crb-w)",
                    opacity: i % 2 === 0 ? 0.22 : 0.12,
                    "--a": `${(360 / RAY_COUNT) * i}deg`,
                  } as Vars
                }
              />
            ))}
          </div>

          {SHARDS.map((shard, i) => (
            <div
              key={i}
              className="crb-vb-fx crb-vb-anim crb-vb-shard absolute"
              style={
                {
                  left: `calc(50% - ${shard.size / 2}px)`,
                  top: `calc(50% - ${shard.size / 2}px)`,
                  width: shard.size,
                  height: shard.size,
                  background: shard.color,
                  clipPath: shard.clip,
                  ...shard.vars,
                } as Vars
              }
            />
          ))}

          <div className="crb-vb-fx crb-vb-anim crb-vb-flash absolute inset-0" style={{ background: "var(--crb-w)" }} />
        </>
      ) : (
        <>
          <div
            className="crb-vb-fx crb-vb-anim crb-vb-vignette absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 38%, rgba(229,56,59,.55) 78%, rgba(120,10,16,.9) 100%)",
            }}
          />
          <svg
            className="crb-vb-fx crb-vb-anim crb-vb-cracks absolute inset-0 h-full w-full"
            viewBox="0 0 1280 720"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {CRACK_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength={1}
                className="crb-vb-crack"
                stroke="#FFE3E3"
                strokeWidth={i > 5 ? 1.75 : 3}
                strokeLinejoin="miter"
                strokeLinecap="square"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              />
            ))}
          </svg>
        </>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div
          className="crb-vb-anim crb-vb-stamp whitespace-nowrap px-10 py-3 text-[104px] font-black uppercase leading-none tracking-tight"
          style={{
            color: accent,
            border: `8px solid ${accent}`,
            outline: `3px solid ${accent}`,
            outlineOffset: -18,
            background: "rgba(20,11,34,.86)",
          }}
        >
          {win ? "Raid Cleared" : "Boss Survives"}
        </div>
        <p
          className="crb-vb-anim crb-vb-sub max-w-[900px] text-balance px-6 py-1 text-center text-[32px] font-bold leading-snug"
          style={{ color: "var(--crb-w)", background: "rgba(20,11,34,.72)" }}
        >
          {win ? `${bossName} has fallen` : `${bossName} still stands`}
        </p>
      </div>
    </div>
  )
}
