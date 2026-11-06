// AUREON: the Floor Studio sidebar panel looks like the AUREON dashboard. The dashboard keeps the resolved editor
// tokens (--aureon-ui-*, from its theme, palette and own accent colour) in this user's Home Assistant frontend data
// (key "aureon_floor_theme"); the panel follows them live. Embedded in the dashboard the tokens come from the host.
import type { HomeAssistant } from "./types.ts";

export const THEME_KEY = "aureon_floor_theme";
const NAMES = new Set([
  "--aureon-ui-bg", "--aureon-ui-bg2", "--aureon-ui-chrome", "--aureon-ui-chrome-solid", "--aureon-ui-line",
  "--aureon-ui-text", "--aureon-ui-muted", "--aureon-ui-accent", "--aureon-ui-accent-text", "--aureon-ui-soft",
  "--aureon-ui-accent-rgb", "--aureon-ui-soft-rgb", "--aureon-ui-line-rgb", "--aureon-ui-muted-rgb",
  "--aureon-ui-panel-rgb", "--aureon-ui-wall", "--aureon-ui-wall-ext", "--aureon-ui-shadow", "--aureon-ui-scheme",
]);
// only plain colour values: a hex colour, an "r, g, b" triplet, rgba(), a box shadow of those, or the colour scheme
const VALUE = /^(#[0-9a-f]{6}|\d{1,3}, \d{1,3}, \d{1,3}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0|1|0?\.\d+)\)|0 \d{1,2}px \d{1,2}px rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0|1|0?\.\d+)\)|dark|light)$/i;

/** The valid tokens of a stored value (anything else is left out). */
export function themeTokens(value: unknown): Record<string, string> {
  const tokens = (value as { tokens?: unknown } | null)?.tokens;
  if (!tokens || typeof tokens !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens as Record<string, unknown>)) if (NAMES.has(k) && typeof v === "string" && VALUE.test(v)) out[k] = v;
  return out;
}

/** Follow the AUREON look on `host`; returns the unsubscribe. Older Home Assistant without the subscription: read once. */
export async function followAureonTheme(host: HTMLElement, hass: HomeAssistant): Promise<() => void> {
  const apply = (value: unknown) => {
    const tokens = themeTokens(value);
    for (const name of NAMES) host.style.removeProperty(name);
    for (const [k, v] of Object.entries(tokens)) host.style.setProperty(k, v);
    if (tokens["--aureon-ui-scheme"]) host.dataset.aureonScheme = tokens["--aureon-ui-scheme"];
  };
  try {
    const unsub = await hass.connection.subscribeMessage<{ value: unknown }>((msg) => apply(msg?.value), { type: "frontend/subscribe_user_data", key: THEME_KEY });
    return () => void unsub();
  } catch {
    try {
      const res = await hass.callWS<{ value: unknown }>({ type: "frontend/get_user_data", key: THEME_KEY });
      apply(res?.value);
    } catch {
      // no stored look: the standalone fallback palette stays
    }
    return () => undefined;
  }
}
