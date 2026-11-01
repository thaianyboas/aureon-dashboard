/**
 * AUREON extension: own floor and wall finishes per room (`room.aureon_finish`), drawn as thin surfaces over the
 * original floor and on the room's inner wall faces. The original `floor_material` stays untouched (2D editor, export,
 * other renderers keep working); only the 3D view adds the finish. Textures are painted in code (albedo only: the
 * lighting comes from the renderer), in world metres, so the pattern runs on through doorways.
 */
import { BufferAttribute, BufferGeometry, CanvasTexture, FrontSide, Group, Mesh, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import { triangulate } from "./geo.ts";
import { AUREON_WALL_PAINTS, paintColor } from "../aureon-paints.ts";

type Vec2 = [number, number];
export interface AureonFinishRef {
  material: string;
  /** Pattern direction in degrees (0 = along x). */
  rotation?: number | null;
  /** Paint colour ("#rrggbb") of the plain `paint` finish. */
  color?: string | null;
}
export interface AureonRoomFinish {
  floor?: AureonFinishRef | null;
  walls?: (AureonFinishRef & { edges?: number[] | null }) | null;
}
interface RoomLike {
  id: string;
  points: Vec2[];
  wall_thickness?: (number | null)[];
  wall_heights?: unknown[];
  ceiling_height?: number | null;
  aureon_finish?: AureonRoomFinish | null;
}
interface OpeningLike {
  room_id: string;
  edge: number;
  offset: number;
  width: number;
  type: string;
  sill?: number | null;
  height?: number | null;
}
interface FloorLike {
  height: number;
  rooms: RoomLike[];
  openings: OpeningLike[];
}

interface FinishDef {
  /** Size of one texture repeat in metres (u along the pattern direction, v across / up). */
  period: [number, number];
  roughness: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  /** Painted at this many pixels per metre (capped). */
  ppm: number;
}

/** Deterministic pseudo random numbers (the same plan always looks the same). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rgb = (c: number[], k = 1) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;

/** Oak grain inside a rectangle along `horizontal` (fine lines, a few knots-free waves, soft tone). */
function oakPlank(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, horizontal: boolean, tone: number, r: () => number): void {
  const base = [176, 132, 88].map((v, i) => v * tone + [8, 4, 0][i] * (r() - 0.5));
  ctx.fillStyle = rgb(base);
  ctx.fillRect(x, y, w, h);
  const len = horizontal ? w : h, across = horizontal ? h : w;
  const lines = Math.max(4, Math.round(across / 2.2));
  for (let i = 0; i < lines; i++) {
    const a = (i + r()) / lines;
    const phase = r() * 6.28, amp = across * (0.02 + 0.05 * r()), freq = (2 + 4 * r()) / len;
    ctx.strokeStyle = rgb(base, r() < 0.5 ? 0.9 : 1.07);
    ctx.globalAlpha = 0.18 + 0.22 * r();
    ctx.lineWidth = Math.max(0.6, across * 0.012);
    ctx.beginPath();
    for (let t = 0; t <= len; t += Math.max(2, len / 60)) {
      const off = a * across + amp * Math.sin(t * freq * 6.28 + phase);
      const px = horizontal ? x + t : x + off, py = horizontal ? y + off : y + t;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export const FINISHES: Record<string, FinishDef> = {
  // plain matt wall paint, smooth (no pattern): the colour comes from the room's choice
  paint: { period: [1, 1], roughness: 0.9, ppm: 4, draw: (ctx, W, H) => { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H); } },
  // herringbone, planks 9 x 54 cm (ratio 1:6), warm natural oak, fine joints; drawn axis-aligned and turned 45°
  oak_herringbone: {
    period: [1.08, 1.08],
    roughness: 0.55,
    ppm: 900,
    draw(ctx, W) {
      const n = 6, cell = W / (2 * n), r = rng(7);
      const plank = (cx: number, cy: number, w: number, h: number, horizontal: boolean) => {
        for (const dx of [-W, 0, W]) for (const dy of [-W, 0, W]) {
          const x = cx * cell + dx, y = cy * cell + dy;
          if (x > W || y > W || x + w * cell < 0 || y + h * cell < 0) continue;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w * cell, h * cell);
          ctx.clip();
          oakPlank(ctx, x, y, w * cell, h * cell, horizontal, 0.9 + 0.16 * r(), rng(Math.round(cx * 31 + cy * 17 + 3)));
          ctx.restore();
          ctx.strokeStyle = "rgba(70,48,28,0.55)";
          ctx.lineWidth = Math.max(1, cell * 0.025);
          ctx.strokeRect(x, y, w * cell, h * cell);
        }
      };
      // pairs k: a horizontal plank n x 1 at (k, k) and a vertical one 1 x n at (k, k+1); strips repeat every 2n
      for (let m = -1; m <= 1; m++) for (let k = -2 * n; k < 4 * n; k++) {
        const x = (((k + 2 * n * m) % (2 * n)) + 2 * n) % (2 * n), y = ((k % (2 * n)) + 2 * n) % (2 * n);
        plank(x, y, n, 1, true);
        plank(x, y + 1, 1, n, false);
      }
    },
  },
  // straight planks 18 cm wide, 1.8 m long, staggered joints
  oak_planks: {
    period: [1.8, 1.08],
    roughness: 0.55,
    ppm: 560,
    draw(ctx, W, H) {
      const rows = 6, rh = H / rows, r = rng(11);
      for (let i = 0; i < rows; i++) {
        const joint = ((i * 0.37 + 0.13) % 1) * W;
        for (const [x0, x1] of [[joint - W, joint], [joint, joint + W]]) {
          const a = Math.max(0, x0), b = Math.min(W, x1);
          if (b <= a) continue;
          oakPlank(ctx, a, i * rh, b - a, rh, true, 0.9 + 0.16 * r(), rng(i * 13 + (x0 < 0 ? 1 : 2)));
        }
        ctx.fillStyle = "rgba(70,48,28,0.55)";
        ctx.fillRect(0, i * rh, W, Math.max(1, rh * 0.012));
        ctx.fillRect(joint - 1, i * rh, 2, rh);
      }
    },
  },
  // white tiles, 30 x 60 cm on walls / 60 x 60 cm on floors (approximate), very light grey joints, faint veins
  white_tiles_wall: { period: [0.6, 1.2], roughness: 0.22, ppm: 600, draw: (ctx, W, H) => whiteTiles(ctx, W, H, 2, 2, 21) },
  white_tiles_floor: { period: [1.2, 1.2], roughness: 0.25, ppm: 500, draw: (ctx, W, H) => whiteTiles(ctx, W, H, 2, 2, 5) },
  // click deck tiles (30 x 30 cm), 6 parallel slats, black plastic base in the gaps
  deck_tiles: {
    period: [0.6, 0.6],
    roughness: 0.7,
    ppm: 900,
    draw(ctx, W) {
      ctx.fillStyle = "#151515";
      ctx.fillRect(0, 0, W, W);
      const t = W / 2, r = rng(23), edge = t * 0.012, gap = t * 0.022, sw = (t - 2 * edge - 5 * gap) / 6;
      for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) for (let s = 0; s < 6; s++) {
        const x = tx * t + edge + s * (sw + gap), y = ty * t + edge;
        oakPlank(ctx, x, y, sw, t - 2 * edge, false, 0.78 + 0.12 * r(), rng(tx * 97 + ty * 41 + s * 7));
        ctx.fillStyle = "rgba(150,80,30,0.18)";
        ctx.fillRect(x, y, sw, t - 2 * edge);
      }
    },
  },
  // light brick: beige, sand, light terracotta; 24 x 7.1 cm, 1 cm light grey mortar, running bond
  light_brick: {
    period: [0.5, 0.162],
    roughness: 0.9,
    ppm: 900,
    draw(ctx, W, H) {
      ctx.fillStyle = "#c9c4ba";
      ctx.fillRect(0, 0, W, H);
      const r = rng(31), rows = 2, rh = H / rows, mortar = W * 0.02, bw = W / 2;
      const palette = [[214, 186, 152], [222, 199, 166], [205, 168, 132], [226, 205, 178], [210, 176, 142], [218, 180, 146]];
      for (let i = 0; i < rows; i++) {
        const shift = i % 2 ? bw / 2 : 0;
        for (let j = -1; j < 3; j++) {
          const x = j * bw + shift + mortar / 2, y = i * rh + mortar / 2, w = bw - mortar, h = rh - mortar;
          const c = palette[Math.floor(r() * palette.length)], k = 0.94 + 0.1 * r();
          ctx.fillStyle = rgb(c, k);
          ctx.fillRect(x, y, w, h);
          for (let s = 0; s < 40; s++) {
            ctx.fillStyle = rgb(c, 0.86 + 0.24 * r());
            ctx.globalAlpha = 0.25;
            ctx.fillRect(x + r() * w, y + r() * h, 1 + 2 * r(), 1 + 2 * r());
          }
          ctx.globalAlpha = 1;
        }
      }
    },
  },
};

function whiteTiles(ctx: CanvasRenderingContext2D, W: number, H: number, cols: number, rows: number, seed: number): void {
  const r = rng(seed), tw = W / cols, th = H / rows;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = j * tw, y = i * th;
    ctx.fillStyle = rgb([243, 242, 239], 0.985 + 0.02 * r());
    ctx.fillRect(x, y, tw, th);
    for (let v = 0; v < 3; v++) {
      ctx.strokeStyle = "rgba(170,170,172,0.22)";
      ctx.lineWidth = 0.8 + r();
      ctx.beginPath();
      let px = x + r() * tw, py = y;
      ctx.moveTo(px, py);
      while (py < y + th) {
        px += (r() - 0.5) * tw * 0.18;
        py += th * 0.08;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#d9dadb";
  const g = Math.max(1, W * 0.004);
  for (let j = 0; j <= cols; j++) ctx.fillRect(j * tw - g / 2, 0, g, H);
  for (let i = 0; i <= rows; i++) ctx.fillRect(0, i * th - g / 2, W, g);
}

const textures = new Map<string, CanvasTexture>();
const materials = new Map<string, MeshStandardMaterial>();
function material(id: string, floor: boolean, color: string | null = null): MeshStandardMaterial | null {
  const def = FINISHES[id];
  if (!def || typeof document === "undefined") return null;
  const key = id === "paint" ? `paint|${color ?? AUREON_WALL_PAINTS[0].color}` : id;
  let m = materials.get(key);
  if (m) return m;
  let tex = textures.get(id);
  if (!tex) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(1024, Math.round(def.period[0] * def.ppm));
    canvas.height = Math.min(1024, Math.round(def.period[1] * def.ppm));
    def.draw(canvas.getContext("2d")!, canvas.width, canvas.height);
    tex = new CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    textures.set(id, tex);
  }
  m = new MeshStandardMaterial({ map: tex, roughness: def.roughness, metalness: 0, side: FrontSide, polygonOffset: true, polygonOffsetFactor: floor ? -2 : -1, polygonOffsetUnits: floor ? -4 : -2 });
  if (id === "paint") {
    m.color.set(color ?? AUREON_WALL_PAINTS[0].color);
    m.name = "paint";
  }
  materials.set(key, m);
  return m;
}

/** The finish ids a plan may use (unknown ids are ignored and the original look stays). */
export const AUREON_FINISH_IDS = Object.keys(FINISHES);

const signedArea = (p: Vec2[]) => p.reduce((a, [x, z], i) => a + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * z, 0) / 2;
const sub = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
const len = (a: Vec2) => Math.hypot(a[0], a[1]);

/** Inner face of every edge: exterior edges are already the inner face; interior ones (shared) are wall centrelines. */
export function innerFaces(room: RoomLike, rooms: RoomLike[], interior: number): { a: Vec2; b: Vec2; inward: Vec2; offset: number }[] {
  const p = room.points, n = p.length, ccw = signedArea(p) > 0;
  const lines = p.map((a, i) => {
    const b = p[(i + 1) % n], d = sub(b, a), l = len(d) || 1, u: Vec2 = [d[0] / l, d[1] / l];
    // inward normal: left of the edge for a counter-clockwise polygon (x right, z down here: sign by area)
    const inward: Vec2 = ccw ? [-u[1], u[0]] : [u[1], -u[0]];
    let shared = false, thick = room.wall_thickness?.[i] ?? null;
    for (const other of rooms) {
      if (other === room) continue;
      other.points.forEach((c, j) => {
        const e = other.points[(j + 1) % other.points.length];
        const dist = (q: Vec2) => Math.abs((q[0] - a[0]) * u[1] - (q[1] - a[1]) * u[0]);
        if (dist(c) > 0.02 || dist(e) > 0.02) return;
        const s = (q: Vec2) => (q[0] - a[0]) * u[0] + (q[1] - a[1]) * u[1];
        const lo = Math.max(0, Math.min(s(c), s(e))), hi = Math.min(l, Math.max(s(c), s(e)));
        if (hi - lo > 0.05) {
          shared = true;
          const t = other.wall_thickness?.[j];
          if (typeof t === "number") thick = Math.max(thick ?? 0, t);
        }
      });
    }
    const offset = shared ? (thick ?? interior) / 2 : 0;
    return { a, u, inward, offset: offset + 0.003 };
  });
  // corners: intersect neighbouring offset lines (falls back to the plain offset point when nearly parallel)
  const corner = (i: number): Vec2 => {
    const L1 = lines[(i - 1 + n) % n], L2 = lines[i];
    const p1: Vec2 = [L1.a[0] + L1.inward[0] * L1.offset, L1.a[1] + L1.inward[1] * L1.offset];
    const p2: Vec2 = [L2.a[0] + L2.inward[0] * L2.offset, L2.a[1] + L2.inward[1] * L2.offset];
    const den = L1.u[0] * L2.u[1] - L1.u[1] * L2.u[0];
    if (Math.abs(den) < 1e-6) return p2;
    const t = ((p2[0] - p1[0]) * L2.u[1] - (p2[1] - p1[1]) * L2.u[0]) / den;
    return [p1[0] + L1.u[0] * t, p1[1] + L1.u[1] * t];
  };
  return lines.map((L, i) => ({ a: corner(i), b: corner((i + 1) % n), inward: L.inward, offset: L.offset }));
}

/** Builds the finish surfaces of a floor (empty group when no room has a known finish). */
export function buildFinishes(floor: FloorLike, interior: number): Group {
  const group = new Group();
  group.name = "aureon-finishes";
  for (const room of floor.rooms) {
    const f = room.aureon_finish;
    if (!f) continue;
    if (f.floor && FINISHES[f.floor.material]) {
      const mat = material(f.floor.material, true);
      if (mat) group.add(floorMesh(room.points, f.floor, mat));
    }
    if (f.walls && FINISHES[f.walls.material]) {
      const mat = material(f.walls.material, false, paintColor(f.walls.color));
      if (mat) {
        const g = wallMesh(room, floor, f.walls, interior, mat);
        if (g) group.add(g);
      }
    }
  }
  return group;
}

function uvOf(x: number, z: number, ref: AureonFinishRef): [number, number] {
  const def = FINISHES[ref.material], a = ((ref.rotation ?? 0) * Math.PI) / 180;
  const u = x * Math.cos(a) + z * Math.sin(a), v = -x * Math.sin(a) + z * Math.cos(a);
  return [u / def.period[0], v / def.period[1]];
}

function floorMesh(points: Vec2[], ref: AureonFinishRef, mat: MeshStandardMaterial): Mesh {
  const tris = triangulate(points);
  const pos: number[] = [], uv: number[] = [], nor: number[] = [];
  // herringbone is drawn axis-aligned: its zig-zag runs along the room at 45° to the planks
  const r = ref.material === "oak_herringbone" ? { ...ref, rotation: (ref.rotation ?? 0) + 45 } : ref;
  for (const t of tris) {
    // three.js floors face up (+y): with x right and z down a clockwise order in (x, z) faces up
    const [i, j, k] = t;
    const P = [points[i], points[j], points[k]];
    const cross = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]);
    const order = cross < 0 ? [0, 1, 2] : [0, 2, 1];
    for (const o of order) {
      pos.push(P[o][0], 0.004, P[o][1]);
      nor.push(0, 1, 0);
      uv.push(...uvOf(P[o][0], P[o][1], r));
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  const mesh = new Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.userData.aureonModelMaterial = mat;
  return mesh;
}

function wallMesh(room: RoomLike, floor: FloorLike, ref: AureonFinishRef & { edges?: number[] | null }, interior: number, mat: MeshStandardMaterial): Mesh | null {
  const faces = innerFaces(room, floor.rooms, interior);
  const pos: number[] = [], uv: number[] = [], nor: number[] = [];
  const def = FINISHES[ref.material];
  faces.forEach((face, i) => {
    if (ref.edges && !ref.edges.includes(i)) return;
    const hRaw = room.wall_heights?.[i];
    const H = typeof hRaw === "number" ? hRaw : (room.ceiling_height ?? floor.height);
    if (!(H > 0.05)) return;
    const d = sub(face.b, face.a), L = len(d);
    if (L < 0.02) return;
    const u: Vec2 = [d[0] / L, d[1] / L];
    // openings on this wall line (of any room: a shared wall carries the neighbour's doors too)
    const cuts: { s0: number; s1: number; y0: number; y1: number }[] = [];
    for (const o of floor.openings) {
      const r = floor.rooms.find((x) => x.id === o.room_id);
      if (!r) continue;
      const p = r.points[o.edge], q = r.points[(o.edge + 1) % r.points.length];
      if (!p || !q) continue;
      const od = sub(q, p), ol = len(od) || 1, ou: Vec2 = [od[0] / ol, od[1] / ol];
      const c0: Vec2 = [p[0] + ou[0] * (o.offset - o.width / 2), p[1] + ou[1] * (o.offset - o.width / 2)];
      const c1: Vec2 = [p[0] + ou[0] * (o.offset + o.width / 2), p[1] + ou[1] * (o.offset + o.width / 2)];
      const dist = (c: Vec2) => Math.abs((c[0] - face.a[0]) * u[1] - (c[1] - face.a[1]) * u[0]);
      if (dist(c0) > face.offset + 0.3 || dist(c1) > face.offset + 0.3) continue;
      const s = (c: Vec2) => (c[0] - face.a[0]) * u[0] + (c[1] - face.a[1]) * u[1];
      const s0 = Math.max(0, Math.min(s(c0), s(c1))), s1 = Math.min(L, Math.max(s(c0), s(c1)));
      if (s1 - s0 < 0.02) continue;
      const y0 = o.type === "door" ? 0 : Math.max(0, o.sill ?? 0.9), y1 = Math.min(H, y0 + (o.height ?? (o.type === "door" ? 2.05 : 1.3)));
      cuts.push({ s0, s1, y0, y1 });
    }
    // split the face into rectangles around the openings
    const xs = [...new Set([0, L, ...cuts.flatMap((c) => [c.s0, c.s1])])].sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k++) {
      const a = xs[k], b = xs[k + 1];
      if (b - a < 0.005) continue;
      const mid = (a + b) / 2;
      const holes = cuts.filter((c) => c.s0 <= mid && mid <= c.s1).sort((x, y) => x.y0 - y.y0);
      let y = 0;
      const spans: [number, number][] = [];
      for (const h of holes) {
        if (h.y0 > y + 0.005) spans.push([y, h.y0]);
        y = Math.max(y, h.y1);
      }
      if (H > y + 0.005) spans.push([y, H]);
      for (const [y0, y1] of spans) {
        const P = (s: number, yy: number) => [face.a[0] + u[0] * s, yy, face.a[1] + u[1] * s];
        const corners = [P(a, y0), P(b, y0), P(b, y1), P(a, y1)];
        const U = (s: number) => (face.a[0] * u[0] + face.a[1] * u[1] + s) / def.period[0];
        const uvs = [[U(a), y0 / def.period[1]], [U(b), y0 / def.period[1]], [U(b), y1 / def.period[1]], [U(a), y1 / def.period[1]]];
        // facing into the room: wind so the normal points along `inward`
        const e1 = [corners[1][0] - corners[0][0], 0, corners[1][2] - corners[0][2]];
        const nrm = [-e1[2], 0, e1[0]];
        const flip = nrm[0] * face.inward[0] + nrm[2] * face.inward[1] < 0;
        const tri = flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
        for (const t of tri) {
          pos.push(...corners[t]);
          nor.push(face.inward[0], 0, face.inward[1]);
          uv.push(...uvs[t]);
        }
      }
    }
  });
  if (!pos.length) return null;
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  const mesh = new Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.userData.aureonModelMaterial = mat;
  return mesh;
}
