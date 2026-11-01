// AUREON: wall paints of a room (`room.aureon_finish.walls = { material: "paint", color }`), shared by the editor and
// the 3D view; no three.js here, so the editor bundle stays small.
/** Wall paints offered in the editor (matt, smooth). The first is a clean white. */
export const AUREON_WALL_PAINTS: readonly { id: string; color: string }[] = [
  { id: "white", color: "#f4f3ef" },
  { id: "warm_white", color: "#efe9df" },
  { id: "sand", color: "#e2d6c3" },
  { id: "greige", color: "#cfc8bc" },
  { id: "sage", color: "#c5cdb9" },
  { id: "terracotta", color: "#d9b29a" },
  { id: "blue_grey", color: "#b9c4cc" },
  { id: "charcoal", color: "#5b5d5f" },
];
/** A valid paint colour, or null. */
export function paintColor(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

