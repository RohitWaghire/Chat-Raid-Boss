import { useId, type CSSProperties, type ReactNode } from "react";
import type { Phase } from "@/lib/types";

type Palette = {
  light: string;
  base: string;
  dark: string;
  rim: string;
  glow: string;
  irisLight: string;
  irisDark: string;
  horn: string;
  sclera: string;
};

export type BossVariant =
  | "default"
  | "lag-wyrm"
  | "buffer-lich"
  | "copypasta"
  | "ban-hammer"
  | "pumpkin-king"
  | "frost-troll"
  | "lord-lurker"
  | "gift-goblin"
  | "neon-glitch"
  | "lunar-dragon";

const INK = "#1a0b2e";
const TEETH = "#fffaf2";
const TONGUE = "#ff5f9e";

const GOLD = "#f5c542";
const GOLD_DARK = "#c98a12";
const STEEL = "#dfe3ea";
const WOOD = "#8a5a2b";
const RUBY = "#c3001a";
const LOADING_GREEN = "#5dfc9a";
const HAT = "#3a2350";
const CLIPBOARD = "#b9773a";

const PUMPKIN = "#ff9a2e";
const PUMPKIN_DARK = "#b4500a";
const VINE = "#3f8f3a";
const ICE = "#bfe9ff";
const ICE_DEEP = "#5aa9e6";
const SNOW = "#f4fbff";
const LURKER_HOOD = "#140a24";

const SANTA_RED = "#e23445";
const SANTA_DARK = "#8e1029";
const NEON_CYAN = "#29f3ff";
const NEON_MAGENTA = "#ff2bd6";

const FIGHT: Palette = {
  light: "#cfa8ff",
  base: "#9146FF",
  dark: "#35106b",
  rim: "#efe2ff",
  glow: "#bf94ff",
  irisLight: "#ffe98a",
  irisDark: "#f59e0b",
  horn: "#c9b0ea",
  sclera: "#ffffff",
};

const PALETTES: Record<string, Palette> = {
  lobby: FIGHT,
  fight: FIGHT,
  enraged: {
    light: "#ffc77f",
    base: "#ff8a1c",
    dark: "#8a2c00",
    rim: "#fff1b8",
    glow: "#ffb000",
    irisLight: "#fff3a0",
    irisDark: "#e01e00",
    horn: "#e9c29a",
    sclera: "#fff6d6",
  },
  desperate: {
    light: "#ff9e9e",
    base: "#ff3b3b",
    dark: "#68000f",
    rim: "#ffd9d9",
    glow: "#ff1a1a",
    irisLight: "#ffffff",
    irisDark: "#ff3b3b",
    horn: "#e3b1b1",
    sclera: "#fff0f0",
  },
  victory: {
    light: "#8f8a99",
    base: "#555555",
    dark: "#232029",
    rim: "#c4bfce",
    glow: "#8a8494",
    irisLight: "#dddddd",
    irisDark: "#777777",
    horn: "#8d8794",
    sclera: "#dddddd",
  },
};

const LABELS: Record<BossVariant, string> = {
  default: "Raid boss",
  "lag-wyrm": "Raid boss: Lag Wyrm",
  "buffer-lich": "Raid boss: Buffer Lich",
  copypasta: "Raid boss: Copypasta",
  "ban-hammer": "Raid boss: Ban Hammer",
  "pumpkin-king": "Raid boss: Pumpkin King",
  "frost-troll": "Raid boss: Frost Troll",
  "lord-lurker": "Raid boss: Lord Lurker",
  "gift-goblin": "Raid boss: Gift Goblin",
  "neon-glitch": "Raid boss: Neon Glitch",
  "lunar-dragon": "Raid boss: Lunar Dragon",
};

const MIRROR = "matrix(-1 0 0 1 200 0)";
const WING_PATH = "M58 80 L18 20 Q24 44 6 52 Q26 58 14 78 Q34 80 30 98 Q44 96 54 112 Z";
const HORN_PATH = "M70 60 C62 46 54 30 48 10 C64 22 80 38 86 54 Z";
const HORN_CHIPPED_PATH = "M70 60 C65 51 61 43 58 34 L63 33 L60 28 L67 30 C75 39 81 46 86 54 Z";

const HOOD_BACK_PATH = "M32 160 C22 92 46 18 100 14 C154 18 178 92 168 160 Q100 180 32 160 Z";
const COWL_PATH =
  "M48 152 C39 132 38 112 40 96 C40 64 64 36 100 34 C136 36 160 64 160 96 C162 112 161 132 152 152 L128 152 C138 140 144 124 144 102 C144 74 126 52 100 50 C74 52 56 74 56 102 C56 124 62 140 72 152 Z";
const TRICORN_PATH =
  "M42 58 C54 44 68 40 78 44 C82 22 118 22 122 44 C132 40 146 44 158 58 C138 52 118 54 100 65 C82 54 62 52 42 58 Z";
const TRICORN_TRIM_PATH = "M42 58 C62 52 82 54 100 65 C118 54 138 52 158 58";
const JUDGE_CROWN_PATH = "M76 52 L71 24 L88 38 L100 18 L112 38 L129 24 L124 52 Z";

const PUMPKIN_CROWN_PATH =
  "M66 56 C62 46 64 34 70 26 L76 34 L84 18 L92 30 L100 14 L108 30 L116 18 L124 34 L130 26 C136 34 138 46 134 56 C122 62 78 62 66 56 Z";
const PUMPKIN_RIBS_PATH = "M84 22 C78 36 78 50 82 60 M100 18 C98 34 98 48 100 61 M116 22 C122 36 122 50 118 60";
const PUMPKIN_FACE_CALM =
  "M80 46 L86 36 L92 46 Z M108 46 L114 36 L120 46 Z M84 49 Q100 64 116 49 L110 52 L106 50 L100 53 L94 50 L90 52 Z";
const PUMPKIN_FACE_ENRAGED =
  "M79 38 L93 44 L82 47 Z M121 38 L107 44 L118 47 Z M83 49 L89 53 L94 50 L100 55 L106 50 L111 53 L117 49 Q100 64 83 49 Z";
const PUMPKIN_FACE_DESPERATE =
  "M82 46 L87 34 L93 44 Z M118 46 L113 34 L107 44 Z M94 54 Q100 46 106 54 Q100 60 94 54 Z";
