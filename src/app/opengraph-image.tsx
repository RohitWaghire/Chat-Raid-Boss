import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Chat Raid Boss: Your whole chat vs. one raid boss. A Twitch chat vs. AI raid boss OBS overlay.";

const C = {
  purple: "#9146FF",
  lilac: "#BF94FF",
  night: "#0E0618",
  paper: "#F6EFFF",
  hp: "#FF3B5C",
};

const HP_SEGMENTS = 20;
const HP_FILLED = 14;

const CHAT_HITS = [
  { user: "pogfrog", text: "!atk", top: 6, left: -36, rotate: -6 },
  { user: "modmike", text: "!atk x3", top: 392, left: 286, rotate: 5 },
  { user: "lurk_lord", text: "!heal", top: 436, left: -8, rotate: -3 },
];

function TeethRow({ top }: { top: number }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top,
        left: 0,
        width: "100%",
        justifyContent: "space-around",
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: 34,
            height: 34,
            backgroundColor: C.paper,
            transform: "rotate(45deg)",
          }}
        />
      ))}
    </div>
  );
}

function Eye({ left, pupilSide }: { left: number; pupilSide: "left" | "right" }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 104,
        left,
        width: 100,
        height: 74,
        borderRadius: 18,
        backgroundColor: C.paper,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 24,
          [pupilSide]: 14,
          width: 34,
          height: 34,
          borderRadius: 8,
          backgroundColor: C.night,
        }}
      />
    </div>
  );
}

function BossFace() {
  return (
    <div style={{ display: "flex", position: "relative", width: 460, height: 480 }}>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 44,
          left: 78,
          width: 110,
          height: 110,
          borderRadius: 18,
          backgroundColor: C.lilac,
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 44,
          left: 272,
          width: 110,
          height: 110,
          borderRadius: 18,
          backgroundColor: C.lilac,
          transform: "rotate(45deg)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 92,
          left: 40,
          width: 380,
          height: 340,
          borderRadius: 84,
          backgroundColor: C.purple,
          border: `8px solid ${C.lilac}`,
          boxShadow: "0 22px 0 rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 72,
            left: 48,
            width: 124,
            height: 24,
            borderRadius: 6,
            backgroundColor: C.night,
            transform: "rotate(20deg)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 72,
            left: 192,
            width: 124,
            height: 24,
            borderRadius: 6,
            backgroundColor: C.night,
            transform: "rotate(-20deg)",
          }}
        />

        <Eye left={58} pupilSide="right" />
        <Eye left={206} pupilSide="left" />

        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 208,
            left: 72,
            width: 220,
            height: 92,
            borderRadius: 22,
            backgroundColor: C.night,
            overflow: "hidden",
          }}
        >
          <TeethRow top={-18} />
          <TeethRow top={75} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 8,
          right: -10,
          fontSize: 48,
          fontWeight: 800,
          color: C.hp,
          letterSpacing: -1,
          transform: "rotate(10deg)",
          textShadow: `0 4px 0 ${C.night}`,
        }}
      >
        -1,284
      </div>

      {CHAT_HITS.map((hit) => (
        <div
          key={hit.user}
          style={{
            display: "flex",
            position: "absolute",
            top: hit.top,
            left: hit.left,
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 12,
            backgroundColor: "rgba(14,6,24,0.92)",
            border: `2px solid ${C.purple}`,
            fontSize: 22,
            transform: `rotate(${hit.rotate}deg)`,
          }}
        >
          <div style={{ display: "flex", color: C.lilac }}>{hit.user}:</div>
          <div style={{ display: "flex", color: C.paper }}>{hit.text}</div>
        </div>
      ))}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: C.night,
          backgroundImage:
            "radial-gradient(circle at 78% 52%, rgba(145,70,255,0.5) 0%, rgba(145,70,255,0.12) 32%, rgba(14,6,24,0) 58%)",
          color: C.paper,
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 620,
            height: "100%",
          }}
        >
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 18px",
                borderRadius: 999,
                backgroundColor: "rgba(145,70,255,0.18)",
                border: "2px solid rgba(191,148,255,0.5)",
                fontSize: 20,
                letterSpacing: 3,
                color: C.lilac,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: C.hp,
                }}
              />
              <div style={{ display: "flex", color: C.paper }}>Live raid</div>
              <div style={{ display: "flex" }}>· TWITCH OBS OVERLAY</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 118,
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: -5,
              }}
            >
              <div style={{ display: "flex" }}>Chat Raid</div>
              <div style={{ display: "flex", color: C.lilac }}>Boss</div>
            </div>
            <div style={{ display: "flex", fontSize: 38, color: C.paper, letterSpacing: -0.5 }}>
              Your whole chat vs. one raid boss
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                fontSize: 21,
                letterSpacing: 3,
              }}
            >
              <div style={{ display: "flex", color: C.paper }}>GLITCHMAW · THE CHAT EATER</div>
              <div style={{ display: "flex", color: C.hp }}>72,000 / 100,000</div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 5,
                padding: 6,
                borderRadius: 12,
                border: `3px solid ${C.lilac}`,
                backgroundColor: "rgba(145,70,255,0.12)",
              }}
            >
              {Array.from({ length: HP_SEGMENTS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flex: 1,
                    height: 30,
                    borderRadius: 4,
                    backgroundColor: i < HP_FILLED ? C.hp : "rgba(246,239,255,0.08)",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", fontSize: 21, color: "rgba(246,239,255,0.6)" }}>
              1,284 chatters attacking · type !atk to join the raid
            </div>
          </div>
        </div>

        <div style={{ display: "flex", position: "absolute", right: 56, top: 72 }}>
          <BossFace />
        </div>
      </div>
    ),
    size,
  );
}
