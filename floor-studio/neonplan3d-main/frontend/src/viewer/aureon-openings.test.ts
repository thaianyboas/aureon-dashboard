import assert from "node:assert/strict";
import { test } from "node:test";
import { rehostOpenings } from "./aureon-openings.ts";
import { generateWalls, locateOpening, openingHost } from "../geometry/walls.ts";

const door = (o: Record<string, unknown>) => ({ id: "d1", width: 0.9, type: "door", sill: 0, height: 2.05, hinge: "left", leaves: 1, swing: "in", lock: "lock.front", ...o }) as Record<string, unknown>;

test("owner plan 2026-11-11: a door on a 'no wall' room edge goes into the free wall standing there", () => {
  const room = { id: "r", name: "Sala", points: [[0, 0], [4, 0], [4, 3], [0, 3]], wall_heights: [0, null, null, null] } as never;
  const free = [{ id: "w1", a: [0, 0], b: [4, 0] }] as never;
  const floor = { rooms: [room], walls: free, openings: [door({ room_id: "r", edge: 0, offset: 1.5 })] };
  const out = rehostOpenings(floor as never, 0.3, 0.12) as unknown as { rooms: unknown[]; openings: { wall?: string; offset: number }[] };
  assert.equal(out.openings[0].wall, "w1");
  assert.ok(Math.abs(out.openings[0].offset - 1.5) < 1e-9);
  const walls = generateWalls(out.rooms as never, { exterior: 0.3, interior: 0.12 }, free).walls;
  assert.ok(locateOpening(walls, out.openings[0] as never, openingHost(out.openings[0] as never, out.rooms as never, free)!));
});

test("owner plan 2026-11-11: overlapping rooms put two walls on one line – both get the hole, the copy is a passage", () => {
  // two rooms 4.5 cm apart: each builds its own wall
  const a = { id: "a", name: "Sala", points: [[0, 0], [4, 0], [4, 3], [0, 3]] } as never;
  const b = { id: "b", name: "Flur", points: [[0, 3.045], [4, 3.045], [4, 5], [0, 5]] } as never;
  const floor = { rooms: [a, b], walls: [], openings: [door({ room_id: "a", edge: 2, offset: 2 })] };
  const walls = generateWalls(floor.rooms as never, { exterior: 0.3, interior: 0.12 }, []).walls;
  const out = rehostOpenings(floor as never, 0.3, 0.12) as unknown as { openings: Record<string, unknown>[] };
  assert.equal(out.openings.length, 2);
  const copy = out.openings[1];
  assert.equal(copy.style, "passage");
  assert.equal(copy.lock, undefined);
  const hit = locateOpening(walls, copy as never, openingHost(copy as never, floor.rooms as never, [])!);
  const orig = locateOpening(walls, out.openings[0] as never, openingHost(out.openings[0] as never, floor.rooms as never, [])!);
  assert.ok(hit && orig && hit.wall !== orig.wall);
});

test("a plan without doubled walls is returned unchanged", () => {
  const a = { id: "a", name: "A", points: [[0, 0], [4, 0], [4, 3], [0, 3]] } as never;
  const b = { id: "b", name: "B", points: [[0, 3], [4, 3], [4, 5], [0, 5]] } as never;
  const floor = { rooms: [a, b], walls: [], openings: [door({ room_id: "a", edge: 2, offset: 2 })] };
  assert.equal(rehostOpenings(floor as never, 0.3, 0.12), floor);
});

test("owner plan 2026-11-11: oak panels 3 mm off the wall are drawn touching it; pieces far away stay", async () => {
  const { snapThinToWalls } = await import("./aureon-openings.ts");
  const wall = { a: [0.235, 4.743] as [number, number], b: [3.805, 4.743] as [number, number], left: 0.1175, right: 0.1175 };
  const [panel, far, deep] = snapThinToWalls([{ x: 1.26, z: 4.61, rotation: 180, d: 0.025 }, { x: 1.26, z: 4.5, rotation: 180, d: 0.025 }, { x: 1.26, z: 4.3, rotation: 180, d: 0.6 }], [wall]);
  assert.ok(Math.abs(panel.z + 0.0125 - 4.6265) < 1e-6, String(panel.z)); // back 1 mm into the wall face (4.6255)
  assert.equal(far.z, 4.5);
  assert.equal(deep.z, 4.3);
});
