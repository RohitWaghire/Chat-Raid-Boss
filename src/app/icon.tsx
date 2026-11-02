import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const alt = `${BRAND.name} boss mark`;

const PURPLE = "#9146FF";
const INK = "#0E0E10";
const WHITE = "#FFFFFF";
const GOLD = "#FFC93C";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PURPLE,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 4,
            height: 12,
          }}
        >
          <div style={{ width: 8, height: 8, backgroundColor: GOLD, borderRadius: "3px 3px 0 0" }} />
          <div style={{ width: 8, height: 12, backgroundColor: GOLD, borderRadius: "3px 3px 0 0" }} />
          <div style={{ width: 8, height: 8, backgroundColor: GOLD, borderRadius: "3px 3px 0 0" }} />
        </div>

        <div
          style={{
            width: 46,
            height: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: INK,
            borderRadius: 10,
            borderTop: `4px solid ${GOLD}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 13,
                height: 8,
                backgroundColor: WHITE,
                borderRadius: "1px 0 6px 6px",
                transform: "rotate(14deg)",
              }}
            />
            <div
              style={{
                width: 13,
                height: 8,
                backgroundColor: WHITE,
                borderRadius: "0 1px 6px 6px",
                transform: "rotate(-14deg)",
              }}
            />
          </div>

          <div
            style={{
              width: 22,
              height: 5,
              backgroundColor: WHITE,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}