const VINE_PATH = "M68 52 C52 54 42 66 44 80 C45 90 54 92 54 85 C54 80 48 80 49 84";
const LEAF_PATH = "M62 54 C54 46 44 48 40 54 C46 60 56 60 62 54 Z";

const ICICLE_HORN_PATH = "M68 62 L60 42 L65 41 L54 18 L61 21 L52 0 L71 28 L67 30 L79 44 L75 45 L88 56 Z";
const ICICLE_HORN_CHIPPED_PATH = "M68 62 L60 42 L65 41 L58 28 L63 31 L66 24 L71 28 L67 30 L79 44 L75 45 L88 56 Z";
const SNOW_CAP_PATH =
  "M50 70 C54 46 76 34 100 34 C124 34 146 46 150 70 C144 66 140 72 134 68 C128 64 124 72 116 66 C110 62 106 70 100 66 C94 70 90 62 84 66 C76 72 72 64 66 68 C60 72 56 66 50 70 Z";
const CAP_ICICLES_PATH = "M62 68 L65 78 L68 67 Z M90 66 L93 76 L96 66 Z M120 66 L123 79 L126 67 Z M137 69 L140 76 L143 70 Z";
const FROST_CHEEKS_PATH =
  "M56 116 h8 M60 112 v8 M57.2 113.2 l5.6 5.6 M62.8 113.2 l-5.6 5.6 M136 116 h8 M140 112 v8 M137.2 113.2 l5.6 5.6 M142.8 113.2 l-5.6 5.6";

const LURKER_HOOD_BACK_PATH =
  "M30 162 C18 92 44 12 100 6 C156 12 182 92 170 162 L160 154 L152 172 L140 158 L130 176 L118 162 L108 178 L100 164 L92 178 L82 162 L70 176 L60 158 L48 172 L40 154 Z";
const LURKER_COWL_PATH =
  "M46 156 C36 132 35 110 39 92 C43 60 68 32 100 20 C132 32 157 60 161 92 C165 110 164 132 154 156 L130 156 C140 142 146 124 145 102 C144 74 126 52 100 48 C74 52 56 74 55 102 C54 124 60 142 70 156 Z";

const SANTA_HAT_PATH = "M64 56 C70 30 96 14 128 18 C120 26 128 40 136 56 Z";
const SANTA_BRIM_PATH = "M60 62 C62 52 80 47 100 47 C120 47 138 52 140 62 C138 68 120 63 100 63 C80 63 62 68 60 62 Z";
const CANDY_STRIPE_PATH = "M52 79 L21 32";
const GIFT_BOW_LOOPS_PATH = "M0 0 C-3 -8 -10 -7 -9 -2 C-8 2 -3 2 0 0 Z M0 0 C3 -8 10 -7 9 -2 C8 2 3 2 0 0 Z";
const GIFT_BOW_TAILS_PATH = "M-1 1 L-5 8 L-2.5 7.5 L-1.5 10 Z M1 1 L5 8 L2.5 7.5 L1.5 10 Z";

const VISOR_PATH = "M38 78 C62 68 138 68 162 78 L162 100 C138 106 62 106 38 100 Z";
const VISOR_SCANLINES = Array.from({ length: 12 }, (_, i) => `M38 ${71 + i * 3} H162`).join(" ");
const CIRCUIT_PATH = "M54 84 H44 L36 76 H26 M49 75 L37 63 H30 L26 57 M53 96 H42 L37 91";
const CIRCUIT_NODES: ReadonlyArray<readonly [number, number]> = [
  [26, 76],
  [26, 57],
  [37, 91],
];

const WHISKER_PATH = "M64 116 C54 112 42 116 34 110 C26 104 28 96 34 96";
const WHISKER_SHORT_PATH = "M70 124 C60 128 50 134 40 132 C34 131 33 126 37 125";

/** [cx, cy, r, phase level needed to open, blink period (s), delay (s)] */
const LURKER_EYES: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [52, 74, 4.2, 1, 5.2, 0],
  [153, 112, 3.6, 1, 5.5, 0.6],
  [148, 74, 4.2, 2, 4.6, 1.3],
  [47, 112, 3.6, 2, 6.1, 2.2],
  [66, 46, 3.4, 3, 4.2, 1.8],
  [134, 46, 3.4, 3, 4.9, 0.3],
  [61, 146, 3.8, 4, 3.8, 2.7],
  [139, 146, 3.8, 4, 4.4, 1.1],
];

// Seasonal keyframes are scoped to the seasonal variants so existing variants render byte-identical markup.
// Transform/opacity only to stay cheap under OBS software rendering.
const SEASON_CSS =
  "@keyframes crb-season-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}" +
  "@keyframes crb-season-candle{0%,100%{opacity:1}35%{opacity:.55}60%{opacity:.9}80%{opacity:.7}}" +
  "@keyframes crb-season-puff{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.85}100%{opacity:0;transform:translate(-16px,-6px) scale(1.6)}}" +
  "@keyframes crb-season-peek{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(.08)}}" +
  "@keyframes crb-season-drip{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(16px)}}" +
  "@keyframes crb-season-twinkle{0%,100%{opacity:.25;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}" +
  "@media (prefers-reduced-motion:reduce){.crb-season{animation:none!important}}";

function starPoints(cx: number, cy: number, outer: number, inner: number, spikes = 8) {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return points.join(" ");
}

function sparklePath(cx: number, cy: number, s: number) {
  const k = s * 0.35;
  return `M${cx} ${cy - s} L${cx + k} ${cy - k} L${cx + s} ${cy} L${cx + k} ${cy + k} L${cx} ${cy + s} L${cx - k} ${cy + k} L${cx - s} ${cy} L${cx - k} ${cy - k} Z`;
}

function buildFrill(cx: number, cy: number, outer: number, inner: number, fromDeg: number, toDeg: number, spikes: number) {
  const steps = spikes * 2;
  const pts: string[] = [];
  const ribs: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    const r = i % 2 === 1 ? outer : inner;
    const x = (cx + Math.cos(a) * r).toFixed(1);
    const y = (cy + Math.sin(a) * r).toFixed(1);
    pts.push(`${x} ${y}`);
    if (i % 2 === 1) {
      ribs.push(`M${(cx + Math.cos(a) * 44).toFixed(1)} ${(cy + Math.sin(a) * 44).toFixed(1)} L${x} ${y}`);
    }
  }
  return { outline: `M${cx} ${cy} L${pts.join(" L")} Z`, ribs: ribs.join(" ") };
}

