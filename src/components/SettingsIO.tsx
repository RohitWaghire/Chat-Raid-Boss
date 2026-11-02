"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { configFromParams, paramsFromConfig } from "../lib/config";
import type { GameConfig } from "../lib/types";

type Props = { config: GameConfig; onImport: (c: GameConfig) => void };

type Field = { key: keyof GameConfig; param: string; label: string; unit?: string };

const FIELDS: readonly Field[] = [
  { key: "bossName", param: "boss", label: "Boss name" },
  { key: "bossHp", param: "hp", label: "Base HP" },
  { key: "hpPerRaider", param: "scale", label: "HP per raider" },
  { key: "durationSec", param: "dur", label: "Duration", unit: "s" },
  { key: "bossAttackEverySec", param: "atk", label: "Boss attack every", unit: "s" },
  { key: "cooldownMs", param: "cd", label: "Per-user cooldown", unit: "ms" },
];

const KNOWN_KEYS = new Set(FIELDS.flatMap((f) => [f.key as string, f.param]));
const MAX_FILE_BYTES = 64 * 1024;

type ParseResult =
  | { ok: true; next: GameConfig; adjusted: Set<keyof GameConfig>; ignored: string[] }
  | { ok: false; error: string };

function extractQuery(input: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) {
    return new URL(input).search;
  }
  const q = input.indexOf("?");
  const rest = q >= 0 ? input.slice(q + 1) : input;
  return rest.split("#")[0];
}

function parseInput(raw: string, current: GameConfig): ParseResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "" };

  const provided = new Map<string, string>();
  const ignored: string[] = [];

  if (input.startsWith("{")) {
    let data: unknown;
    try {
      data = JSON.parse(input);
    } catch {
      return { ok: false, error: "That doesn't look like valid JSON. Check for missing quotes or trailing commas." };
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "JSON must be an object like { \"bossName\": \"...\", \"bossHp\": 5000 }." };
    }
    const obj = data as Record<string, unknown>;
    for (const f of FIELDS) {
      const v = obj[f.key] ?? obj[f.param];
      if (v === undefined) continue;
      if (typeof v !== "string" && typeof v !== "number") {
        return { ok: false, error: `"${f.key}" must be a ${f.key === "bossName" ? "string" : "number"}.` };
      }
      provided.set(f.param, String(v));
    }
    for (const k of Object.keys(obj)) if (!KNOWN_KEYS.has(k)) ignored.push(k);
  } else {
    let qs: string;
    try {
      qs = extractQuery(input);
    } catch {
      return { ok: false, error: "That URL couldn't be parsed." };
    }
    const params = new URLSearchParams(qs);
    for (const f of FIELDS) {
      const v = params.get(f.param);
      if (v !== null) provided.set(f.param, v);
    }
    for (const k of new Set(params.keys())) if (!KNOWN_KEYS.has(k)) ignored.push(k);
  }

  if (provided.size === 0) {
    return {
      ok: false,
      error: "No recognized settings found. Paste exported JSON, an overlay URL, or a query string like ?boss=Gorgon&hp=20000.",
    };
  }

  const merged = paramsFromConfig(current);
  provided.forEach((v, k) => merged.set(k, v));
  const next = configFromParams(merged);

  const adjusted = new Set<keyof GameConfig>();
  for (const f of FIELDS) {
    const rawVal = provided.get(f.param);
    if (rawVal === undefined) continue;
    const result = next[f.key];
    const same = typeof result === "number" ? Number(rawVal) === result : rawVal === result;
    if (!same) adjusted.add(f.key);
  }

  return { ok: true, next, adjusted, ignored };
}

function formatValue(f: Field, v: GameConfig[keyof GameConfig]) {
  if (typeof v === "number") return `${v.toLocaleString()}${f.unit ?? ""}`;
  return `"${v}"`;
}

function dateStamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function isJsonLikeFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".json") ||
    name.endsWith(".txt") ||
    file.type === "application/json" ||
    file.type === "text/plain" ||
    file.type === ""
  );
}

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9146FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141415]";
const btn = `inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${ring} disabled:cursor-not-allowed disabled:opacity-40`;
const btnPrimary = `${btn} bg-[#9146FF] text-white hover:bg-[#7a32e6] disabled:hover:bg-[#9146FF]`;
const btnGhost = `${btn} border border-white/20 bg-white/5 text-white hover:bg-white/10`;

