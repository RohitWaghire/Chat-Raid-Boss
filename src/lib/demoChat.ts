import type { ChatMessage } from "./types";

const NAMES = [
  ["PixelPaladin", "#9146FF"], ["NoScopeNana", "#FF4A4A"], ["ChatGoblin42", "#4AFFB4"], ["LagLord", "#FFD24A"],
  ["kappa_kween", "#FF7AE0"], ["SpeedrunSam", "#4AC8FF"], ["mod_mittens", "#00E5A0"], ["TiltedTurtle", "#FF9F1C"],
  ["BitBaron", "#C77DFF"], ["emote_enjoyer", "#7AE7FF"], ["CozyCrit", "#FF6B6B"], ["DPSDad", "#B8F35A"],
] as const;

const LINES: [string, number][] = [
  ["!atk", 34], ["!attack", 6], ["!heal", 7], ["!shield", 6], ["PogChamp", 10], ["LUL", 6], ["KEKW", 6],
  ["omg the boss is huge", 2], ["we got this chat", 2], ["!atk let's gooo", 4], ["GG", 1], ["Kappa", 3],
];
const total = LINES.reduce((a, [, w]) => a + w, 0);
let n = 0;

export function randomDemoMessage(): ChatMessage {
  let r = Math.random() * total;
  let text = LINES[0][0];
  for (const [t, w] of LINES) {
    if ((r -= w) <= 0) {
      text = t;
      break;
    }
  }
  const [user, color] = NAMES[Math.floor(Math.random() * NAMES.length)];
  const bits = Math.random() < 0.03 ? [100, 200, 500][Math.floor(Math.random() * 3)] : 0;
  return {
    id: `demo-${n++}`,
    user,
    color,
    text: bits ? `Cheer${bits} take that!` : text,
    bits,
    isSub: user.length % 2 === 0,
    isMod: user.startsWith("mod_"),
    ts: Date.now(),
  };
}
