// AUREON: a Golden Retriever modelled as one smooth, lit body (signed distance shapes turned into meshes with surface
// nets) instead of the cartoon balls of the other pets. The parts keep the pets' rig (body, four legs with the pivot at
// the shoulder or hip, head, tail, eyes), so walking, lying down and sleeping work as for every pet.
import type * as THREE from "three";
import type { FunLib } from "./pets.ts";

type V3 = [number, number, number];
type Sdf = (x: number, y: number, z: number) => number;

/** The Golden Retriever's measurements (m): legs, body height (for lying down), the parts' pivots. */
export const GOLDEN = { leg: 0.33, hi: 0.26, len: 0.62 };

const COAT: Record<string, { main: V3; light: V3; dark: V3 }> = {
  golden: { main: [0.82, 0.58, 0.3], light: [0.92, 0.75, 0.5], dark: [0.68, 0.44, 0.2] },
  red_golden: { main: [0.75, 0.47, 0.22], light: [0.87, 0.65, 0.4], dark: [0.6, 0.35, 0.15] },
  light_golden: { main: [0.93, 0.82, 0.62], light: [0.97, 0.91, 0.77], dark: [0.85, 0.7, 0.48] },
  cream: { main: [0.94, 0.87, 0.74], light: [0.98, 0.94, 0.86], dark: [0.86, 0.76, 0.6] },
};

const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
/** A capsule from a to b whose radius runs from ra to rb. */
function cone(a: V3, b: V3, ra: number, rb: number): Sdf {
  const ba: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l2 = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2];
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const t = Math.min(1, Math.max(0, (px * ba[0] + py * ba[1] + pz * ba[2]) / l2));
    const dx = px - ba[0] * t, dy = py - ba[1] * t, dz = pz - ba[2] * t;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * t);
  };
}
/** An ellipsoid (approximate distance, good enough for blending). */
function egg(c: V3, r: V3): Sdf {
  const m = Math.min(r[0], r[1], r[2]);
  return (x, y, z) => (Math.hypot((x - c[0]) / r[0], (y - c[1]) / r[1], (z - c[2]) / r[2]) - 1) * m;
}
const blend = (k: number, ...s: Sdf[]): Sdf => (x, y, z) => s.reduce((d, f) => smin(d, f(x, y, z), k), 1e9);
/** Fine fur relief: a small, fixed ripple on the surface. */
// long strands run along the body (z) and fall downwards (y): fine across, long along
const fur = (s: Sdf, amp: number): Sdf => (x, y, z) => s(x, y, z) + amp * Math.sin(x * 260 + Math.sin(z * 40 + y * 30) * 4) * (0.6 + 0.4 * Math.sin(z * 55 + y * 70));

/** Surface nets: a smooth mesh of the surface sdf = 0 inside the box, with normals from the gradient and colours. */
function surface(lib: FunLib, sdf: Sdf, lo: V3, hi: V3, cell: number, colour: (p: V3, n: V3) => V3): THREE.BufferGeometry {
  const nx = Math.ceil((hi[0] - lo[0]) / cell) + 1, ny = Math.ceil((hi[1] - lo[1]) / cell) + 1, nz = Math.ceil((hi[2] - lo[2]) / cell) + 1;
  const v = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[at(i, j, k)] = sdf(lo[0] + i * cell, lo[1] + j * cell, lo[2] + k * cell);
  const index = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cid = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [], nor: number[] = [], col: number[] = [], tri: number[] = [];
  const corners: V3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const e = cell * 0.5;
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const d = corners.map(([a, b, c]) => v[at(i + a, j + b, k + c)]);
        let inside = 0;
        for (const x of d) if (x < 0) inside++;
        if (inside === 0 || inside === 8) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of edges) {
          if (d[a] < 0 === d[b] < 0) continue;
          const t = d[a] / (d[a] - d[b]);
          sx += corners[a][0] + (corners[b][0] - corners[a][0]) * t;
          sy += corners[a][1] + (corners[b][1] - corners[a][1]) * t;
          sz += corners[a][2] + (corners[b][2] - corners[a][2]) * t;
          n++;
        }
        const p: V3 = [lo[0] + (i + sx / n) * cell, lo[1] + (j + sy / n) * cell, lo[2] + (k + sz / n) * cell];
        const g: V3 = [sdf(p[0] + e, p[1], p[2]) - sdf(p[0] - e, p[1], p[2]), sdf(p[0], p[1] + e, p[2]) - sdf(p[0], p[1] - e, p[2]), sdf(p[0], p[1], p[2] + e) - sdf(p[0], p[1], p[2] - e)];
        const gl = Math.hypot(...g) || 1;
        const nn: V3 = [g[0] / gl, g[1] / gl, g[2] / gl];
        index[cid(i, j, k)] = pos.length / 3;
        pos.push(...p);
        nor.push(...nn);
        const c = colour(p, nn);
        col.push(c[0] ** 2.2, c[1] ** 2.2, c[2] ** 2.2); // authored in sRGB, vertex colours are linear
      }
  // a quad around every grid edge the surface crosses, wound so it faces out
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) tri.push(a, b, c, a, c, d);
    else tri.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const a = v[at(i, j, k)], b = v[at(i + 1, j, k)];
        if (a < 0 === b < 0) continue;
        quad(index[cid(i, j - 1, k - 1)], index[cid(i, j, k - 1)], index[cid(i, j, k)], index[cid(i, j - 1, k)], a < 0);
      }
  for (let k = 1; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const a = v[at(i, j, k)], b = v[at(i, j + 1, k)];
        if (a < 0 === b < 0) continue;
        quad(index[cid(i - 1, j, k - 1)], index[cid(i - 1, j, k)], index[cid(i, j, k)], index[cid(i, j, k - 1)], a < 0);
      }
  for (let k = 0; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const a = v[at(i, j, k)], b = v[at(i, j, k + 1)];
        if (a < 0 === b < 0) continue;
        quad(index[cid(i - 1, j - 1, k)], index[cid(i, j - 1, k)], index[cid(i, j, k)], index[cid(i - 1, j, k)], a < 0);
      }
  const geo = new lib.BufferGeometry();
  geo.setAttribute("position", new lib.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new lib.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new lib.Float32BufferAttribute(col, 3));
  geo.setIndex(tri);
  return geo;
}

