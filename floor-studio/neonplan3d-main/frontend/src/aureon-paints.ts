// AUREON: wall paints of a room (`room.aureon_finish.walls = { material: "paint", color }`), shared by the editor and
// the 3D view; no three.js here, so the editor bundle stays small.
/** Wall paints offered in the editor (matt, smooth). The first is a pure, bright white. */
export const AUREON_WALL_PAINTS: readonly { id: string; color: string }[] = [
  { id: "pure_white", color: "#fbfbfa" },
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


/**
 * Paint of single walls: `room.aureon_finish.wall_paints[i]` is the colour of the inner face of edge i (from point i
 * to point i + 1), aligned with `room.points` like `wall_heights`; null (or a missing entry) follows the room colour.
 */
export function wallPaints(finish: unknown, count: number): (string | null)[] {
  const list = (finish as { wall_paints?: unknown } | null | undefined)?.wall_paints;
  const out: (string | null)[] = [];
  for (let i = 0; i < count; i++) out.push(Array.isArray(list) ? paintColor(list[i]) : null);
  return out;
}

/** Keeps single-wall paints on their walls when a corner is inserted (split edge: both halves keep the colour) or removed. */
export function spliceWallPaints(room: { points: unknown[]; aureon_finish?: unknown }, index: number, remove: number, insert: (string | null)[]): void {
  const finish = room.aureon_finish as { wall_paints?: (string | null)[] } | null | undefined;
  if (!finish || !Array.isArray(finish.wall_paints)) return;
  const list = [...finish.wall_paints];
  while (list.length < index) list.push(null);
  list.splice(index, remove, ...insert);
  finish.wall_paints = list;
}

/** Outdoor areas that take finishes like a room (a floor covering and paint on the walls along them; owner 2026-11-12). */
export const AUREON_FINISH_OUTDOOR: ReadonlySet<string> = new Set(["balcony", "terrace"]);
