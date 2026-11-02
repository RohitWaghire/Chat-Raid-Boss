"use client";
/** Tiny synthesized sound effects (Web Audio, no asset files). */
let ctx: AudioContext | null = null;
let muted = true;
let last = 0;

export function setMuted(m: boolean) {
  muted = m;
  if (!m && !ctx && typeof window !== "undefined") ctx = new AudioContext();
  ctx?.resume?.();
}
export const isMuted = () => muted;

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, slide = 0) {
  if (muted || !ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

export type Sfx = "hit" | "crit" | "combo" | "bits" | "ult" | "heal" | "boss" | "win" | "lose" | "phase";

export function play(s: Sfx) {
  const now = performance.now();
  // Throttle small hits so a chat flood doesn't become noise.
  if (s === "hit" && now - last < 70) return;
  last = now;
  switch (s) {
    case "hit": return tone(220 + Math.random() * 80, 0.08, "square", 0.04, -120);
    case "crit": tone(660, 0.12, "sawtooth", 0.07, -300); return tone(990, 0.08, "square", 0.04);
    case "combo": return [0, 1, 2].forEach((i) => setTimeout(() => tone(440 * 1.26 ** i, 0.1, "triangle", 0.07), i * 60));
    case "bits": return [0, 1, 2, 3].forEach((i) => setTimeout(() => tone(880 * 1.12 ** i, 0.09, "sine", 0.06), i * 50));
    case "ult": tone(110, 0.9, "sawtooth", 0.12, -60); return tone(880, 0.6, "triangle", 0.06, 600);
    case "heal": return tone(523, 0.25, "sine", 0.06, 260);
    case "boss": return tone(90, 0.5, "sawtooth", 0.12, -40);
    case "phase": return tone(150, 0.7, "square", 0.08, 150);
    case "win": return [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, "triangle", 0.08), i * 140));
    case "lose": return [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.35, "sawtooth", 0.06), i * 180));
  }
}
