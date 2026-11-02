import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = `${BRAND.name} mascot`;

const PURPLE = "#9146FF";
const PURPLE_LIGHT = "#BF94FF";
const INK = "#0E0E10";
const WHITE = "#F7F2FF";

function Horn({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: isLeft ? 36 : 116,
        width: 0,
        height: 0,
        borderLeft: "14px solid transparent",
        borderRight: "14px solid transparent",
        borderBottom: `46px solid ${INK}`,
        transform: `rotate(${isLeft ? -22 : 22}deg)`,
      }}
    />
  );
}

function Eye({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";
  const tilt = isLeft ? 20 : -20;
  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        left: isLeft ? 16 : 62,
        width: 34,
        height: 30,
        display: "flex",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 4,
          width: 26,
          height: 18,
          borderRadius: "4px 4px 13px 13px",
          backgroundColor: WHITE,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 3,
            left: isLeft ? 14 : 3,
            width: 9,
            height: 9,
            borderRadius: 9,
            backgroundColor: PURPLE,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 2,
          left: -2,
          width: 38,
          height: 13,
          backgroundColor: INK,
          transform: `rotate(${tilt}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -2,
          left: 0,
          width: 34,
          height: 7,
          borderRadius: 4,
          backgroundColor: PURPLE_LIGHT,
          transform: `rotate(${tilt}deg)`,
        }}
      />
    </div>
  );
}

function Mouth() {
  return (
    <div
      style={{
        position: "absolute",
        top: 72,
        left: 28,
        width: 56,
        height: 16,
        padding: 3,
        borderRadius: 5,
        backgroundColor: WHITE,
        display: "flex",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 10,
            marginLeft: i === 0 ? 10 : 9,
            backgroundColor: INK,
          }}
        />
      ))}
    </div>
  );
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PURPLE,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 160,
            height: 160,
            borderRadius: 40,
            display: "flex",
            backgroundImage: `linear-gradient(160deg, #A970FF 0%, ${PURPLE} 55%, #7A2FF0 100%)`,
          }}
        >
          <Horn side="left" />
          <Horn side="right" />
          <div
            style={{
              position: "absolute",
              top: 48,
              left: 24,
              width: 112,
              height: 98,
              borderRadius: 34,
              backgroundColor: INK,
              display: "flex",
            }}
          >
            <Eye side="left" />
            <Eye side="right" />
            <Mouth />
          </div>
        </div>
      </div>
    ),
    size,
  );
}