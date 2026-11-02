# Chat Raid Boss

**Tagline:** Your Twitch chat vs. an AI boss that fights back and roasts your viewers by name.

## Inspiration
Most chat interactions are polls and predictions: people click once and go back to lurking. MMO raids are the opposite. Everyone has a role, people save each other, and the boss reacts. We wanted to bring that feeling to Twitch chat with nothing to install.

## What it does
Chat Raid Boss is an OBS browser-source overlay. When the streamer starts a raid, chat fights a boss together:
- `!atk` to hit (subs crit more often), `!heal` to revive knocked-out raiders, `!shield` to block the boss's next strike
- Spamming the same emote builds a **combo** that deals burst damage
- **Bits** deal massive damage
- Every few seconds the boss **knocks out real chatters by name**. Others have to heal them back in.
- The boss enrages at 50% HP and gets desperate at 20%
- An **AI narrator** (OpenAI) taunts the top damage dealers in character, based on what's actually happening
- A **HYPE meter** fills as chat plays well; at 100% anyone can fire `!ult` for a massive hit
- **Channel Points** (via EventSub) can trigger Smite, Mass Revive, or Freeze the boss
- Victory or defeat screen with confetti and awards: **MVP**, **Medic**, **Tank**
- Juice: an SVG boss that changes form each phase, floating damage numbers, particles, screen shake, and synthesized sound effects
- Extras for creators: an attract-mode demo loop (`/attract`), a compact corner overlay, a command cheat-sheet overlay, OBS and viewer guides, Twitch panels, shareable result cards with OG images, and press slides with a storyboard.

The streamer sets it up from a studio page:
- Paste a channel and pick a preset (auto-chosen from live viewer count).
- Optionally tune HP per raider, cooldowns, and attack speed.
- Copy one URL into OBS. The overlay is transparent and looks the same at 720p, 1080p, or 1440p.
- Mods can run it from chat with `!raid start` and `!raid reset`.
- Prefer a smaller footprint? A compact corner widget (`layout=compact`).
- Streamer kit: Twitch panel images, a viewer command guide (`/commands`), an illustrated OBS guide (`/obs`), and a shareable result card for socials (`/r`).

## How we built it
- Built with **OpenAI Codex** in a single thread, from the game design and engine to the Twitch IRC client, UI, and docs.
- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- **Twitch chat** over the official IRC WebSocket with an anonymous read-only login, so it works for any channel with no OAuth
- **Twitch Helix API** (client credentials) for the channel avatar and live status
- **OpenAI Responses API** for the boss narrator, with canned fallbacks so the stream never breaks
- **Twitch EventSub** (WebSocket transport) for Channel Points redemptions. Subscriptions are created server-side so tokens never touch the overlay.
- A pure, deterministic game engine (`applyMessages` / `tick`) with an injectable RNG.
  - 19 Vitest unit tests, plus a Playwright smoke test covering the APIs, the studio, overlay transparency, frame rate, the end screen, and console errors.
  - axe-core: 0 violations on 13 pages. Lighthouse on `/`: 98 / 100 / 100 / 100. Overlay holds 60 fps in both the full and compact layouts.

## Challenges we ran into
- Balance from 5 to 50,000 viewers:
  - Boss HP grows with every new raider, and the boss KOs more raiders as chat grows.
  - Per-user cooldowns stop one spammer from carrying the raid.
- Chat floods: messages are queued and applied in one batch per animation frame, so 50k messages from 7k chatters process in under 1s.
- 60 fps at 1080p: profiling showed `backdrop-filter` was capping the overlay at 17 fps. Removing it brought it to about 60 fps.
- Never breaking on stream. Every external dependency (AI, Helix, IRC) has a fallback or auto-reconnect.

## Accomplishments that we're proud of
- Zero-setup live mode: paste a channel name and it's reading real chat in about a second.
- The boss calls out real chatters by name, which gets chat yelling and helping each other.

## What we learned
Cooperative mechanics with roles (damage, healer, tank) create much more chat engagement than voting. Short AI lines on a fixed cadence feel alive without spamming the screen.

## What's next
- Twitch Extension version with per-viewer HP panels
- More EventSub events: raids that bring in "reinforcements," subs as revives
- More boss packs (9 built-in so far, including seasonal ones), streamer-drawn boss art, plus persistent season leaderboards

## Built with
nextjs, typescript, react, tailwindcss, twitch-api, twitch-chat, twitch-irc, websocket, openai, openai-codex, obs, vercel
