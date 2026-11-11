import assert from "node:assert/strict";
import { test } from "node:test";
import { fixOverlaps, overlapArea } from "./aureon-overlaps.ts";
import { generateWalls } from "./geometry/walls.ts";

test("owner plan 2026-11-11: a kitchen drawn over the balcony ends at the balcony; same corners, no overlap left", () => {
  const kitchen = { id: "k", name: "Cozinha", points: [[4.34, 7.059], [6.418, 7.059], [6.418, 12.649], [4.34, 12.649]], wall_heights: [0, 0, 0, 0] };
  const balcony = { id: "v", name: "Varanda", points: [[4.34, 12.649], [6.418, 12.649], [6.418, 11.109], [4.34, 11.109]] };
  const rooms = [kitchen, balcony] as never[];
  assert.ok(generateWalls(rooms, { exterior: 0.235, interior: 0.235 }).warnings.length > 0);
  const r = fixOverlaps(rooms);
  assert.equal(r.fixed, 1);
  const k = r.rooms[0] as unknown as typeof kitchen;
  assert.equal(k.points.length, 4);
  assert.deepEqual(k.points.map((p) => p.map((v) => Math.round(v * 1000) / 1000)), [[4.34, 7.059], [6.418, 7.059], [6.418, 11.109], [4.34, 11.109]]);
  assert.equal(k.wall_heights, kitchen.wall_heights);
  assert.ok(overlapArea(k.points as never, balcony.points as never) < 0.02);
  assert.deepEqual(generateWalls(r.rooms, { exterior: 0.235, interior: 0.235 }).warnings, []);
});

test("rooms that only touch are left alone", () => {
  const a = { id: "a", name: "A", points: [[0, 0], [4, 0], [4, 3], [0, 3]] };
  const b = { id: "b", name: "B", points: [[0, 3], [4, 3], [4, 5], [0, 5]] };
  const r = fixOverlaps([a, b] as never[]);
  assert.equal(r.fixed, 0);
  assert.deepEqual((r.rooms[0] as unknown as typeof a).points, a.points);
});
