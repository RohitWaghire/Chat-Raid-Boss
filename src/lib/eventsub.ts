"use client";
/**
 * Twitch EventSub over WebSocket for Channel Points redemptions.
 * The browser opens the socket; the *server* (/api/eventsub/subscribe) creates the
 * subscription with TWITCH_USER_TOKEN, so the token never reaches the client.
 * Reward titles containing "smite", "revive" or "freeze" map to in-game power-ups.
 */
export type Redemption = { user: string; reward: "smite" | "revive_all" | "freeze" };

export function rewardFor(title: string): Redemption["reward"] | null {
  const t = title.toLowerCase();
  if (t.includes("smite")) return "smite";
  if (t.includes("revive")) return "revive_all";
  if (t.includes("freeze")) return "freeze";
  return null;
}

export function connectEventSub(channel: string, onRedeem: (r: Redemption) => void): () => void {
  let ws: WebSocket | null = null;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const open = (url = "wss://eventsub.wss.twitch.tv/ws") => {
    ws = new WebSocket(url);
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        const type = msg.metadata?.message_type;
        if (type === "session_welcome") {
          await fetch("/api/eventsub/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: msg.payload.session.id, channel }),
          });
        } else if (type === "session_reconnect") {
          const old = ws;
          open(msg.payload.session.reconnect_url);
          old?.close();
        } else if (type === "notification") {
          const e = msg.payload.event;
          const reward = rewardFor(e?.reward?.title ?? "");
          if (reward) onRedeem({ user: e.user_name, reward });
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      if (!stopped) timer = setTimeout(() => open(), 5000);
    };
  };
  open();
  return () => {
    stopped = true;
    clearTimeout(timer);
    ws?.close();
  };
}
