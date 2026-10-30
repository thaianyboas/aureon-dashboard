// Looks of the 3D view. Geometry keeps its neon colours; a small shader patch maps them to the chosen
// look, so switching is instant and nothing has to be rebuilt. Signal colours (lit lamps, open windows,
// glowing screens) are bright and saturated and stay as they are in every look.

import { AdditiveBlending, NormalBlending, Vector3, type Material } from "three";
import { THEMES, type Theme } from "../themes.ts";

export type { Theme } from "../themes.ts";

export interface ThemeUniform {
  value: number;
}

export function themeIndex(theme: Theme): number {
  return THEMES.indexOf(theme);
}

/** The neon look's accent (lines, cyan surfaces): the stock cyan, or a colour of the user's choice. */
export const accentUniform = { value: new Vector3(0.22, 0.88, 1) };
export const accentOnUniform = { value: 0 };

/** "#rrggbb" to the 0–1 colour the shader uses, null for anything else. */
export function parseAccent(hex: string | null | undefined): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const GLSL = `
uniform int uTheme;
varying vec3 vAureonSurfacePos;
uniform vec3 uAccent;
uniform int uAccentOn;
// Smooth, deterministic 3D value noise. A continuous finish avoids the
// hard voxel edges and shimmer of cell-by-cell random colours while orbiting.
float aureonHash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float aureonValueNoise3(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(aureonHash3(cell), aureonHash3(cell + vec3(1.0, 0.0, 0.0)), f.x);
  float b = mix(aureonHash3(cell + vec3(0.0, 1.0, 0.0)), aureonHash3(cell + vec3(1.0, 1.0, 0.0)), f.x);
  float c = mix(aureonHash3(cell + vec3(0.0, 0.0, 1.0)), aureonHash3(cell + vec3(1.0, 0.0, 1.0)), f.x);
  float d = mix(aureonHash3(cell + vec3(0.0, 1.0, 1.0)), aureonHash3(cell + vec3(1.0, 1.0, 1.0)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}
vec3 fp3dThemed(vec3 c, bool line) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
  if (uTheme == 0) {
    // an own accent: every line and every cyan surface takes it, as bright as it was
    if (uAccentOn == 1 && (line || (sat > 0.35 && c.r < c.g * 0.8 && c.b > c.g * 0.85 && c.g > c.b * 0.6))) return uAccent * mx;
    return c;
  }
  // signal colours keep their colour
  if (!line && mx > 0.45 && sat > 0.45) return c;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  if (uTheme == 1) {
    // blueprint: white lines on shades of blue
    if (line) return vec3(0.8, 0.9, 1.0) * min(1.0, mx * 1.15);
    return mix(vec3(0.04, 0.13, 0.3), vec3(0.2, 0.42, 0.75), clamp(l * 5.0, 0.0, 1.0));
  }
  if (uTheme == 3) {
    // Night: preserve active device signal colours while darkening inactive geometry.
    if (line) return vec3(0.26, 0.39, 0.55) * clamp(mx, 0.15, 0.8);
    // Keep structural surfaces legible at night without turning them into emissive objects.
    float nightLevel = smoothstep(0.0, 0.42, l);
    return mix(vec3(0.018, 0.024, 0.038), vec3(0.19, 0.23, 0.29), nightLevel);
  }
  if (uTheme == 4) {
    // Real: restrained architectural palette, tonal shading and dark trim.
    // This is a material-style prototype, not PBR textures or photorealism.
    if (line) return vec3(0.17, 0.16, 0.15) * clamp(mx * 1.3, 0.45, 1.0);
    // Keep the original furniture's hue instead of turning every object beige.
    // This is still a palette/shading enhancement; it does not supply PBR maps.
    float tone = smoothstep(0.015, 0.48, l);
    vec3 base = mix(vec3(0.19, 0.18, 0.17), vec3(0.88, 0.83, 0.75), tone);
    vec3 hue = c / max(mx, 0.001);
    // Preserve furniture identity more faithfully: retain a share of the source colour
    // while keeping the restrained, warm architectural lighting of the Real look.
    float hueWeight = clamp(sat * 0.62, 0.0, 0.62);
    vec3 tinted = mix(base, base * hue, hueWeight);
    // Subtle, stable world-space material grain. Unlike screen-space noise, the
    // finish stays attached to walls and furniture when the camera moves.
    // No image textures or additional downloads are required.
    // Use all three world axes: xz-only grain collapses into stripes on
    // vertical walls and furniture sides. This 3D cell noise remains stable
    // under camera movement and does not require texture downloads.
    float grain = aureonValueNoise3(vAureonSurfacePos.xyz * 58.0);
    float finish = mix(0.975, 1.025, grain);
    return clamp(mix(tinted, c, 0.18) * finish, 0.0, 1.0);
  }
  // day: light surfaces that keep their shading and some of their hue, dark blue lines (#645: too bright, too flat –
  // the neon surfaces' dark tones are spread wider, so walls, floors and furniture stand apart)
  if (line) return vec3(0.05, 0.11, 0.27) * clamp(mx * 1.6, 0.6, 1.0);
  vec3 g = vec3(clamp(0.28 + l * 3.6, 0.0, 0.92));
  return mix(g, g * (c / max(mx, 0.001)), 0.3);
}
`;

/**
 * Maps a material's colours to the look in `uniform` (0 neon, 1 blueprint, 2 day, 3 night, 4 real). Composes with an
 * existing onBeforeCompile (e.g. the fold patch). `line`: edges are mapped as lines.
 */
export function themed<T extends Material>(material: T, uniform: ThemeUniform, line = false): T {
  const before = material.onBeforeCompile.bind(material);
  const key = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    before(shader, renderer);
    shader.uniforms.uTheme = uniform;
    shader.uniforms.uAccent = accentUniform;
    shader.uniforms.uAccentOn = accentOnUniform;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vAureonSurfacePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAureonSurfacePos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${GLSL}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n  diffuseColor.rgb = fp3dThemed(diffuseColor.rgb, ${line ? "true" : "false"});`);
  };
  material.customProgramCacheKey = () => `${key()}-themed-${line ? "l" : "s"}`;
  return material;
}

/** Reserve additive neon glow for Neon and Blueprint. Night and Real use normal blending
 * so structural edges do not look self-illuminated. Day also uses normal blending. */
export function lineBlending(theme: Theme): typeof AdditiveBlending | typeof NormalBlending {
  return theme === "day" || theme === "night" || theme === "real" ? NormalBlending : AdditiveBlending;
}
