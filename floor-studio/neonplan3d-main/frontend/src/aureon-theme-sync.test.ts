import assert from "node:assert/strict";
import { test } from "node:test";
import { themeTokens } from "./aureon-theme-sync.ts";

test("the stored AUREON look is taken only as plain colour tokens", () => {
  const t = themeTokens({ v: 1, tokens: {
    "--aureon-ui-bg": "#0e0d0c", "--aureon-ui-accent-rgb": "230, 204, 154", "--aureon-ui-chrome": "rgba(27, 26, 24, 0.86)",
    "--aureon-ui-shadow": "0 8px 30px rgba(0, 0, 0, 0.45)", "--aureon-ui-scheme": "dark",
    "--aureon-ui-text": "url(https://evil.example/x)", "--other": "#ffffff", "--aureon-ui-muted": "red;}*{display:none",
  } });
  assert.deepEqual(Object.keys(t).sort(), ["--aureon-ui-accent-rgb", "--aureon-ui-bg", "--aureon-ui-chrome", "--aureon-ui-scheme", "--aureon-ui-shadow"]);
  assert.deepEqual(themeTokens(null), {});
  assert.deepEqual(themeTokens({ tokens: "x" }), {});
});
