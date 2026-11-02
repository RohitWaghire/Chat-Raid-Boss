import type { ChatMessage } from "./types";

/**
 * Read-only anonymous connection to Twitch chat over the official IRC WebSocket
 * (wss://irc-ws.chat.twitch.tv). Anonymous "justinfan" logins can read any public
 * channel's chat without OAuth, so the overlay works with zero credentials.
 */
export type ChatStatus = "idle" | "connecting" | "connected" | "error" | "closed";

export function parseTags(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const kv of raw.split(";")) {
    const i = kv.indexOf("=");
    if (i > 0) out[kv.slice(0, i)] = kv.slice(i + 1);
  }
  return out;
}

const FALLBACK_COLORS = ["#FF4A4A", "#4AFFB4", "#9146FF", "#FFD24A", "#4AC8FF", "#FF7AE0"];

export function parsePrivmsg(line: string): ChatMessage | null {
  // @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
  const m = line.match(/^(?:@(\S+) )?:(\w+)!\S+ PRIVMSG #\w+ :(.*)$/);
  if (!m) return null;
  const tags = parseTags(m[1] ?? "");
  const user = tags["display-name"] || m[2];
  const badges = tags["badges"] ?? "";
  return {
    id: tags["id"] || `${Date.now()}-${Math.random()}`,
    user,
    color: tags["color"] || FALLBACK_COLORS[user.length % FALLBACK_COLORS.length],
    text: m[3].replace(/^\u0001ACTION (.*)\u0001$/, "$1"),
    bits: Number(tags["bits"] ?? 0) || 0,
    isSub: tags["subscriber"] === "1" || badges.includes("subscriber"),
    isMod: tags["mod"] === "1" || badges.includes("broadcaster"),
    ts: Number(tags["tmi-sent-ts"] ?? Date.now()),
  };
}

export function connectTwitchChat(
  channel: string,
  onMessage: (m: ChatMessage) => void,
  onStatus: (s: ChatStatus) => void,
): () => void {
  let ws: WebSocket | null = null;
  let stopped = false;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const chan = channel.toLowerCase().replace(/^#/, "").trim();

  const open = () => {
    onStatus("connecting");
    ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws?.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws?.send("PASS SCHMOOPIIE");
      ws?.send(`NICK justinfan${Math.floor(10000 + Math.random() * 80000)}`);
      ws?.send(`JOIN #${chan}`);
    };
    ws.onmessage = (ev) => {
      for (const line of String(ev.data).split("\r\n")) {
        if (!line) continue;
        if (line.startsWith("PING")) ws?.send(line.replace("PING", "PONG"));
        else if (line.includes(" JOIN #")) {
          retry = 0;
          onStatus("connected");
        } else if (line.includes(" PRIVMSG #")) {
          const msg = parsePrivmsg(line);
          if (msg) onMessage(msg);
        }
      }
    };
    ws.onerror = () => onStatus("error");
    ws.onclose = () => {
      if (stopped) return onStatus("closed");
      onStatus("connecting");
      timer = setTimeout(open, Math.min(30_000, 1000 * 2 ** retry++));
    };
  };
  open();
  return () => {
    stopped = true;
    clearTimeout(timer);
    ws?.close();
  };
}
