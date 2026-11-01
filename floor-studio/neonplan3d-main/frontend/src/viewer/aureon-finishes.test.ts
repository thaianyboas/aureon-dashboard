import assert from "node:assert/strict";
import { test } from "node:test";
import { AUREON_FINISH_IDS, buildFinishes, innerFaces } from "./aureon-finishes.ts";

const room = (id: string, x0: number, x1: number) => ({ id, points: [[x0, 0], [x1, 0], [x1, 3], [x0, 3]] as [number, number][] });

test("own finishes: shared edges are wall centrelines, outer edges are inner faces", () => {
  const a = room("a", 0, 4), b = room("b", 4, 7);
  const faces = innerFaces(a, [a, b], 0.24);
  // edge 1 (x = 4) is shared: its face lies half an interior wall inside room a
  assert.ok(Math.abs(faces[1].a[0] - (4 - 0.12 - 0.003)) < 1e-6);
  // edge 3 (x = 0) is outside: the face stays on the edge (plus the small lift against flicker)
  assert.ok(Math.abs(faces[3].a[0] - 0.003) < 1e-6);
  // inward normals point into the room
  assert.ok(faces[1].inward[0] < 0 && faces[3].inward[0] > 0);
});

test("own finishes: the catalogue holds the owner's floors and walls; unknown ids draw nothing", () => {
  for (const id of ["oak_herringbone", "oak_planks", "white_tiles_wall", "white_tiles_floor", "deck_tiles", "light_brick"]) assert.ok(AUREON_FINISH_IDS.includes(id), id);
  const g = buildFinishes({ height: 2.5, rooms: [{ ...room("a", 0, 4), aureon_finish: { floor: { material: "marble_unknown" } } }], openings: [] }, 0.24);
  assert.equal(g.children.length, 0);
});
