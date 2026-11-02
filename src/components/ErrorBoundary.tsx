"use client";
import { Component, type ReactNode } from "react";

const RECOVER_MS = 3000;
const TICK_MS = 250;

type Props = { children: ReactNode; label?: string };
type State = { error: boolean; secondsLeft: number };

/** Keeps a render bug from blanking the overlay mid-stream: shows a fallback and auto-recovers. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: false, secondsLeft: 0 };
  private timer?: ReturnType<typeof setTimeout>;
  private ticker?: ReturnType<typeof setInterval>;
  private deadline = 0;

  static getDerivedStateFromError(): Partial<State> {
    return { error: true };
  }

  componentDidCatch(err: unknown) {
    console.error("Chat Raid Boss render error", err);
    this.clearTimers();
    this.deadline = Date.now() + RECOVER_MS;
    this.setState({ secondsLeft: Math.ceil(RECOVER_MS / 1000) });
    this.timer = setTimeout(this.retry, RECOVER_MS);
    this.ticker = setInterval(this.tick, TICK_MS);
  }

  componentWillUnmount() {
    this.clearTimers();
  }

  private clearTimers() {
    clearTimeout(this.timer);
    clearInterval(this.ticker);
  }

  private tick = () => {
    const secondsLeft = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
    if (secondsLeft !== this.state.secondsLeft) this.setState({ secondsLeft });
  };

  private retry = () => {
    this.clearTimers();
    this.setState({ error: false });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { label } = this.props;
    const { secondsLeft } = this.state;
    const totalSeconds = Math.ceil(RECOVER_MS / 1000);

    return (
      <div className="flex justify-center p-3">
        <div
          role="alert"
          aria-atomic="true"
          className="relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-[#ffb547]/50 bg-[#19191b]/95 p-3 text-left text-[#ededed] shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_8px_24px_rgba(0,0,0,0.5)] motion-reduce:animate-none!"
          style={{ animation: "crb-hud-in 260ms cubic-bezier(.2,.8,.2,1) both" }}
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ffb547]/15 text-[#ffb547]"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 10v4.5M12 17.5h.01" />
            </svg>
          </span>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold leading-snug">Overlay hiccup – recovering</p>
            <p className="truncate text-sm leading-relaxed text-[#a1a1a6]">
              {label ? <span>{label} · </span> : null}
              <span aria-hidden="true">
                Auto-retry in <span className="font-semibold tabular-nums text-[#ededed]">{secondsLeft}s</span>
              </span>
              <span className="sr-only">Retrying automatically in {totalSeconds} seconds.</span>
            </p>
          </div>

          <button
            type="button"
            onClick={this.retry}
            className="shrink-0 rounded-lg bg-[#ffb547] px-3 py-1.5 text-sm font-semibold text-[#1a1206] transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb547] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            Retry now
          </button>

          <span
            key={this.deadline}
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#ffb547] motion-reduce:animate-none!"
            style={{ animation: `crb-hud-countdown ${RECOVER_MS}ms linear both` }}
          />
        </div>
      </div>
    );
  }
}
