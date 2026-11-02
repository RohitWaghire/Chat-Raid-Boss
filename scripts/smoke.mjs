/* eslint-disable @typescript-eslint/no-unused-expressions */
// End-to-end smoke test against a running server: `npm run build && npm start`, then `npm run smoke`.
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const fail = (m) => { console.error("✗", m); process.exitCode = 1; };
const ok = (m) => console.log("✓", m);
const b = await chromium.launch();
const errors = [];
const watch = (p) => { p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => m.type() === "error" && errors.push(m.text())); };

for (const [path, code] of [["/api/health", 200], ["/api/twitch/user?login=!!", 400]]) {
  const r = await fetch(BASE + path);
  r.status === code ? ok(`${path} → ${code}`) : fail(`${path} → ${r.status}, expected ${code}`);
}
const bad = await fetch(BASE + "/api/narrate", { method: "POST", body: "{nope" });
bad.status === 400 ? ok("narrate rejects bad JSON") : fail(`narrate bad JSON → ${bad.status}`);

// Studio: start a demo raid, chat a command, see the overlay URL.
const s = await b.newPage({ viewport: { width: 1440, height: 900 } });
watch(s);
await s.goto(BASE + "/");
await s.getByTestId("start").click();
await s.fill("#me", "!atk");
await s.press("#me", "Enter");
await s.waitForTimeout(1500);
const phase = await s.getByTestId("arena").getAttribute("data-phase");
["fight", "enraged", "desperate", "victory"].includes(phase) ? ok(`studio raid running (${phase})`) : fail(`studio phase ${phase}`);
(await s.getByTestId("overlay-url").inputValue()).includes("/overlay?") ? ok("overlay URL shown") : fail("overlay URL missing");

// Overlay: transparent for OBS, autostarts, finishes, frame rate.
const o = await b.newPage({ viewport: { width: 1920, height: 1080 } });
watch(o);
await o.goto(BASE + "/overlay?demo=1&sound=0&hp=500&scale=0&dur=30");
const bg = await o.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
bg.every((c) => c === "rgba(0, 0, 0, 0)" || c === "transparent") ? ok("overlay background transparent") : fail(`overlay bg ${bg}`);
const fps = await o.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; performance.now() - t < 3000 ? requestAnimationFrame(f) : res(n / 3); }; requestAnimationFrame(f); }));
fps >= 50 ? ok(`overlay ~${fps.toFixed(0)} fps during combat`) : fail(`overlay fps ${fps.toFixed(1)}`);
await o.getByTestId("end-screen").waitFor({ timeout: 40_000 }).then(() => ok("end screen shown"), () => fail("no end screen"));

errors.length ? fail(`console/page errors: ${errors.join(" | ")}`) : ok("no console or page errors");
await b.close();
