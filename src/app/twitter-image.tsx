import { ImageResponse } from "next/og";

export const alt = "Type !atk in chat — command chips for !atk, !heal and !shield above a live boss HP bar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#16121F";
const PAPER = "#F6F0E4";
const MUTED = "#8E869C";
const HIT = "#FF5A3C";
const GOLD = "#FFD23F";

const HP_CURRENT = 6420;
const HP_MAX = 10000;
const HP_SEGMENTS = 24;

const COMMANDS = [
  { cmd: "!atk", hint: "deal damage", active: true },
  { cmd: "!heal", hint: "restore the squad", active: false },
  { cmd: "!shield", hint: "block the next hit", active: false },
] as const;

function CommandChip({ cmd, hint, active }: { cmd: string; hint: string; active: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginRight: 20,
        padding: "14px 22px 14px 18px",
        borderRadius: 16,
        border: `3px solid ${active ? HIT : "rgba(246,240,228,0.22)"}`,
        backgroundColor: active ? HIT : "rgba(246,240,228,0.06)",
        boxShadow: active ? `0 6px 0 0 ${PAPER}` : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 34,
          fontWeight: 800,
          color: active ? INK : PAPER,
          letterSpacing: -0.5,
        }}
      >
        {cmd}
      </div>
      <div
        style={{
          display: "flex",
          marginLeft: 14,
          fontSize: 20,
          fontWeight: 600,
          color: active ? INK : MUTED,
          opacity: active ? 0.8 : 1,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function HpBar() {
  const ratio = HP_CURRENT / HP_MAX;
  const filled = Math.round(ratio * HP_SEGMENTS);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              padding: "4px 12px",
              borderRadius: 8,
              backgroundColor: GOLD,
              color: INK,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            BOSS
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 14,
              fontSize: 24,
              fontWeight: 700,
              color: PAPER,
              letterSpacing: 3,
            }}
          >
            HP
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: PAPER }}>
            {HP_CURRENT.toLocaleString("en-US")}
          </div>
          <div style={{ display: "flex", marginLeft: 8, fontSize: 24, fontWeight: 600, color: MUTED }}>
            {`/ ${HP_MAX.toLocaleString("en-US")}`}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          height: 84,
          padding: 8,
          borderRadius: 18,
          border: `4px solid ${PAPER}`,
          backgroundColor: "rgba(246,240,228,0.05)",
        }}
      >
        {Array.from({ length: HP_SEGMENTS }).map((_, i) => {
          const isFilled = i < filled;
          const isEdge = i === filled - 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexGrow: 1,
                height: "100%",
                marginRight: i === HP_SEGMENTS - 1 ? 0 : 5,
                borderRadius: 6,
                backgroundColor: isFilled ? (isEdge ? GOLD : HIT) : "rgba(246,240,228,0.08)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "56px 72px 60px",
          backgroundColor: INK,
          color: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: HIT,
                marginRight: 12,
              }}
            />
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 4, color: PAPER }}>
              LIVE BOSS FIGHT
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: MUTED }}>
            Your chat is the controller
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            <div style={{ display: "flex" }}>Type</div>
            <div
              style={{
                display: "flex",
                margin: "0 28px",
                padding: "6px 26px 14px",
                borderRadius: 22,
                backgroundColor: HIT,
                color: INK,
                boxShadow: `0 10px 0 0 ${GOLD}`,
              }}
            >
              !atk
            </div>
            <div style={{ display: "flex" }}>in chat</div>
          </div>

          <div style={{ display: "flex", marginTop: 40 }}>
            {COMMANDS.map((c) => (
              <CommandChip key={c.cmd} cmd={c.cmd} hint={c.hint} active={c.active} />
            ))}
          </div>
        </div>

        <HpBar />
      </div>
    ),
    { ...size }
  );
}
