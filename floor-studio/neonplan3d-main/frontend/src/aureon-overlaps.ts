// AUREON (owner 2026-11-11: "Há divisões sobrepostas – corrige isso"): repairs the two drawing slips behind that
// warning without adding or removing corners (so wall heights, paints and doors stay on their edges): a room drawn
// over another one (the kitchen reaching over the balcony) – the corners of the bigger room that lie inside the
// smaller one move onto the smaller room's edge, so the two rooms meet instead of overlapping. Small gaps and slanted
// edges are left to "Fechar espaços" and "Endireitar".
import type { Room } from "./model.ts";

type Vec2 = [number, number];

const area = (p: readonly Vec2[]) => Math.abs(p.reduce((a, [x, z], i) => a + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * z, 0) / 2);
function inside(pt: Vec2, poly: readonly Vec2[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > pt[1] !== zj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
/** Overlap of two outlines in m², sampled on a 4 cm grid (enough to tell a real overlap from a wall's width). */
export function overlapArea(a: readonly Vec2[], b: readonly Vec2[], step = 0.04): number {
  const x0 = Math.max(Math.min(...a.map((p) => p[0])), Math.min(...b.map((p) => p[0])));
  const x1 = Math.min(Math.max(...a.map((p) => p[0])), Math.max(...b.map((p) => p[0])));
  const z0 = Math.max(Math.min(...a.map((p) => p[1])), Math.min(...b.map((p) => p[1])));
  const z1 = Math.min(Math.max(...a.map((p) => p[1])), Math.max(...b.map((p) => p[1])));
  if (x1 - x0 < step || z1 - z0 < step) return 0;
  let n = 0;
  for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) if (inside([x, z], a) && inside([x, z], b)) n++;
  return n * step * step;
}
function segmentsCross(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const d = (a: Vec2, b: Vec2, c: Vec2) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9;
}
function simple(p: readonly Vec2[]): boolean {
  const n = p.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segmentsCross(p[i], p[(i + 1) % n], p[j], p[(j + 1) % n])) return false;
    }
  return true;
}

/** Moves the corners of `big` that lie in `small` onto one edge of `small`; null when no edge gives a clean result. */
export function trimOver(big: readonly Vec2[], small: readonly Vec2[]): Vec2[] | null {
  const before = overlapArea(big, small);
  if (before < 0.05) return null;
  const cs: Vec2 = [small.reduce((s, p) => s + p[0], 0) / small.length, small.reduce((s, p) => s + p[1], 0) / small.length];
  let best: { pts: Vec2[]; lost: number } | null = null;
  for (let i = 0; i < small.length; i++) {
    const a = small[i], b = small[(i + 1) % small.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.3) continue;
    const u: Vec2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    // normal towards the small room
    let n: Vec2 = [-u[1], u[0]];
    if ((cs[0] - a[0]) * n[0] + (cs[1] - a[1]) * n[1] < 0) n = [-n[0], -n[1]];
    let moved = 0;
    const pts = big.map((q) => {
      const d = (q[0] - a[0]) * n[0] + (q[1] - a[1]) * n[1];
      if (d <= 0.005) return [q[0], q[1]] as Vec2;
      moved++;
      return [q[0] - n[0] * d, q[1] - n[1] * d] as Vec2;
    });
    if (!moved || !simple(pts) || area(pts) < 0.5) continue;
    if (overlapArea(pts, small) > Math.min(0.05, before * 0.1)) continue;
    const lost = area(big) - area(pts);
    if (lost > before * 1.25 + 0.1) continue; // it would cut away more than the overlap
    if (!best || lost < best.lost) best = { pts, lost };
  }
  return best?.pts ?? null;
}

/** Repairs spikes and rooms drawn over each other on a floor; the number of repairs and the new rooms. */
export function fixOverlaps(rooms: readonly Room[]): { rooms: Room[]; fixed: number } {
  let fixed = 0;
  const out = rooms.map((r) => ({ ...r }));
  for (let i = 0; i < out.length; i++)
    for (let j = 0; j < out.length; j++) {
      if (i === j) continue;
      const A = out[i].points as Vec2[], B = out[j].points as Vec2[];
      // A is the bigger room that reaches over B
      if (area(A) < area(B)) continue;
      const ov = overlapArea(A, B);
      if (ov < 0.05 || ov < area(B) * 0.3) continue;
      const pts = trimOver(A, B);
      if (pts) {
        out[i] = { ...out[i], points: pts };
        fixed++;
      }
    }
  return { rooms: out, fixed };
}
