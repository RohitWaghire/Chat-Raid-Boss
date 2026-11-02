import { ImageResponse } from "next/og";

const WIDTH = 320;
const HEIGHT = 160;

const PURPLE = "#9146FF";
const PURPLE_SOFT = "#cfa8ff";
const DARK = "#141415";
const SURFACE = "#19191b";
const LIGHT = "#ededed";

type Variant = "play" | "commands" | "bits";

const COMMANDS = [
  { cmd: "!atk", desc: "Deal raid damage" },
  { cmd: "!heal", desc: "Restore party HP" },
  { cmd: "!shield", desc: "Block next hit" },
  { cmd: "!ult", desc: "Charge team ultimate" },
] as const;

function parseVariant(value: string | null): Variant {
  return value === "commands" || value === "bits" ? value : "play";
}

function BossHead({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 22 C15 15 12 9 10 2 C17 7 23 13 26 19 Z" fill="#f3e9ff" stroke={DARK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M44 22 C49 15 52 9 54 2 C47 7 41 13 38 19 Z" fill="#f3e9ff" stroke={DARK} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="38" r="23" fill={PURPLE} stroke={DARK} strokeWidth="2.5" />
      <ellipse cx="24" cy="25" rx="7" ry="3" fill="#ffffff" opacity="0.35" transform="rotate(-20 24 25)" />
      <path d="M14 30 L28 34 L27 37 L15 34 Z M50 30 L36 34 L37 37 L49 34 Z" fill={DARK} />
      <circle cx="23" cy="40" r="5" fill="#ffffff" />
      <circle cx="41" cy="40" r="5" fill="#ffffff" />
      <circle cx="24" cy="41" r="3" fill="#f5b70b" />
      <circle cx="40" cy="41" r="3" fill="#f5b70b" />
      <rect x="23.3" y="38.5" width="1.4" height="5" rx="0.7" fill={DARK} />
      <rect x="39.3" y="38.5" width="1.4" height="5" rx="0.7" fill={DARK} />
      <path d="M22 49 Q32 58 42 49 Q32 52 22 49 Z" fill={DARK} />
      <path d="M25 50 L27 54 L29 50.8 Z M35 50.8 L37 54 L39 50 Z" fill="#fffaf2" />
    </svg>
  );
}

function BitGem({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 L28 12 L16 30 L4 12 Z" fill={PURPLE} stroke={LIGHT} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 12 L16 16 L28 12 M16 16 L16 30" stroke={LIGHT} strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M16 2 L10 11 L16 14 Z" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "3px 7px",
        borderRadius: 6,
        border: `1.5px solid ${PURPLE}`,
        background: SURFACE,
        color: LIGHT,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </div>
  );
}

function PlayPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BossHead size={68} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color: PURPLE_SOFT, letterSpacing: 3 }}>
            Play chat
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: LIGHT, letterSpacing: 1, lineHeight: 1 }}>
            Raid Boss
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {COMMANDS.map(({ cmd }) => (
          <Chip key={cmd} label={cmd} />
        ))}
      </div>
    </div>
  );
}

function CommandsPanel() {
  const rows = [COMMANDS.slice(0, 2), COMMANDS.slice(2, 4)];
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <BossHead size={20} />
        <div style={{ display: "flex", fontSize: 14, fontWeight: 800, color: PURPLE_SOFT, letterSpacing: 2.5 }}>
          Commands
        </div>
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 6, flex: 1 }}>
          {row.map(({ cmd, desc }) => (
            <div
              key={cmd}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                padding: "4px 8px",
                borderRadius: 7,
                background: SURFACE,
                borderLeft: `3px solid ${PURPLE}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 16, fontWeight: 800, color: LIGHT, lineHeight: 1.1 }}>
                {cmd}
              </div>
              <div style={{ display: "flex", fontSize: 12, color: PURPLE_SOFT, lineHeight: 1.3 }}>{desc}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function BitsPanel() {
  return (
    <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 12 }}>
      <BitGem size={64} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: LIGHT, lineHeight: 1, letterSpacing: 0.5 }}>
          BITS = DAMAGE
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              padding: "4px 10px",
              borderRadius: 6,
              background: SURFACE,
              border: `1.5px solid ${PURPLE}`,
              color: PURPLE_SOFT,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            1 bit = 2 dmg
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const variant = parseVariant(new URL(request.url).searchParams.get("variant"));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: WIDTH,
          height: HEIGHT,
          padding: 5,
          background: DARK,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: `2px solid ${PURPLE}`,
            background: DARK,
          }}
        >
          {variant === "commands" ? <CommandsPanel /> : variant === "bits" ? <BitsPanel /> : <PlayPanel />}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