export function SettingsIO({ config, onImport }: Props) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const exportId = `${uid}-export`;
  const exportHintId = `${uid}-export-hint`;
  const importId = `${uid}-import`;
  const errorId = `${uid}-error`;
  const fileErrorId = `${uid}-file-error`;
  const hintId = `${uid}-hint`;
  const dropTextId = `${uid}-drop`;
  const previewTitleId = `${uid}-preview-title`;

  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLHeadingElement>(null);
  const dragDepth = useRef(0);
  const focusPreviewNext = useRef(false);

  const json = useMemo(() => JSON.stringify(config, null, 2), [config]);
  const parsed = useMemo(() => parseInput(input, config), [input, config]);
  const fileName = useMemo(() => {
    const slug = config.bossName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "boss";
    return `raid-settings-${slug}-${dateStamp()}.json`;
  }, [config.bossName]);

  const changes = useMemo(() => {
    if (!parsed.ok) return [];
    return FIELDS.filter((f) => parsed.next[f.key] !== config[f.key]);
  }, [parsed, config]);

  const error = !parsed.ok && parsed.error ? parsed.error : "";
  const unchangedCount = FIELDS.length - changes.length;

  useEffect(() => {
    if (focusPreviewNext.current && parsed.ok) {
      previewRef.current?.focus();
    }
    focusPreviewNext.current = false;
  }, [parsed]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(json);
      setStatus("Settings JSON copied to clipboard.");
    } catch {
      exportRef.current?.focus();
      exportRef.current?.select();
      setStatus("Couldn't access the clipboard. The JSON is selected, so press Ctrl+C or Cmd+C to copy.");
    }
  }, [json]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus(`Downloaded ${fileName}.`);
  }, [json, fileName]);

  const loadFile = useCallback(async (file: File) => {
    setStatus("");
    if (!isJsonLikeFile(file)) {
      setFileError(`${file.name} isn't a JSON file. Choose a .json settings export.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`${file.name} is too large. Settings files should be under 64 KB.`);
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        setFileError(`${file.name} is empty.`);
        return;
      }
      setFileError("");
      focusPreviewNext.current = true;
      setInput(text);
      setStatus(`Loaded ${file.name}. Review the changes below before applying.`);
    } catch {
      setFileError(`Couldn't read ${file.name}. Try choosing it again.`);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void loadFile(file);
    },
    [loadFile],
  );

  const acceptsDrag = (e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types);
    return types.includes("Files") || types.includes("text/plain");
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsDrag(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback(() => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        void loadFile(file);
        return;
      }
      const text = e.dataTransfer.getData("text/plain");
      if (text.trim()) {
        setFileError("");
        focusPreviewNext.current = true;
        setInput(text);
        setStatus("Dropped text loaded. Review the changes below before applying.");
      }
    },
    [loadFile],
  );

  const handleClear = useCallback(() => {
    setInput("");
    setFileError("");
    setStatus("Import cleared.");
  }, []);

  const handleApply = useCallback(() => {
    if (!parsed.ok || changes.length === 0) return;
    onImport(parsed.next);
    setInput("");
    setFileError("");
    setStatus(`Applied ${plural(changes.length, "change")}.`);
  }, [parsed, changes.length, onImport]);

  const describedBy = [error && errorId, fileError && fileErrorId, hintId].filter(Boolean).join(" ");

  return (
    <section
      data-testid="settings-io"
      aria-labelledby={titleId}
      className="rounded-2xl border border-white/10 bg-[#141415] p-4 text-white/90 sm:p-6"
    >
      <header className="mb-6 flex flex-col gap-1">
        <h2 id={titleId} className="text-balance text-lg font-bold text-white">
          Import / export settings
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-white/70">
          Back up your tuning, or bring in settings from another overlay. Imported values are checked and kept within
          allowed limits, and you&apos;ll see every change before it&apos;s applied.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={exportId} className="text-sm font-semibold text-white">
              Export
            </label>
            <p id={exportHintId} className="text-sm leading-relaxed text-white/70">
              Downloads as <span className="break-all font-mono text-[#d9c4ff]">{fileName}</span>
            </p>
          </div>
          <textarea
            id={exportId}
            ref={exportRef}
            readOnly
            value={json}
            rows={9}
            spellCheck={false}
            aria-describedby={exportHintId}
            onFocus={(e) => e.currentTarget.select()}
            className={`w-full resize-none rounded-lg border border-white/15 bg-black/40 p-3 font-mono text-sm leading-relaxed text-[#d9c4ff] ${ring}`}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCopy} className={btnPrimary}>
              Copy JSON
            </button>
            <button type="button" onClick={handleDownload} className={btnGhost}>
              Download .json
            </button>
          </div>
        </div>

        <div
          className="flex flex-col gap-3"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h3 className="text-sm font-semibold text-white">Import</h3>

          <div
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragging
                ? "border-[#b48aff] bg-[#9146FF]/15"
                : fileError
                  ? "border-red-400/70 bg-red-500/5"
                  : "border-white/20 bg-white/[0.03]"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={`size-6 ${dragging ? "text-[#d9c4ff]" : "text-white/70"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <p id={dropTextId} className="text-pretty text-sm leading-relaxed text-white/80">
              {dragging ? "Drop to load settings" : "Drag a .json settings file here, or"}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-describedby={dropTextId}
              className={btnGhost}
            >
              Choose file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {fileError && (
            <p
              id={fileErrorId}
              role="alert"
              className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-200"
            >
              {fileError}
            </p>
          )}

          <label htmlFor={importId} className="mt-1 text-sm font-semibold text-white">
            Or paste settings
          </label>
          <textarea
            id={importId}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (fileError) setFileError("");
            }}
            rows={7}
            spellCheck={false}
            placeholder={'{ "bossName": "Gorgon", "bossHp": 20000 }\nor https://…/overlay?boss=Gorgon&hp=20000'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`w-full resize-none rounded-lg border bg-black/40 p-3 font-mono text-sm leading-relaxed text-white placeholder:text-white/60 ${ring} ${
              error ? "border-red-400/80" : "border-white/15"
            }`}
          />
          <p id={hintId} className="text-sm leading-relaxed text-white/70">
            Accepts exported JSON, a full overlay URL, or a query string. Fields you leave out keep their current values.
          </p>
          {error && (
            <p
              id={errorId}
              role="alert"
              className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm leading-relaxed text-red-200"
            >
              {error}
            </p>
          )}

          {input && (
            <div>
              <button type="button" onClick={handleClear} className={btnGhost}>
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {parsed.ok && (
        <section
          aria-labelledby={previewTitleId}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-[#9146FF]/40 bg-[#9146FF]/5 p-4"
        >
          <div className="flex flex-col gap-1">
            <h3
              id={previewTitleId}
              ref={previewRef}
              tabIndex={-1}
              className="rounded text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9146FF]"
            >
              {changes.length === 0 ? "No changes to apply" : `Review ${plural(changes.length, "change")}`}
            </h3>
            <p className="text-sm leading-relaxed text-white/70">
              {changes.length === 0
                ? "These settings already match your current config."
                : unchangedCount > 0
                  ? `${plural(unchangedCount, "setting")} will stay the same.`
                  : "Every setting will be updated."}
            </p>
          </div>

          {changes.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Changed settings">
              {changes.map((f) => (
                <li key={f.key} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">{f.label}</span>
                    {parsed.adjusted.has(f.key) && (
                      <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                        Adjusted to allowed range
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="sr-only">Current:</span>
                      <del className="break-all font-mono text-white/70 decoration-white/50">
                        {formatValue(f, config[f.key])}
                      </del>
                    </span>
                    <span aria-hidden="true" className="text-white/70">
                      {"→"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="sr-only">New:</span>
                      <ins className="break-all font-mono font-semibold text-[#d9c4ff] no-underline">
                        {formatValue(f, parsed.next[f.key])}
                      </ins>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {parsed.ignored.length > 0 && (
            <p className="text-sm leading-relaxed text-white/70">
              Ignored unknown keys: <span className="break-all font-mono text-white/90">{parsed.ignored.join(", ")}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleApply} disabled={changes.length === 0} className={btnPrimary}>
              {changes.length > 0 ? `Apply ${plural(changes.length, "change")}` : "Apply"}
            </button>
            <button type="button" onClick={handleClear} className={btnGhost}>
              Discard
            </button>
          </div>
        </section>
      )}

      <p role="status" aria-live="polite" className="mt-4 min-h-5 text-sm leading-relaxed text-white/80">
        {status}
      </p>
    </section>
  );
}
