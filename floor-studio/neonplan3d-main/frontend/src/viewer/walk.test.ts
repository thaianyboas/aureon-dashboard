import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyBuilding, newFloor, type Room, type Vec2 } from "../model.ts";
import { FloorMap, type Obstacle, WalkCamera } from "./walk.ts";

function rect(id: string, x0: number, z0: number, x1: number, z1: number): Room {
  return { id, name: id, area_id: null, points: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], floor_material: "wood" };
}

const floor = { ...newFloor("f", "EG", 0), rooms: [rect("r", 0, 0, 8, 5)] };
const building = { ...emptyBuilding(), floors: [floor] };
// a sofa across the middle of the room
const sofa: Obstacle = { c: [4, 2.5], u: [0, 1], hw: 1.2, hd: 0.45 };

/** Points along the way, every 5 cm. */
function along(start: Vec2, way: Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  let p = start;
  for (const q of way) {
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.05));
    for (let i = 1; i <= n; i++) out.push([p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]);
    p = q;
  }
  return out;
}

test("pets walk around furniture; a walk through the house (no obstacles) goes straight", () => {
  const start: Vec2 = [1, 2.5];
  const goal: Vec2 = [7, 2.5];
  const person = new FloorMap(building, floor);
  assert.deepEqual(person.path(start, goal), [goal]);
  const pet = new FloorMap(building, floor, [sofa]);
  const way = pet.path(start, goal);
  assert.ok(way && way.length > 1, "a detour");
  for (const p of along(start, way!)) assert.equal(pet.obstacleAt(p, 0), null, `${p} lies in the sofa`);
});

test("a place on the furniture is reached with a last hop, and left with a first one", () => {
  const pet = new FloorMap(building, floor, [sofa]);
  const onSofa: Vec2 = [4, 2.5];
  const there = pet.path([1, 1], onSofa);
  assert.ok(there && there.at(-1)![0] === 4 && there.at(-1)![1] === 2.5);
  const back = pet.path(onSofa, [7, 4]);
  assert.ok(back && back.length >= 2);
  assert.equal(pet.obstacleAt(back[0], 0), null, "first hop down to the floor");
});

test("an outer door upstairs leads nowhere unless a balcony is drawn behind it; downstairs it leads into the garden (#766)", () => {
  const french = { id: "fd", room_id: "r", edge: 0, offset: 4, width: 1.2, type: "window" as const, sill: 0, height: 2.2, hinge: "left" as const, leaves: 2 as const, swing: "in" as const, cover: null, contact: null, contact2: null, tilt: null };
  const up = { ...newFloor("og", "OG", 2.8), rooms: [rect("r", 0, 0, 8, 5)], openings: [french] };
  assert.equal(new FloorMap({ ...emptyBuilding(), floors: [up] }, up).doors.length, 0);
  // the room's edge 0 runs along z = 0: a balcony in front of it (z < 0)
  const withBalcony = { ...up, outdoor: [{ id: "b", type: "terrace", points: [[2, -2], [6, -2], [6, 0], [2, 0]] }] } as typeof up;
  assert.equal(new FloorMap({ ...emptyBuilding(), floors: [withBalcony] }, withBalcony).doors.length, 1);
  const down = { ...up, elevation: 0 };
  assert.equal(new FloorMap({ ...emptyBuilding(), floors: [down] }, down).doors.length, 1);
});

test("AUREON: in the editor's walk a press on furniture moves the piece, not the view; elsewhere the walk looks around", () => {
  // a fake surface and viewer: just what the walk camera touches
  const handlers = new Map<string, (e: unknown) => void>();
  const surface = {
    addEventListener: (type: string, fn: (e: unknown) => void) => handlers.set(type, fn),
    removeEventListener: () => {},
    setPointerCapture: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    clientHeight: 600,
  };
  const vec = () => ({ x: 0, y: 0, z: 0, set() {} });
  const v = {
    camera: { position: vec(), lookAt() {}, fov: 60, near: 0.1, aspect: 1, updateProjectionMatrix() {} },
    controls: { update: () => false, view: { target: vec(), radius: 1, theta: 0, phi: 0 } },
    floorMap: new Map(),
    floors: [],
    labels: { style: {} as Record<string, string> },
    renderer: { domElement: {} },
    invalidate() {},
    updateWalls() {},
  };
  const calls: string[] = [];
  const onPiece = (x: number) => x < 400;
  const g = globalThis as unknown as { window?: unknown; requestAnimationFrame?: unknown; cancelAnimationFrame?: unknown };
  const saved = [g.window, g.requestAnimationFrame, g.cancelAnimationFrame];
  g.window = { addEventListener() {}, removeEventListener() {} };
  g.requestAnimationFrame = () => 0;
  g.cancelAnimationFrame = () => {};
  try {
    const walk = new WalkCamera(v as never, new FloorMap(building, floor), surface as never, {
      onRoom: () => {},
      start: { x: 1, z: 2.5, yaw: 0, pitch: -0.05 },
      furnish: { grab: (x) => (calls.push(`grab ${x}`), onPiece(x)), drag: (x) => calls.push(`drag ${x}`), drop: () => calls.push("drop") },
    });
    const ev = (clientX: number) => ({ clientX, clientY: 300, pointerId: 1 });
    handlers.get("pointerdown")!(ev(100));
    handlers.get("pointermove")!(ev(160));
    handlers.get("pointerup")!(ev(160));
    assert.deepEqual(calls, ["grab 100", "drag 160", "drop"]);
    assert.equal(walk.state.yaw, 0, "holding a piece does not turn the view");
    calls.length = 0;
    handlers.get("pointerdown")!(ev(500));
    handlers.get("pointermove")!(ev(560));
    handlers.get("pointerup")!(ev(560));
    assert.deepEqual(calls, ["grab 500"]);
    assert.notEqual(walk.state.yaw, 0, "a drag elsewhere looks around");
    walk.dispose();
  } finally {
    [g.window, g.requestAnimationFrame, g.cancelAnimationFrame] = saved;
  }
});
