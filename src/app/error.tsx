"use client";

import { useEffect } from "react";
import Link from "next/link";

function CrashedServerArt() {
  return (
    <svg
      viewBox="0 0 200 170"
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="100" cy="160" rx="62" ry="6" fill="#232325" />

      <path d="M64 46 C50 28 46 14 52 2 C60 18 72 28 82 34 Z" fill="#3a2a55" />
      <path d="M136 46 C150 28 154 14 148 2 C140 18 128 28 118 34 Z" fill="#3a2a55" />
      <ellipse cx="100" cy="56" rx="48" ry="36" fill="#24183a" />
      <path d="M76 46 L94 53 L92 60 L78 54 Z" fill="#ff8fa3" />
      <path d="M124 46 L106 53 L108 60 L122 54 Z" fill="#ff8fa3" />
      <path d="M84 74 L90 70 L96 75 L100 70 L104 75 L110 70 L116 74" fill="none" stroke="#141415" strokeWidth="3" strokeLinejoin="round" />

      <rect x="58" y="72" width="84" height="84" rx="6" fill="#232325" stroke="#5b4580" strokeWidth="2" />
      <rect x="66" y="82" width="68" height="16" rx="3" fill="#24183a" />
      <rect x="66" y="105" width="68" height="16" rx="3" fill="#24183a" />
      <rect x="66" y="128" width="68" height="16" rx="3" fill="#24183a" />
      <circle cx="74" cy="90" r="2.5" fill="#c4a3ff" />
      <circle cx="74" cy="113" r="2.5" fill="#ff8fa3" />
      <circle cx="74" cy="136" r="2.5" fill="#5b4580" />
      <path d="M84 90 H108 M84 113 H100 M84 136 H112" stroke="#3a2a55" strokeWidth="2" strokeLinecap="round" />

      <path d="M48 84 C54 78 60 80 62 86 L60 96 C56 92 52 92 48 94 Z" fill="#3a2a55" />
      <path d="M152 84 C146 78 140 80 138 86 L140 96 C144 92 148 92 152 94 Z" fill="#3a2a55" />

      <polyline
        points="104,72 96,92 110,104 98,122 108,138 102,156"
        fill="none"
        stroke="#ff8fa3"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M116 98 L126 94 M114 108 L124 112 M90 118 L80 122" stroke="#ff8fa3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#141415] px-6 py-16 text-center font-sans text-[#ededed]">
      <div className="w-44 sm:w-56">
        <CrashedServerArt />
      </div>

      <div role="alert" className="flex max-w-md flex-col items-center gap-3">
        <p className="font-mono text-sm font-semibold uppercase tracking-widest text-[#ff8fa3]">
          Critical hit · Server down
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          The boss crashed the server
        </h1>
        <p className="text-pretty text-base leading-relaxed text-[#a1a1a6]">
          Something broke on our end. Your raid progress in chat is safe. Hit retry to jump back into the fight.
        </p>
        {error.digest ? (
          <p className="font-mono text-sm text-[#b3a7cb]">
            <span>Error ref: </span>
            <code className="select-all rounded bg-[#232325] px-1.5 py-0.5 text-[#ededed]">{error.digest}</code>
          </p>
        ) : null}
      </div>

      <div className="flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#9146FF] px-5 text-sm font-semibold text-[#ffffff] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[#6421c9] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c4a3ff] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          Retry the raid
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#6b5592] px-5 text-sm font-semibold text-[#ededed] transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#c4a3ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c4a3ff] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
