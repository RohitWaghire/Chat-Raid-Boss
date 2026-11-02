import type { ReactNode } from "react";

export type UiIconName =
  | "swords"
  | "volume"
  | "volume-off"
  | "users"
  | "flag"
  | "castle"
  | "drop"
  | "flame"
  | "star"
  | "shield"
  | "warning"
  | "reset"
  | "external";

const paths: Record<UiIconName, ReactNode> = {
  swords: (
    <>
      <path d="m4 4 9 9" />
      <path d="m5 3 4 1-5 5-1-4Z" />
      <path d="m13 11 3-3" />
      <path d="m20 20-9-9" />
      <path d="m19 21-4-1 5-5 1 4Z" />
      <path d="m11 13-3 3" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15 9a5 5 0 0 1 0 6" />
      <path d="M18 6a9 9 0 0 1 0 12" />
    </>
  ),
  "volume-off": (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6" />
      <path d="m21 9-5 6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20Z" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.5V20h-3" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5c5-3 9 3 14 0v10c-5 3-9-3-14 0" />
    </>
  ),
  castle: (
    <>
      <path d="M4 21V9h4V5h4v4h4V5h4v16Z" />
      <path d="M9 21v-5h6v5M4 12h4m8 0h4" />
    </>
  ),
  drop: <path d="M12 3c3.5 4.5 6.5 7.7 6.5 11a6.5 6.5 0 1 1-13 0C5.5 10.7 8.5 7.5 12 3Z" />,
  flame: <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-2 4-2 5-2-2-3-4-3-7-3 3-5 7-5 11a7 7 0 0 0 7 8Zm0-3a3 3 0 0 1-3-3c0-1.5 1-2.5 2-4 .5 1.5 2 2 2 4a3 3 0 0 1-1 3Z" />,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />,
  warning: (
    <>
      <path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="m20 4-9 9" />
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
    </>
  ),
};

export function UiIcon({ name, className = "size-4" }: { name: UiIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
