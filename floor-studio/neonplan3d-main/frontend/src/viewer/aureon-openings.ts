// AUREON (owner 2026-11-11: "na planta 2D vejo 2 portas, no 3D cadê as portas?"): a plan may set a room edge to
// "no wall" (height 0) and draw that wall as a free wall instead. A door or window filed under the room edge then had
// no wall to cut in 3D. Such an opening is moved, for the 3D only, onto the free wall that stands along that edge.
import { generateWalls, locateOpening, openingHost, pointOnRoomEdge } from "../geometry/walls.ts";
import type { Floor, Opening } from "../model.ts";

type Vec2 = [number, number];

export function rehostOpenings<F extends Pick<Floor, "rooms" | "openings" | "walls">>(floor: F, exterior: number, interior: number): F {
  const free = floor.walls ?? [];
  if (!floor.openings.length) return floor;
  let walls;
  try {
    walls = generateWalls(floor.rooms, { exterior, interior }, free).walls;
  } catch {
    return floor;
  }
  let changed = false;
  const openings = floor.openings.map((o): Opening => {
    if (o.wall) return o;
    const host = openingHost(o, floor.rooms, free);
    if (!host || locateOpening(walls, o, host)) return o;
    const pts = host.room.points, a = pts[host.edge], b = pts[(host.edge + 1) % pts.length];
    const el = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (el < 0.05) return o;
    const u: Vec2 = [(b[0] - a[0]) / el, (b[1] - a[1]) / el];
    const p = pointOnRoomEdge(host.room, host.edge, o.offset);
    for (const w of free) {
      const wl = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      if (wl < 0.05) continue;
      const wu: Vec2 = [(w.b[0] - w.a[0]) / wl, (w.b[1] - w.a[1]) / wl];
      if (Math.abs(u[0] * wu[1] - u[1] * wu[0]) > 0.05) continue;
      const dist = Math.abs((p[0] - w.a[0]) * wu[1] - (p[1] - w.a[1]) * wu[0]);
      if (dist > (w.thickness ?? interior) / 2 + 0.05) continue;
      const s = (p[0] - w.a[0]) * wu[0] + (p[1] - w.a[1]) * wu[1];
      if (s < -0.01 || s > wl + 0.01) continue;
      changed = true;
      return { ...o, wall: w.id, offset: Math.min(wl, Math.max(0, s)) };
    }
    return o;
  });
  // Overlapping rooms and free walls can put two walls on the same line: a door then cut only one of them and was
  // gone when seen from the other side. Every other wall through the opening gets the same hole (a door as a
  // passage without a second leaf; no sensors or locks are copied).
  const extra: Opening[] = [];
  for (const o of openings) {
    const host = openingHost(o, floor.rooms, free);
    const hit = host ? locateOpening(walls, o, host) : null;
    if (!hit) continue;
    const L = Math.hypot(hit.wall.b[0] - hit.wall.a[0], hit.wall.b[1] - hit.wall.a[1]) || 1;
    const hu: Vec2 = [(hit.wall.b[0] - hit.wall.a[0]) / L, (hit.wall.b[1] - hit.wall.a[1]) / L];
    const p: Vec2 = [hit.wall.a[0] + hu[0] * hit.s, hit.wall.a[1] + hu[1] * hit.s];
    let k = 0;
    for (const w of walls) {
      if (w === hit.wall) continue;
      const wl = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      if (wl < 0.05) continue;
      const wu: Vec2 = [(w.b[0] - w.a[0]) / wl, (w.b[1] - w.a[1]) / wl];
      if (Math.abs(hu[0] * wu[1] - hu[1] * wu[0]) > 0.05) continue;
      const side = (p[0] - w.a[0]) * wu[1] - (p[1] - w.a[1]) * wu[0];
      if (Math.abs(side) > Math.max(w.left, w.right) + Math.max(hit.wall.left, hit.wall.right) + 0.02) continue;
      const sw = (p[0] - w.a[0]) * wu[0] + (p[1] - w.a[1]) * wu[1];
      if (sw < 0.05 || sw > wl - 0.05) continue;
      const base = { id: `${o.id}~aureon${++k}`, room_id: o.room_id, width: o.width, type: o.type, sill: o.sill, height: o.height, hinge: o.hinge, leaves: o.leaves, swing: o.swing, style: o.type === "door" ? "passage" : o.style } as Opening;
      if (w.free) {
        extra.push({ ...base, edge: 0, wall: w.free, offset: sw });
        continue;
      }
      for (const src of w.sources) {
        const room = floor.rooms.find((r) => r.id === src.room_id);
        if (!room) continue;
        const ra = room.points[src.edge], rb = room.points[(src.edge + 1) % room.points.length];
        const rl = Math.hypot(rb[0] - ra[0], rb[1] - ra[1]) || 1;
        const t = ((p[0] - ra[0]) * (rb[0] - ra[0]) + (p[1] - ra[1]) * (rb[1] - ra[1])) / rl;
        if (t < src.t0 - 0.01 || t > src.t1 + 0.01) continue;
        extra.push({ ...base, room_id: room.id, edge: src.edge, wall: null, offset: t });
        break;
      }
    }
  }
  if (extra.length) return { ...floor, openings: [...openings, ...extra] };
  return changed ? { ...floor, openings } : floor;
}

/**
 * AUREON (owner 2026-11-11, slit between a wall and the oak panels): a thin piece (panel, picture, shelf board up to
 * 8 cm deep) whose back stands up to 3 cm in front of a wall is drawn touching that wall, for the 3D only.
 */
export function snapThinToWalls<T extends { x: number; z: number; rotation: number; d: number }>(items: readonly T[], walls: readonly { a: Vec2; b: Vec2; left: number; right: number }[]): T[] {
  return items.map((f) => {
    if (!(f.d > 0) || f.d > 0.08) return f;
    const r = (f.rotation * Math.PI) / 180;
    const front: Vec2 = [-Math.sin(r), Math.cos(r)];
    const back: Vec2 = [f.x - front[0] * (f.d / 2), f.z - front[1] * (f.d / 2)];
    let best = Infinity;
    for (const w of walls) {
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      if (L < 0.05) continue;
      const u: Vec2 = [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L];
      // the piece must face away from the wall line (its back towards it)
      if (Math.abs(u[0] * front[0] + u[1] * front[1]) > 0.05) continue;
      const s = (back[0] - w.a[0]) * u[0] + (back[1] - w.a[1]) * u[1];
      if (s < -0.05 || s > L + 0.05) continue;
      const n: Vec2 = [-u[1], u[0]]; // left normal
      const side = (back[0] - w.a[0]) * n[0] + (back[1] - w.a[1]) * n[1];
      const face = side >= 0 ? w.left : w.right;
      const gap = Math.abs(side) - face;
      // the wall must be behind the piece
      const towards = (side >= 0 ? -1 : 1) * (n[0] * -front[0] + n[1] * -front[1]);
      if (towards <= 0.9 || gap <= 0.0005 || gap > 0.03) continue;
      best = Math.min(best, gap);
    }
    if (!Number.isFinite(best)) return f;
    const move = best + 0.001; // 1 mm into the wall: no slit left
    return { ...f, x: f.x - front[0] * move, z: f.z - front[1] * move };
  });
}
