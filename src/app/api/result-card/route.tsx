import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

const COLOR = {
  bg: "#141415",
  surface: "#19191b",
  border: "#36363a",
  text: "#ededed",
  muted: "#a1a1a6",
  purple: "#9146FF",
  win: "#3ddc97",
  loss: "#ff4d6d",
  gold: "#ffc845",
  medic: "#3ddc97",
  tank: "#5ab0ff",
} as const;

const LIMITS = {
  boss: 40,
  person: 22,
  channel: 25,
  raiders: 9_999_999,
  damage: 999_999_999,
  mvpDmg: 999_999_999,
  secs: 359_999,
} as const;

/**
 * Keeps only Latin-range printable characters. Glyphs outside the bundled
 * default font would make next/og fetch fallback fonts/emoji from a CDN,
 * which violates the no-external-assets constraint.
 */
function cleanText(raw: string | null, max: number): string | null {
  if (!raw) return null;
  const cleaned = raw
    .normalize("NFKC")
    .replace(/[^\u0020-\u007E\u00A0-\u024F\u2013\u2014\u2019]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.length > max ? `${cleaned.slice(0, max - 1).trimEnd()}…` : cleaned;
}

function cleanChannel(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, LIMITS.channel);
  return cleaned.length >= 2 ? cleaned.toLowerCase() : null;
}

function cleanInt(raw: string | null, max: number): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[,_\s]/g, "");
  if (!/^\d{1,12}$/.test(digits)) return null;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, 0), max);
}

function formatInt(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-US");
}

function formatDuration(secs: number | null): string {
  if (secs === null) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statFontSize(value: string): number {
  if (value.length <= 7) return 64;
  if (value.length <= 9) return 52;
  return 42;
}

type AwardKind = "mvp" | "medic" | "tank";

const AWARD_META: Record<AwardKind, { label: string; color: string; icon: string }> = {
  mvp: {
    label: "MVP",
    color: COLOR.gold,
    icon: "M3 19h18l-1.6-11-4.6 4.2L12 5l-2.8 7.2L4.6 8z",
  },
  medic: {
    label: "Medic",
    color: COLOR.medic,
    icon: "M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z",
  },
  tank: {
    label: "Tank",
    color: COLOR.tank,
    icon: "M12 2l8 3v6.2c0 5-3.4 9.3-8 10.8-4.6-1.5-8-5.8-8-10.8V5z",
  },
};

type Award = { kind: AwardKind; name: string; detail?: string };

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flex: 1,
        height: 140,
        padding: "20px 28px",
        borderRadius: 20,
        backgroundColor: COLOR.surface,
        border: `2px solid ${COLOR.border}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 20, color: COLOR.muted }}>{label}</div>
      <div
        style={{
          display: "flex",
          fontSize: statFontSize(value),
          lineHeight: 1,
          letterSpacing: -1.5,
          fontWeight: 700,
          color: COLOR.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function AwardChip({ award }: { award: Award }) {
  const meta = AWARD_META[award.kind];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flex: 1,
        gap: 16,
        height: 84,
        padding: "0 22px",
        borderRadius: 18,
        backgroundColor: COLOR.surface,
        border: `2px solid ${meta.color}`,
        overflow: "hidden",
      }}
    >
      <svg width="36" height="36" viewBox="0 0 24 24">
        <path d={meta.icon} fill={meta.color} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
        <div style={{ display: "flex", fontSize: 18, letterSpacing: 3, color: meta.color }}>
          {award.detail ? `${meta.label} · ${award.detail}` : meta.label}
        </div>
        <div style={{ display: "flex", fontSize: 28, lineHeight: 1.1, color: COLOR.text }}>{award.name}</div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const boss = cleanText(params.get("boss"), LIMITS.boss) ?? "The Lag Wyrm";
    const isVictory = params.get("outcome")?.toLowerCase() !== "defeat";
    const channel = cleanChannel(params.get("channel"));
    const raiders = cleanInt(params.get("raiders"), LIMITS.raiders);
    const damage = cleanInt(params.get("damage"), LIMITS.damage);
    const secs = cleanInt(params.get("secs"), LIMITS.secs);
    const mvp = cleanText(params.get("mvp"), LIMITS.person);
    const mvpDmg = cleanInt(params.get("mvpDmg"), LIMITS.mvpDmg);
    const medic = cleanText(params.get("medic"), LIMITS.person);
    const tank = cleanText(params.get("tank"), LIMITS.person);

    const outcomeColor = isVictory ? COLOR.win : COLOR.loss;
    const headline = isVictory ? "Chat wins" : "Boss survives";

    const awards: Award[] = [];
    if (mvp) awards.push({ kind: "mvp", name: mvp, detail: mvpDmg !== null ? `${formatInt(mvpDmg)} damage` : undefined });
    if (medic) awards.push({ kind: "medic", name: medic });
    if (tank) awards.push({ kind: "tank", name: tank });

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            backgroundColor: COLOR.bg,
            color: COLOR.text,
            padding: "52px 64px 44px",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 10,
              backgroundColor: outcomeColor,
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 48,
                  borderRadius: 10,
                  backgroundColor: COLOR.purple,
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: 1,
                }}
              >
                CRB
              </div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: COLOR.text }}>
                Chat Raid Boss
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 20, color: COLOR.muted }}>Raid report</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                display: "flex",
                fontSize: 112,
                lineHeight: 1,
                letterSpacing: -1,
                fontWeight: 800,
                color: outcomeColor,
              }}
            >
              {headline}
            </div>
            <div style={{ display: "flex", fontSize: 38, lineHeight: 1.2, color: COLOR.muted }}>
              {isVictory ? `${boss} has fallen` : `${boss} holds the line`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            <StatTile label="Raiders" value={formatInt(raiders)} />
            <StatTile label="Total damage" value={formatInt(damage)} />
            <StatTile label="Fight time" value={formatDuration(secs)} />
          </div>

          {awards.length > 0 ? (
            <div style={{ display: "flex", gap: 24 }}>
              {awards.map((award) => (
                <AwardChip key={award.kind} award={award} />
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: channel ? "space-between" : "flex-end",
              fontSize: 22,
              color: COLOR.muted,
            }}
          >
            {channel ? (
              <div style={{ display: "flex", color: COLOR.text, letterSpacing: 0.5 }}>{`twitch.tv/${channel}`}</div>
            ) : null}
            <div style={{ display: "flex" }}>Type !atk to join the next raid</div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  } catch {
    return new Response("Failed to render result card", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