const FRILL = buildFrill(100, 104, 84, 62, -12, 192, 13);

function anim(value: string | false, origin: string): CSSProperties {
  return value ? { animation: value, transformOrigin: origin } : { transformOrigin: origin };
}

/** Hand-built SVG boss. Colors and expression react to the phase; `variant` layers boss-specific accessories. */
export function BossArt({
  phase,
  hit,
  variant = "default",
}: {
  phase: Phase;
  hit: number;
  variant?: BossVariant;
}) {
  const uid = useId().replace(/[^\w-]/g, "");
  const id = (name: string) => `boss-${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  const key = phase as string;
  const p = PALETTES[key] ?? FIGHT;
  const dead = key === "victory";
  const lobby = key === "lobby";
  const enraged = key === "enraged";
  const desperate = key === "desperate";
  const angry = !dead && key !== "fight" && key !== "lobby";
  const calm = !dead && !angry;

  const isWyrm = variant === "lag-wyrm";
  const isLich = variant === "buffer-lich";
  const isPasta = variant === "copypasta";
  const isBan = variant === "ban-hammer";
  const isPumpkin = variant === "pumpkin-king";
  const isFrost = variant === "frost-troll";
  const isLurker = variant === "lord-lurker";
  const isGift = variant === "gift-goblin";
  const isNeon = variant === "neon-glitch";
  const isLunar = variant === "lunar-dragon";
  const isSeasonal = isPumpkin || isFrost || isLurker || isGift || isNeon || isLunar;
  const plainHorns = !isSeasonal || isGift || isNeon || isLunar;
  const gold = dead ? p.horn : GOLD;
  const goldDark = dead ? p.dark : GOLD_DARK;

  const floatDur = lobby ? 4 : enraged ? 2.2 : desperate ? 1.6 : 3;
  const flapDur = lobby ? 2.4 : enraged ? 0.9 : desperate ? 0.6 : 1.6;
  const eyeRy = desperate ? 15 : 11;

  const impactAngle = hit * 2.39996;
  const impactX = 100 + Math.cos(impactAngle) * 34;
  const impactY = 98 + Math.sin(impactAngle) * 26;

  const mouthPath = enraged
    ? "M66 118 Q100 154 134 118 Q100 128 66 118 Z"
    : desperate
      ? "M70 120 Q100 162 130 120 Q100 112 70 120 Z"
      : "M72 122 Q100 145 128 122 Z";

  const pumpkinFace = enraged || (angry && !desperate) ? PUMPKIN_FACE_ENRAGED : desperate ? PUMPKIN_FACE_DESPERATE : PUMPKIN_FACE_CALM;

  const lurkLevel = dead ? 0 : lobby ? 1 : calm ? 2 : desperate ? 4 : 3;
  const peekScale = desperate ? 0.5 : angry ? 0.7 : 1;
  const lurkClosedPath = isLurker
    ? LURKER_EYES.filter(([, , , level]) => level > lurkLevel)
        .map(([cx, cy, r]) => `M${cx - r * 1.2} ${cy} Q${cx} ${cy + r * 0.9} ${cx + r * 1.2} ${cy}`)
        .join(" ")
    : "";

  // The right horn is chipped while desperate/dead, so the lantern ties lower on what remains.
  const [lanternX, lanternY] = dead || desperate ? [142, 35] : [147, 24];
  const bowBand = dead ? 7.5 : 5.5;

  const renderSpinner = (px: number, py: number) => {
    const r = desperate ? 7 : 9.5;
    const c = 2 * Math.PI * r;
    return (
      <g className="animate-spin motion-reduce:animate-none" style={{ transformOrigin: `${px}px ${py}px` }}>
        <circle
          cx={px}
          cy={py}
          r={r}
          fill="none"
          stroke={p.dark}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${(c * 0.68).toFixed(1)} ${(c * 0.32).toFixed(1)}`}
        />
        <circle cx={px} cy={py - r} r="1.9" fill="#fff" stroke={p.dark} strokeWidth="1" />
      </g>
    );
  };

  const renderEye = (cx: number, side: "l" | "r") => {
    const px = cx + (side === "l" ? 2 : -2);
    const py = 90;
    return (
      <g key={side}>
        <ellipse cx={cx} cy="88" rx="15" ry={eyeRy + 2} fill={INK} />
        <ellipse cx={cx} cy="88" rx="13" ry={eyeRy} fill={p.sclera} />
        <circle cx={px} cy={py} r={desperate ? 4.5 : 7} fill={url("iris")} />
        {enraged ? (
          <ellipse cx={px} cy={py} rx="2" ry="6.5" fill={INK} />
        ) : (
          <circle cx={px} cy={py} r={desperate ? 2.2 : 3.8} fill={INK} />
        )}
        <circle cx={px - 2.5} cy={py - 3} r="2.2" fill="#fff" />
        <circle cx={px + 2.5} cy={py + 2.5} r="1" fill="#fff" opacity="0.8" />
        {isWyrm && renderSpinner(px, py)}
      </g>
    );
  };

  const eyepatch: ReactNode = isPasta ? (
    <g>
      <path d="M110 76 Q80 62 44 70 M139 97 Q150 100 160 105" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      <g transform="rotate(-8 124 89)">
        <rect x="108" y="71" width="32" height="36" rx="3" fill={dead ? p.horn : CLIPBOARD} stroke={INK} strokeWidth="2.2" />
        <rect x="112" y="77" width="24" height="26" rx="1.5" fill={TEETH} stroke={INK} strokeWidth="1" />
        <path d="M115 84 H133 M115 89 H133 M115 94 H133 M115 99 H127" stroke={p.dark} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        <rect x="116" y="67" width="16" height="8" rx="2" fill={STEEL} stroke={INK} strokeWidth="1.8" />
        <circle cx="124" cy="71" r="1.5" fill={INK} />
      </g>
    </g>
  ) : null;

  const visor: ReactNode = isNeon ? (
    <g>
      <path d={VISOR_PATH} fill={INK} fillOpacity={dead ? 0.5 : 0.62} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <g clipPath={url("visorClip")}>
        <path d={VISOR_SCANLINES} stroke={dead ? p.rim : NEON_CYAN} strokeWidth="1" opacity={dead ? 0.15 : 0.3} />
      </g>
      <path d="M42 79 C64 71 136 71 158 79" stroke={dead ? p.rim : NEON_CYAN} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M42 99 C64 103 136 103 158 99" stroke={dead ? p.dark : NEON_MAGENTA} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
      <g fill={STEEL} stroke={INK} strokeWidth="1.6">
        <rect x="34" y="82" width="8" height="14" rx="2" />
        <rect x="158" y="82" width="8" height="14" rx="2" />
      </g>
      {(dead || desperate) && (
        <path d="M120 72 L126 83 L119 90 L127 103" stroke={dead ? p.rim : NEON_MAGENTA} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </g>
  ) : null;

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={LABELS[variant] ?? LABELS.default}>
      <defs>
        {isSeasonal && <style>{SEASON_CSS}</style>}
        <radialGradient id={id("aura")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="55%" stopColor={p.glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("shadow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={INK} stopOpacity="0.6" />
          <stop offset="100%" stopColor={INK} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("body")} cx="38%" cy="28%" r="80%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="45%" stopColor={p.base} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        <linearGradient id={id("shade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="50%" stopColor={p.dark} stopOpacity="0" />
          <stop offset="100%" stopColor={p.dark} stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={id("spec")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("wing")} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={p.dark} />
          <stop offset="60%" stopColor={p.base} />
          <stop offset="100%" stopColor={p.light} />
        </linearGradient>
        <linearGradient id={id("horn")} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={p.horn} />
          <stop offset="100%" stopColor="#fff8ec" />
        </linearGradient>
        <radialGradient id={id("eyeGlow")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.9" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("iris")} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={p.irisLight} />
          <stop offset="100%" stopColor={p.irisDark} />
        </radialGradient>
        <linearGradient id={id("mouth")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INK} />
          <stop offset="100%" stopColor="#4a0f3a" />
        </linearGradient>
        <radialGradient id={id("flash")} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.45" />
        </radialGradient>
        {isFrost && (
          <linearGradient id={id("ice")} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={dead ? p.horn : ICE_DEEP} />
            <stop offset="55%" stopColor={dead ? p.rim : ICE} />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        )}
        {isNeon && (
          <clipPath id={id("visorClip")}>
            <path d={VISOR_PATH} />
          </clipPath>
        )}
        <clipPath id={id("mouthClip")}>
          <path d={mouthPath} />
        </clipPath>
      </defs>

      {!dead && (
        <circle
          cx="100"
          cy="100"
          r="98"
          fill={url("aura")}
          style={anim(`crb-boss-aura ${desperate ? 0.9 : enraged ? 1.4 : 3}s ease-in-out infinite`, "100px 100px")}
        />
      )}

      <ellipse
        cx="100"
        cy="184"
        rx="52"
        ry="8"
        fill={url("shadow")}
        style={anim(!dead && `crb-boss-shadow ${floatDur}s ease-in-out infinite`, "100px 184px")}
      />

      <g style={anim(!dead && `float ${floatDur}s ease-in-out infinite`, "100px 100px")}>
        <g
          key={hit}
          style={anim(hit > 0 && "crb-boss-recoil 0.34s cubic-bezier(.2,.9,.3,1.4)", "100px 158px")}
        >
          <g
            transform={dead ? "rotate(-8 100 150)" : undefined}
            style={desperate ? { animation: "crb-boss-tremble 0.16s linear infinite" } : undefined}
          >
            {/* lag-wyrm: serpent frill collar */}
            {isWyrm && (
              <g>
                <path d={FRILL.outline} fill={url("wing")} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d={FRILL.ribs} stroke={p.dark} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
              </g>
            )}

            {/* wings */}
            {[false, true].map((mirrored) => (
              <g key={String(mirrored)} transform={mirrored ? MIRROR : undefined}>
                <g
                  transform={dead ? "rotate(-25 56 92)" : undefined}
                  style={anim(
                    !dead && `crb-boss-flap ${flapDur}s ease-in-out infinite`,
                    "56px 92px",
                  )}
                >
                  <path d={WING_PATH} fill={url("wing")} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M56 86 L8 52 M56 92 L14 78 M54 100 L30 98" stroke={p.dark} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                  <path d="M54 76 L22 28" stroke={p.rim} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

                  {/* gift-goblin: candy-cane stripe along the leading edge */}
                  {isGift && (
                    <g fill="none">
                      <path d={CANDY_STRIPE_PATH} stroke={INK} strokeWidth="7" strokeLinecap="round" />
                      <path d={CANDY_STRIPE_PATH} stroke={dead ? p.rim : SNOW} strokeWidth="4.6" strokeLinecap="round" />
                      <path d={CANDY_STRIPE_PATH} stroke={dead ? p.dark : SANTA_RED} strokeWidth="4.6" strokeDasharray="4 4" />
                    </g>
                  )}

                  {/* neon-glitch: circuit traces */}
                  {isNeon && (
                    <g>
                      <path
                        d={CIRCUIT_PATH}
                        stroke={dead ? p.rim : NEON_CYAN}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.9"
                      />
                      <g fill={dead ? p.dark : NEON_MAGENTA} stroke={INK} strokeWidth="0.8">
                        {CIRCUIT_NODES.map(([cx, cy]) => (
                          <circle key={`n${cx}-${cy}`} cx={cx} cy={cy} r="1.9" />
                        ))}
                      </g>
                    </g>
                  )}
                </g>
              </g>
            ))}

            {/* buffer-lich: back of the hood */}
            {isLich && (
              <g>
                <path d={HOOD_BACK_PATH} fill={p.dark} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M40 120 C34 76 58 26 100 22" stroke={p.rim} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
                <ellipse cx="100" cy="102" rx="68" ry="64" fill={INK} opacity="0.45" />
              </g>
            )}

            {/* lord-lurker: tattered back of the hood */}
            {isLurker && (
              <g>
                <path d={LURKER_HOOD_BACK_PATH} fill={dead ? p.dark : LURKER_HOOD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M38 124 C30 78 54 20 100 14" stroke={p.glow} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.45" />
              </g>
            )}

            {/* neon-glitch: cyan/magenta chromatic offset edges behind horns + head */}
            {isNeon && (
              <g fill="none" strokeWidth="3" strokeLinejoin="round" opacity={dead ? 0.35 : 0.9}>
                <ellipse cx="97.5" cy="100" rx="62" ry="58" stroke={dead ? p.rim : NEON_CYAN} />
                <ellipse cx="102.5" cy="100" rx="62" ry="58" stroke={dead ? p.dark : NEON_MAGENTA} />
                {[false, true].map((mirrored) => {
                  const chipped = dead || (desperate && mirrored);
                  const d = chipped ? HORN_CHIPPED_PATH : HORN_PATH;
                  return (
                    <g key={`c${mirrored}`} transform={mirrored ? MIRROR : undefined}>
                      <path d={d} stroke={dead ? p.rim : NEON_CYAN} transform={`translate(${mirrored ? 2.5 : -2.5} 0)`} />
                      <path d={d} stroke={dead ? p.dark : NEON_MAGENTA} transform={`translate(${mirrored ? -2.5 : 2.5} 0)`} />
                    </g>
                  );
                })}
              </g>
            )}

            {/* horns */}
            {plainHorns &&
              [false, true].map((mirrored) => {
                const chipped = dead || (desperate && mirrored);
                return (
                  <g key={`h${mirrored}`} transform={mirrored ? MIRROR : undefined}>
                    <path
                      d={chipped ? HORN_CHIPPED_PATH : HORN_PATH}
                      fill={url("horn")}
                      stroke={INK}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <path d="M62 40 Q68 37 74 43" stroke={p.dark} strokeWidth="1.6" fill="none" opacity="0.35" />
                    {!chipped && <path d="M56 27 Q61 25 65 31" stroke={p.dark} strokeWidth="1.4" fill="none" opacity="0.35" />}
                    {chipped && <path d="M63 33 L66 40" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />}
                  </g>
                );
              })}

            {/* frost-troll: icicle horns */}
            {isFrost &&
              [false, true].map((mirrored) => {
                const chipped = dead || (desperate && mirrored);
                return (
                  <g key={`i${mirrored}`} transform={mirrored ? MIRROR : undefined}>
                    <path
                      d={chipped ? ICICLE_HORN_CHIPPED_PATH : ICICLE_HORN_PATH}
                      fill={url("ice")}
                      stroke={INK}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d={chipped ? "M68 54 L62 40 L61 32 M63 31 L67 37" : "M68 54 L62 40 L60 30 M58 22 L55 10"}
                      stroke={chipped ? INK : "#fff"}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      fill="none"
                      opacity={chipped ? 0.7 : 0.8}
                    />
                  </g>
                );
              })}

            {/* head spikes */}
            {plainHorns && (
              <path d="M86 50 L93 36 L100 48 L107 36 L114 50 Z" fill={p.dark} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            )}

            {/* head/body */}
            <ellipse cx="100" cy="100" rx="62" ry="58" fill={url("body")} stroke={INK} strokeWidth="3" />
            <ellipse cx="100" cy="100" rx="62" ry="58" fill={url("shade")} />
            <ellipse cx="100" cy="136" rx="36" ry="17" fill={p.light} opacity="0.16" />
            <ellipse cx="76" cy="62" rx="20" ry="9" fill={url("spec")} transform="rotate(-20 76 62)" />
            <circle cx="98" cy="52" r="2.6" fill="#fff" opacity="0.5" />
            <path d="M138 58 A59 55 0 0 1 153.5 123.2" stroke={p.rim} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
            <path d="M54.8 135.4 A59 55 0 0 1 44.6 81.2" stroke={p.glow} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />

            {/* lag-wyrm: cheek scales */}
            {isWyrm && (
              <path
                d="M48 96 q4 -5 8 0 q4 -5 8 0 M52 104 q4 -5 8 0 M136 96 q4 -5 8 0 q4 -5 8 0 M140 104 q4 -5 8 0"
                stroke={p.dark}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />
            )}

            {/* pumpkin-king: vine tendrils + carved jack-o-lantern crown */}
            {isPumpkin && (
              <g>
                {[false, true].map((mirrored) => (
                  <g key={`v${mirrored}`} transform={mirrored ? MIRROR : undefined}>
                    <g
                      className="crb-season"
                      style={anim(!dead && `crb-season-sway ${floatDur}s ease-in-out ${mirrored ? floatDur / 2 : 0}s infinite`, "68px 52px")}
                    >
                      <path d={VINE_PATH} stroke={dead ? p.dark : VINE} strokeWidth="2.6" strokeLinecap="round" fill="none" />
                      <path d={LEAF_PATH} fill={dead ? p.horn : VINE} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
                    </g>
                  </g>
                ))}
                <g transform={dead ? "rotate(-12 100 56) translate(-4 4)" : undefined}>
                  <path d={PUMPKIN_CROWN_PATH} fill={dead ? p.horn : PUMPKIN} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                  <path d={PUMPKIN_RIBS_PATH} stroke={dead ? p.dark : PUMPKIN_DARK} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
                  <path d="M74 50 C70 42 71 36 74 31" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
                  <path d="M98 16 L98 8 Q103 5 105 9 L102 17 Z" fill={dead ? p.dark : VINE} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d={pumpkinFace} fill={dead ? INK : p.irisDark} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
                  {!dead && (
                    <g opacity={lobby ? 0.55 : 1}>
                      <path
                        d={pumpkinFace}
                        fill={p.irisLight}
                        className="crb-season"
                        style={{ animation: `crb-season-candle ${flapDur}s ease-in-out infinite` }}
                      />
                    </g>
                  )}
                  {desperate && <path d="M122 32 L118 40 L123 45 L119 54" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
                </g>
              </g>
            )}

            {/* frost-troll: snow cap, cap icicles, frosted nose + cheeks */}
            {isFrost && (
              <g>
                <path d={CAP_ICICLES_PATH} fill={url("ice")} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
                <path d={SNOW_CAP_PATH} fill={dead ? p.rim : SNOW} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M58 60 C68 46 84 40 100 40" stroke={ICE_DEEP} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.45" />
                {!dead &&
                  [
                    [80, 46, 3.5, 0],
                    [124, 42, 3, 1.1],
                  ].map(([cx, cy, s, delay]) => (
                    <path
                      key={`s${cx}`}
                      d={sparklePath(cx, cy, s)}
                      fill="#fff"
                      className="crb-season"
                      style={anim(`crb-season-twinkle 2.2s ease-in-out ${delay}s infinite`, `${cx}px ${cy}px`)}
                    />
                  ))}
                {enraged &&
                  [
                    [93, 77, 0],
                    [140, 77, 0.6],
                  ].map(([x, y, delay]) => (
                    <path
                      key={`d${x}`}
                      d={`M${x} ${y} q-2.2 3.2 0 4.6 q2.2 -1.4 0 -4.6 Z`}
                      fill={ICE}
                      stroke={INK}
                      strokeWidth="0.8"
                      opacity="0"
                      className="crb-season"
                      style={anim(`crb-season-drip 1.2s ease-in ${delay}s infinite`, `${x}px ${y}px`)}
                    />
                  ))}
                <path d={FROST_CHEEKS_PATH} stroke={SNOW} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                <ellipse cx="100" cy="106" rx="8" ry="5.5" fill={url("body")} stroke={INK} strokeWidth="2" />
                <ellipse cx="97" cy="104" rx="2.6" ry="1.6" fill={SNOW} opacity="0.9" />
              </g>
            )}

            {/* gift-goblin: santa hat with pom-pom + wrapped-gift bow tied on the left horn */}
            {isGift && (
              <g>
                <g transform={dead ? "rotate(-12 100 56) translate(-4 4)" : undefined}>
                  <path d={SANTA_HAT_PATH} fill={dead ? p.dark : SANTA_RED} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M76 48 C84 34 100 25 120 21" stroke={dead ? INK : SANTA_DARK} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
                  <path d="M71 44 C76 33 86 26 97 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
                  <path d={SANTA_BRIM_PATH} fill={dead ? p.rim : SNOW} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                  <path
                    d="M68 59 q3 -3 6 0 M84 56 q3 -3 6 0 M110 56 q3 -3 6 0 M126 59 q3 -3 6 0"
                    stroke={INK}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.2"
                  />
                  <circle cx="130" cy="18" r="6.5" fill={dead ? p.rim : SNOW} stroke={INK} strokeWidth="2" />
                  <path d="M126 15.5 Q128 13 131 13" stroke={INK} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.2" />
                </g>
                <g transform={dead ? "translate(66 39) rotate(-14)" : "translate(60 28) rotate(-34)"}>
                  <path d={`M${-bowBand} 0 H${bowBand}`} stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
                  <path d={`M${-bowBand} 0 H${bowBand}`} stroke={gold} strokeWidth="3.4" strokeLinecap="round" />
                  <path d={GIFT_BOW_TAILS_PATH} fill={gold} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
                  <path d={GIFT_BOW_LOOPS_PATH} fill={gold} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
                  <rect x="-2.6" y="-2.6" width="5.2" height="5.2" rx="1.6" fill={goldDark} stroke={INK} strokeWidth="1.3" />
                </g>
              </g>
            )}

            {/* lunar-dragon: gold coin forehead mark + paper lantern hanging from the right horn */}
            {isLunar && (
              <g>
                <circle cx="100" cy="61" r="6.5" fill={gold} stroke={INK} strokeWidth="1.8" />
                <circle cx="100" cy="61" r="4.6" fill="none" stroke={goldDark} strokeWidth="1" />
                <rect x="98" y="59" width="4" height="4" rx="0.6" fill={p.dark} stroke={INK} strokeWidth="1" />
                <path d="M95.8 58 A5 5 0 0 1 99.5 56" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                <g transform={`translate(${lanternX} ${lanternY})${dead ? " rotate(-10)" : ""}`}>
                  <g
                    className="crb-season"
                    style={anim(!dead && `crb-season-sway ${floatDur}s ease-in-out infinite`, "0px 0px")}
                  >
                    <path d="M0 0 V7" stroke={goldDark} strokeWidth="1.4" strokeLinecap="round" />
                    <ellipse cx="0" cy="18" rx="9" ry="8.5" fill={dead ? p.horn : RUBY} stroke={INK} strokeWidth="1.8" />
                    {!dead && (
                      <g opacity={lobby ? 0.55 : 0.8}>
                        <ellipse
                          cx="0"
                          cy="18"
                          rx="4.5"
                          ry="5.5"
                          fill={p.irisLight}
                          className="crb-season"
                          style={{ animation: `crb-season-candle ${flapDur}s ease-in-out infinite` }}
                        />
                      </g>
                    )}
                    <path d="M-4 10 Q-8.5 18 -4 26 M4 10 Q8.5 18 4 26 M0 9.5 V26.5" stroke={goldDark} strokeWidth="1" fill="none" opacity="0.75" />
                    <rect x="-5" y="7" width="10" height="3" rx="1" fill={gold} stroke={INK} strokeWidth="1.2" />
                    <rect x="-5" y="25.5" width="10" height="3" rx="1" fill={gold} stroke={INK} strokeWidth="1.2" />
                    <path d="M0 28.5 V36 M-1.8 29.5 L-2.4 35 M1.8 29.5 L2.4 35" stroke={dead ? p.dark : RUBY} strokeWidth="1.4" strokeLinecap="round" />
                  </g>
                </g>
              </g>
            )}

            {/* buffer-lich: front cowl */}
            {isLich && (
              <g>
                <path d={COWL_PATH} fill={p.dark} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M56 102 C56 74 74 52 100 50 C126 52 144 74 144 102" stroke={INK} strokeWidth="4" fill="none" opacity="0.5" />
                <path d="M46 84 C54 58 74 40 100 37" stroke={p.rim} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
              </g>
            )}

            {/* lord-lurker: shadowed face, peaked cowl, peeking eyes */}
            {isLurker && (
              <g>
                <ellipse cx="100" cy="104" rx="48" ry="52" fill={INK} opacity={dead ? 0.35 : 0.55} />
                <path d={LURKER_COWL_PATH} fill={dead ? p.dark : LURKER_HOOD} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M55 102 C56 74 74 52 100 48 C126 52 144 74 145 102" stroke={INK} strokeWidth="4" fill="none" opacity="0.6" />
                <path d="M44 86 C50 60 70 38 100 26" stroke={p.glow} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
                {LURKER_EYES.map(([cx, cy, r, level, dur, delay]) => {
                  if (level > lurkLevel) return null;
                  const px = cx + (cx < 100 ? 0.8 : -0.8);
                  return (
                    <g
                      key={`e${cx}-${cy}`}
                      className="crb-season"
                      style={anim(`crb-season-peek ${(dur * peekScale).toFixed(2)}s ease-in-out ${delay}s infinite`, `${cx}px ${cy}px`)}
                    >
                      <ellipse cx={cx} cy={cy} rx={r * 1.3} ry={r} fill={url("iris")} stroke={INK} strokeWidth="1.2" />
                      {angry ? (
                        <ellipse cx={px} cy={cy} rx="0.9" ry={r * 0.8} fill={INK} />
                      ) : (
                        <circle cx={px} cy={cy} r={r * 0.5} fill={INK} />
                      )}
                    </g>
                  );
                })}
                {lurkClosedPath && (
                  <path d={lurkClosedPath} stroke={dead ? p.rim : p.glow} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />
                )}
              </g>
            )}

            {/* copypasta: pirate tricorn with copy emblem */}
            {isPasta && (
              <g>
                <path d={TRICORN_PATH} fill={dead ? p.dark : HAT} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <path d={TRICORN_TRIM_PATH} stroke={gold} strokeWidth="2.6" strokeLinecap="round" fill="none" />
                <g fill="none" stroke={TEETH} strokeWidth="2" strokeLinejoin="round">
                  <rect x="93" y="33" width="11" height="12" rx="2" />
                  <rect x="97" y="37" width="11" height="12" rx="2" fill={dead ? p.dark : HAT} />
                </g>
              </g>
            )}

            {/* ban-hammer: gavel held aside + judge crown */}
            {isBan && (
              <g>
                <g transform="translate(150 158) rotate(14)">
                  <rect x="-4" y="-88" width="8" height="98" rx="3" fill={dead ? p.horn : WOOD} stroke={INK} strokeWidth="2.2" />
                  <path d="M-2 -80 V0" stroke={p.rim} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                  <rect x="-20" y="-112" width="40" height="26" rx="4" fill={STEEL} stroke={INK} strokeWidth="2.5" />
                  <rect x="-24" y="-114" width="6" height="30" rx="2" fill={goldDark} stroke={INK} strokeWidth="1.6" />
                  <rect x="18" y="-114" width="6" height="30" rx="2" fill={goldDark} stroke={INK} strokeWidth="1.6" />
                  <text
                    x="0"
                    y="-99"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="900"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fill={dead ? p.dark : RUBY}
                    aria-hidden="true"
                  >
                    BAN
                  </text>
                </g>
                <ellipse cx="152" cy="148" rx="9" ry="8" fill={url("body")} stroke={INK} strokeWidth="2.5" />
                <path d="M146 146 Q150 143 155 145" stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />

                <path d={JUDGE_CROWN_PATH} fill={gold} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
                <rect x="75" y="44" width="50" height="9" rx="2" fill={goldDark} stroke={INK} strokeWidth="2" />
                <circle cx="100" cy="48.5" r="3" fill={dead ? p.dark : RUBY} stroke={INK} strokeWidth="1.2" />
                <g fill={TEETH} stroke={INK} strokeWidth="1.2">
                  <circle cx="71" cy="24" r="2.4" />
                  <circle cx="100" cy="18" r="2.6" />
                  <circle cx="129" cy="24" r="2.4" />
                </g>
              </g>
            )}

            {calm && !isLurker && (
              <g fill="#ff7ab8" opacity="0.35">
                <ellipse cx="60" cy="110" rx="8" ry="4" />
                <ellipse cx="140" cy="110" rx="8" ry="4" />
              </g>
            )}

            {/* desperate cracks + sweat */}
            {desperate && (
              <g>
                <path d="M128 52 L120 68 L128 74 L118 92" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M130 53 L122 68 L130 74" stroke={p.rim} strokeWidth="1" fill="none" opacity="0.6" />
                <path d="M50 104 L62 110 L58 118 L70 126" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path
                  d="M54 64 Q48 74 54 78 Q60 74 54 64 Z"
                  fill="#c7ecff"
                  stroke={INK}
                  strokeWidth="1.5"
                  style={{ animation: "crb-boss-sweat 1.1s ease-in infinite" }}
                />
              </g>
            )}

            {/* enraged anger mark + steam */}
            {enraged && (
              <g>
                <path
                  d="M119 58 Q123 62 119 66 M129 58 Q125 62 129 66 M120 57 Q124 61 128 57 M120 67 Q124 63 128 67"
                  stroke="#c3001a"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                  style={anim("crb-boss-throb 0.7s ease-in-out infinite", "124px 62px")}
                />
                {[
                  [60, 46, 0],
                  [140, 46, 0.7],
                  [66, 40, 0.35],
                ].map(([cx, cy, delay]) => (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r="5"
                    fill={p.rim}
                    opacity="0"
                    style={anim(`crb-boss-steam 1.4s ease-out ${delay}s infinite`, `${cx}px ${cy}px`)}
                  />
                ))}
              </g>
            )}

            {/* eyes */}
            {dead ? (
              <>
                <g strokeLinecap="round">
                  <g stroke={INK} strokeWidth="9">
                    <path d="M68 80 L84 96 M84 80 L68 96" />
                    <path d="M116 80 L132 96 M132 80 L116 96" />
                  </g>
                  <g stroke="#fff" strokeWidth="5">
                    <path d="M68 80 L84 96 M84 80 L68 96" />
                    <path d="M116 80 L132 96 M132 80 L116 96" />
                  </g>
                </g>
                {eyepatch}
                {visor}
              </>
            ) : (
              <g>
                {angry && (
                  <g style={desperate ? { animation: "crb-boss-flicker 0.6s steps(2) infinite" } : undefined}>
                    <circle cx="76" cy="88" r="24" fill={url("eyeGlow")} />
                    <circle cx="124" cy="88" r="24" fill={url("eyeGlow")} />
                  </g>
                )}
                <g style={anim(calm && "crb-boss-blink 4.5s ease-in-out infinite", "100px 88px")}>
                  {renderEye(76, "l")}
                  {renderEye(124, "r")}
                  {lobby && (
                    <g>
                      <path d="M63 88 A13 11 0 0 1 89 88 Z M111 88 A13 11 0 0 1 137 88 Z" fill={p.base} />
                      <path d="M61 88 L91 88 M109 88 L139 88" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    </g>
                  )}
                </g>
                {eyepatch}
                {visor}
                {angry && (
                  <g fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
                    {desperate ? (
                      <path d="M58 62 L94 80 L91 86 L76 79 L72 82 L60 70 Z M142 62 L106 80 L109 86 L124 79 L128 82 L140 70 Z" />
                    ) : (
                      <path d="M56 66 L92 80 L90 86 L58 74 Z M144 66 L108 80 L110 86 L142 74 Z" />
                    )}
                  </g>
                )}
              </g>
            )}

            {/* mouth */}
            {dead ? (
              <g>
                <path d="M103 125 L117 128 Q119 142 111 143 Q104 142 103 125 Z" fill={TONGUE} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
                <path d="M110 129 L110 137" stroke={INK} strokeWidth="1.2" opacity="0.5" />
                <path d="M75 132 Q100 118 125 132" stroke={INK} strokeWidth="8" fill="none" strokeLinecap="round" />
                <path d="M75 132 Q100 118 125 132" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
              </g>
            ) : lobby ? (
              <g>
                <path d="M110 125 L113 133 L117 124 Z" fill={TEETH} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M82 124 Q100 134 120 122" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                <path d={mouthPath} fill={url("mouth")} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
                <g clipPath={url("mouthClip")}>
                  <ellipse cx="100" cy={desperate ? 150 : enraged ? 146 : 142} rx="16" ry="9" fill={TONGUE} />
                </g>
                <g fill={TEETH} stroke={INK} strokeWidth="1" strokeLinejoin="round">
                  {enraged ? (
                    <path d="M72 120 L77 130 L82 122 L87 132 L93 123 L100 134 L107 123 L113 132 L118 122 L123 130 L128 120 Q100 128 72 120 Z" />
                  ) : desperate ? (
                    <path d="M78 119 L84 131 L90 117 Z M110 117 L116 131 L122 119 Z M84 138 L88 129 L92 140 Z M108 140 L112 129 L116 138 Z" />
                  ) : (
                    <path d="M80 123 L86 135 L92 124 Z M108 124 L114 135 L120 123 Z" />
                  )}
                </g>
              </g>
            )}

            {/* lunar-dragon: red + gold whiskers */}
            {isLunar && (
              <g fill="none" strokeLinecap="round">
                {[false, true].map((mirrored) => (
                  <g key={`w${mirrored}`} transform={mirrored ? MIRROR : undefined}>
                    <path d={WHISKER_PATH} stroke={INK} strokeWidth="4.8" />
                    <path d={WHISKER_PATH} stroke={dead ? p.dark : RUBY} strokeWidth="2.8" />
                    <path d={WHISKER_SHORT_PATH} stroke={INK} strokeWidth="4.2" />
                    <path d={WHISKER_SHORT_PATH} stroke={gold} strokeWidth="2.2" />
                  </g>
                ))}
              </g>
            )}

            {/* frost-troll: frosty breath puffs drifting from the mouth corners */}
            {isFrost && !dead && (
              <g>
                {[false, true].map((mirrored) => (
                  <g key={`b${mirrored}`} transform={mirrored ? MIRROR : undefined}>
                    {[0, floatDur / 2].map((delay) => (
                      <circle
                        key={delay}
                        cx="66"
                        cy="128"
                        r="4.5"
                        fill={SNOW}
                        stroke={ICE_DEEP}
                        strokeWidth="1.2"
                        opacity="0"
                        className="crb-season"
                        style={anim(
                          `crb-season-puff ${floatDur}s ease-out ${(delay + (mirrored ? floatDur / 4 : 0)).toFixed(2)}s infinite`,
                          "66px 128px",
                        )}
                      />
                    ))}
                  </g>
                ))}
              </g>
            )}

            {/* defeated: bandage + escaping soul */}
            {dead && (
              <g>
                <g fill="#f1d9b5" stroke={INK} strokeWidth="1.5">
                  <rect x="118" y="56" width="26" height="8" rx="3" transform="rotate(35 131 60)" />
                  <rect x="118" y="56" width="26" height="8" rx="3" transform="rotate(-35 131 60)" />
                </g>
                <g style={{ animation: "crb-boss-soul 3s ease-out infinite" }} opacity="0">
                  <path d="M92 32 a8 8 0 0 1 16 0 v10 l-4 -3 l-4 3 l-4 -3 l-4 3 Z" fill="#fff" opacity="0.85" />
                  <circle cx="97" cy="32" r="1.4" fill={INK} />
                  <circle cx="103" cy="32" r="1.4" fill={INK} />
                </g>
              </g>
            )}

            {/* buffer-lich: floating 99% progress-bar crown */}
            {isLich && (
              <g style={anim(!dead && "float 2.6s ease-in-out infinite", "100px 20px")}>
                <g transform={dead ? "rotate(9 100 20)" : undefined}>
                  <path
                    d="M70 14 L76 3 L82 14 Z M94 14 L100 1 L106 14 Z M118 14 L124 3 L130 14 Z"
                    fill={dead ? p.rim : LOADING_GREEN}
                    stroke={INK}
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <rect x="60" y="13" width="80" height="16" rx="5" fill={INK} stroke={p.rim} strokeWidth="2" />
                  <rect x="63" y="16" width="73.3" height="10" rx="3" fill={dead ? p.rim : LOADING_GREEN} />
                  <text
                    x="100"
                    y="21.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fill={INK}
                    aria-hidden="true"
                  >
                    99%
                  </text>
                </g>
              </g>
            )}

            {/* hit flash */}
            <ellipse
              key={hit}
              cx="100"
              cy="100"
              rx="62"
              ry="58"
              fill={url("flash")}
              className="animate-[flash_0.25s_ease-out_forwards]"
              opacity="0"
            />

            {hit > 0 && (
              <g opacity="0" style={anim("crb-boss-impact 0.36s ease-out forwards", `${impactX}px ${impactY}px`)}>
                <polygon points={starPoints(impactX, impactY, 18, 6)} fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
                <polygon points={starPoints(impactX, impactY, 9, 3.5)} fill={p.glow} />
              </g>
            )}
          </g>
        </g>
      </g>
    </svg>
  );
}