const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** A soft, fixed streaking of the coat (darker and lighter strands). */
const strands = (p: V3) => 0.94 + 0.08 * Math.sin(p[0] * 140 + p[1] * 260 + Math.sin(p[2] * 120) * 2) * Math.sin(p[2] * 90 + p[1] * 40);

export interface GoldenModel {
  root: THREE.Group;
  body: THREE.Group;
  legs: THREE.Group[];
  tail: THREE.Group;
  head: THREE.Group;
  eyes: THREE.Group[];
}

/** Builds the Golden Retriever (about 0.6 m to the shoulder line, front towards +z) in the given coat. */
export function buildGolden(lib: FunLib & { MeshStandardMaterial: typeof THREE.MeshStandardMaterial }, fur0: string): GoldenModel {
  const coat = COAT[fur0] ?? COAT.golden;
  const mat = new lib.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const dark = new lib.MeshStandardMaterial({ color: "#151210", roughness: 0.35, metalness: 0 });
  const root = new lib.Group();
  const body = new lib.Group();
  root.add(body);
  const L = GOLDEN.leg;
  // torso: ribcage, loin and rump blended, a deep chest with a feathered front, the neck rising to the head
  const torso = fur(
    blend(
      0.06,
      egg([0, L + 0.13, 0.06], [0.125, 0.15, 0.2]),
      cone([0, L + 0.14, -0.2], [0, L + 0.15, 0.1], 0.1, 0.11),
      egg([0, L + 0.13, -0.2], [0.11, 0.115, 0.12]),
      egg([0, L + 0.06, 0.17], [0.1, 0.12, 0.09]),
      egg([0, L + 0.0, 0.05], [0.08, 0.06, 0.16]),
      cone([0, L + 0.17, 0.15], [0, L + 0.3, 0.27], 0.085, 0.065),
    ),
    0.0014,
  );
  const torsoGeo = surface(lib, torso, [-0.16, L - 0.1, -0.36], [0.16, L + 0.4, 0.36], 0.012, (p, n) => {
    // lighter under the chest and belly (the feathering), the back a touch darker
    const under = clamp01((L + 0.07 - p[1]) / 0.08) * clamp01(-n[1] + 0.3);
    const back = clamp01((p[1] - (L + 0.22)) / 0.06);
    const c = mix(mix(coat.main, coat.light, under * 0.8), coat.dark, back * 0.35);
    const s = strands(p);
    return [c[0] * s, c[1] * s, c[2] * s];
  });
  body.add(new lib.Mesh(torsoGeo, mat));
  // legs: the pivot at the shoulder or hip; front legs straight with feathering behind, hind legs with full thighs
  const legs: THREE.Group[] = [];
  for (const [x, z, front] of [
    [-0.075, 0.15, true],
    [0.075, 0.15, true],
    [-0.08, -0.22, false],
    [0.08, -0.22, false],
  ] as [number, number, boolean][]) {
    const g = new lib.Group();
    g.position.set(x, L + 0.04, z);
    const s = front
      ? blend(0.03, cone([0, 0, 0], [0, -L + 0.02, 0.01], 0.042, 0.03), egg([0, -L + 0.02, 0.03], [0.034, 0.022, 0.048]), egg([0, -0.14, -0.035], [0.026, 0.11, 0.03]))
      : blend(
          0.035,
          egg([0, -0.05, 0.005], [0.05, 0.1, 0.065]),
          cone([0, -0.13, -0.035], [0, -0.23, -0.05], 0.038, 0.03),
          cone([0, -0.23, -0.05], [0, -L + 0.02, -0.02], 0.03, 0.028),
          egg([0, -L + 0.02, 0.01], [0.034, 0.022, 0.046]),
          egg([0, -0.12, -0.06], [0.024, 0.07, 0.03]),
        );
    const geo = surface(lib, fur(s, 0.001), [-0.07, -L - 0.01, -0.13], [0.07, 0.07, 0.1], 0.009, (p) => {
      const paw = clamp01((-L + 0.06 - p[1]) / 0.04);
      const feather = clamp01((front ? -p[2] - 0.015 : -p[2] - 0.06) / 0.03);
      const c = mix(coat.main, coat.light, Math.max(paw * 0.6, feather * 0.7));
      const st = strands(p);
      return [c[0] * st, c[1] * st, c[2] * st];
    });
    g.add(new lib.Mesh(geo, mat));
    body.add(g);
    legs.push(g);
  }
  // head: broad skull, a clear stop, a straight muzzle, soft hanging ears; black nose and eyes
  const head = new lib.Group();
  head.position.set(0, L + 0.3, 0.29);
  const skull = blend(
    0.035,
    egg([0, 0.045, 0.03], [0.072, 0.068, 0.085]),
    cone([0, 0.01, 0.09], [0, 0.0, 0.19], 0.045, 0.036),
    egg([0, -0.02, 0.12], [0.05, 0.035, 0.07]),
  );
  const ears = blend(0.02, egg([-0.07, -0.015, 0.02], [0.022, 0.07, 0.05]), egg([0.07, -0.015, 0.02], [0.022, 0.07, 0.05]));
  const headSdf = fur((x, y, z) => smin(skull(x, y, z), ears(x, y, z), 0.025), 0.0008);
  const headGeo = surface(lib, headSdf, [-0.11, -0.11, -0.08], [0.11, 0.13, 0.24], 0.0065, (p) => {
    const ear = clamp01((Math.abs(p[0]) - 0.055) / 0.02) * clamp01((0.03 - p[1]) / 0.03);
    const muzzle = clamp01((p[2] - 0.12) / 0.06) * 0.35;
    const c = mix(mix(coat.main, coat.light, muzzle), coat.dark, ear * 0.75);
    const s = strands(p);
    return [c[0] * s, c[1] * s, c[2] * s];
  });
  head.add(new lib.Mesh(headGeo, mat));
  const ball = (m: THREE.Material, r: V3, at: V3) => {
    const geo = surface(lib, egg([0, 0, 0], r), [-r[0] - 0.004, -r[1] - 0.004, -r[2] - 0.004], [r[0] + 0.004, r[1] + 0.004, r[2] + 0.004], Math.min(...r) / 4, () => [0, 0, 0]);
    const mesh = new lib.Mesh(geo, m);
    mesh.position.set(...at);
    return mesh;
  };
  head.add(ball(dark, [0.022, 0.016, 0.016], [0, 0.008, 0.222]));
  const eyes: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const e = new lib.Group();
    e.position.set(side * 0.038, 0.048, 0.098);
    e.add(ball(dark, [0.011, 0.011, 0.008], [0, 0, 0]));
    head.add(e);
    eyes.push(e);
  }
  body.add(head);
  // tail: long, carried level behind, with a feathered plume underneath
  const tail = new lib.Group();
  tail.position.set(0, L + 0.17, -0.3);
  const plume = new lib.Group();
  plume.rotation.x = -0.72;
  const tailSdf = fur(blend(0.03, cone([0, 0, 0], [0, 0.32, 0], 0.03, 0.014), egg([0, 0.17, -0.03], [0.022, 0.15, 0.04])), 0.001);
  plume.add(new lib.Mesh(surface(lib, tailSdf, [-0.05, -0.04, -0.09], [0.05, 0.35, 0.05], 0.008, (p) => mix(coat.main, coat.light, clamp01((-p[2] - 0.01) / 0.04) * 0.8)), mat));
  tail.add(plume);
  body.add(tail);
  root.traverse((o) => {
    (o as THREE.Mesh).castShadow = true;
  });
  return { root, body, legs, tail, head, eyes };
}
