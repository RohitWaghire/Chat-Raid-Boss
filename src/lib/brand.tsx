export const BRAND = {
  name: "Chat Raid Boss",
  tagline: "Your whole chat. One raid boss.",
  description:
    "A drop-in OBS overlay where Twitch chat teams up to fight an AI-narrated raid boss live on stream.",
  purple: "#9146FF",
  purpleLight: "#cfa8ff",
  purpleDark: "#35106b",
  night: "#0e0618",
  ink: "#1a0b2e",
  paper: "#f6efff",
  hp: "#ff4d6d",
} as const;

const INK = BRAND.ink;
const MIRROR = "matrix(-1 0 0 1 200 0)";
const WING_PATH = "M58 80 L18 20 Q24 44 6 52 Q26 58 14 78 Q34 80 30 98 Q44 96 54 112 Z";
const HORN_PATH = "M70 60 C62 46 54 30 48 10 C64 22 80 38 86 54 Z";

/**
 * Static, satori-safe version of the boss (fight palette).
 * `head` crops to horns + face for tiny icon sizes.
 */
export function BossMascot({ size, head = false }: { size: number; head?: boolean }) {
  const stroke = head ? 4 : 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox={head ? "22 6 156 156" : "0 0 200 200"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="body" cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor={BRAND.purpleLight} />
          <stop offset="45%" stopColor={BRAND.purple} />
          <stop offset="100%" stopColor={BRAND.purpleDark} />
        </radialGradient>
        <linearGradient id="wing" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={BRAND.purpleDark} />
          <stop offset="60%" stopColor={BRAND.purple} />
          <stop offset="100%" stopColor={BRAND.purpleLight} />
        </linearGradient>
        <linearGradient id="horn" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c9b0ea" />
          <stop offset="100%" stopColor="#fff8ec" />
        </linearGradient>
        <radialGradient id="iris" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe98a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>

      {!head &&
        [undefined, MIRROR].map((t, i) => (
          <g key={`w${i}`} transform={t}>
            <path d={WING_PATH} fill="url(#wing)" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path
              d="M56 86 L8 52 M56 92 L14 78 M54 100 L30 98"
              stroke={BRAND.purpleDark}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        ))}

      {[undefined, MIRROR].map((t, i) => (
        <g key={`h${i}`} transform={t}>
          <path d={HORN_PATH} fill="url(#horn)" stroke={INK} strokeWidth={stroke - 0.5} strokeLinejoin="round" />
        </g>
      ))}

      <path
        d="M86 50 L93 36 L100 48 L107 36 L114 50 Z"
        fill={BRAND.purpleDark}
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <ellipse cx="100" cy="100" rx="62" ry="58" fill="url(#body)" stroke={INK} strokeWidth={stroke} />
      <ellipse cx="76" cy="62" rx="20" ry="9" fill="#ffffff" opacity="0.35" transform="rotate(-20 76 62)" />
      <path
        d="M138 58 A59 55 0 0 1 153.5 123.2"
        stroke="#efe2ff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      <g fill="#ff7ab8" opacity="0.4">
        <ellipse cx="60" cy="112" rx="9" ry="4.5" />
        <ellipse cx="140" cy="112" rx="9" ry="4.5" />
      </g>

      {[76, 124].map((cx, i) => {
        const px = cx + (i === 0 ? 2 : -2);
        return (
          <g key={`e${cx}`}>
            <ellipse cx={cx} cy="90" rx="15" ry="13" fill={INK} />
            <ellipse cx={cx} cy="90" rx="13" ry="11" fill="#ffffff" />
            <circle cx={px} cy="92" r="7.5" fill="url(#iris)" />
            <ellipse cx={px} cy="92" rx="2.2" ry="6" fill={INK} />
            <circle cx={px - 2.5} cy="89" r="2.4" fill="#ffffff" />
          </g>
        );
      })}

      <path d="M58 72 L92 80 L90 86 L60 79 Z M142 72 L108 80 L110 86 L140 79 Z" fill={INK} />

      <path d="M70 120 Q100 150 130 120 Q100 128 70 120 Z" fill={INK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="100" cy="137" rx="12" ry="5" fill="#ff5f9e" />
      <path
        d="M78 122 L84 135 L90 125 Z M110 125 L116 135 L122 122 Z"
        fill="#fffaf2"
        stroke={INK}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
