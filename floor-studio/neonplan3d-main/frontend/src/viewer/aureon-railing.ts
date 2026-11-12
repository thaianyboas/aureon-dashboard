/**
 * AUREON extension (owner 2026-11-12: "o meu balkon é assim … aquela parte do metal"): a real metal railing for
 * balconies – anthracite posts, a closed panel along the slab edge, vertical bars and a flat handrail – instead of
 * only thin lines. It stands on every balcony edge that is not against a wall of the house.
 */
import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial } from "three";

type Vec2 = [number, number];

export interface RailingSpec {
  /** Top of the balcony slab (floor coordinates). */
  y0: number;
  /** Height of the railing above the slab (m). */
  height: number;
  /** How far the closed panel reaches below the slab top (covers the slab edge). */
  below?: number;
  /** Height of the closed panel above the slab (m). */
  panel?: number;
}

/** The metal of the railing (shared by all balconies). */
let metal: MeshStandardMaterial | null = null;
function railingMaterial(): MeshStandardMaterial {
  metal ??= new MeshStandardMaterial({ color: 0x3b3c3f, metalness: 0.45, roughness: 0.5 });
  return metal;
}

/** One straight railing run from a to b. Boxes are written into pos/nor (two triangles per face). */
function run(a: Vec2, b: Vec2, spec: RailingSpec, pos: number[], nor: number[]): void {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  if (L < 0.15) return;
  const u: Vec2 = [dx / L, dz / L], n: Vec2 = [-u[1], u[0]];
  const y0 = spec.y0, H = spec.height, low = y0 - (spec.below ?? 0.16), panelTop = y0 + (spec.panel ?? 0.3);
  // a box along the run: s along, y up, c across (centred on the edge line)
  const box = (s0: number, s1: number, ya: number, yb: number, c0: number, c1: number) => {
    const P = (s: number, y: number, c: number) => [a[0] + u[0] * s + n[0] * c, y, a[1] + u[1] * s + n[1] * c];
    const v = [P(s0, ya, c0), P(s1, ya, c0), P(s1, ya, c1), P(s0, ya, c1), P(s0, yb, c0), P(s1, yb, c0), P(s1, yb, c1), P(s0, yb, c1)];
    const faces: [number[], number[]][] = [
      [[0, 1, 5, 4], [-n[0], 0, -n[1]]],
      [[2, 3, 7, 6], [n[0], 0, n[1]]],
      [[3, 0, 4, 7], [-u[0], 0, -u[1]]],
      [[1, 2, 6, 5], [u[0], 0, u[1]]],
      [[4, 5, 6, 7], [0, 1, 0]],
      [[3, 2, 1, 0], [0, -1, 0]],
    ];
    for (const [q, nn] of faces) {
      for (const k of [0, 1, 2, 0, 2, 3]) {
        pos.push(...v[q[k]]);
        nor.push(...nn);
      }
    }
  };
  // posts at both ends and every 1.3 m at most
  const spans = Math.max(1, Math.ceil(L / 1.3));
  const postW = 0.05;
  for (let i = 0; i <= spans; i++) {
    const s = Math.min(L - postW / 2, Math.max(postW / 2, (L * i) / spans));
    box(s - postW / 2, s + postW / 2, low, y0 + H, -postW / 2, postW / 2);
  }
  // the closed panel along the slab edge, a rail on top of it and the flat handrail
  box(0, L, low, panelTop, -0.012, 0.012);
  box(0, L, panelTop, panelTop + 0.03, -0.02, 0.02);
  box(-0.02, L + 0.02, y0 + H - 0.03, y0 + H, -0.035, 0.035);
  // vertical bars between the panel and the handrail, about 11 cm apart
  for (let i = 0; i < spans; i++) {
    const s0 = (L * i) / spans + postW / 2, s1 = (L * (i + 1)) / spans - postW / 2;
    const count = Math.max(1, Math.round((s1 - s0) / 0.11));
    for (let k = 1; k < count; k++) {
      const s = s0 + ((s1 - s0) * k) / count;
      box(s - 0.008, s + 0.008, panelTop + 0.03, y0 + H - 0.03, -0.008, 0.008);
    }
  }
}

/** The railing of one balcony: a run along every edge for which `open(i)` is true; null when there is none. */
export function railingMesh(points: Vec2[], open: (edge: number) => boolean, spec: RailingSpec): Mesh | null {
  const pos: number[] = [], nor: number[] = [];
  for (let i = 0; i < points.length; i++) if (open(i)) run(points[i], points[(i + 1) % points.length], spec, pos, nor);
  if (!pos.length) return null;
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  const mesh = new Mesh(g, railingMaterial());
  mesh.name = "aureon-railing";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
