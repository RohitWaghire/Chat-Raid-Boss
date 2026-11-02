/** Lift dark Twitch name colors toward white so names stay legible (WCAG AA) on the dark overlay. */
export function readable(hex: string | undefined): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return "#e9d5ff";
  let [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const lum = () => [r, g, b].map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  for (let k = 0; k < 10 && lum() < 0.3; k++) [r, g, b] = [r, g, b].map((c) => Math.round(c + (255 - c) * 0.2));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
