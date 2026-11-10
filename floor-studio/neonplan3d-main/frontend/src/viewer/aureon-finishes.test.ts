import assert from "node:assert/strict";
import { test } from "node:test";
import { MeshStandardMaterial } from "three";
import { AUREON_FINISH_IDS, buildFinishes, ceilingMesh, innerFaces } from "./aureon-finishes.ts";

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

test("wall paint: a smooth matt finish with the room's colour, only valid colours", async () => {
  const { FINISHES: F } = await import("./aureon-finishes.ts");
  const { AUREON_WALL_PAINTS, paintColor } = await import("../aureon-paints.ts");
  assert.ok(F.paint, "paint finish exists");
  assert.ok(F.paint.roughness >= 0.8, "matt");
  assert.equal(paintColor("#F4F3EF"), "#f4f3ef");
  for (const bad of ["red", "#fff", "#12345g", null, 3, "url(x)"]) assert.equal(paintColor(bad), null);
  assert.equal(AUREON_WALL_PAINTS[0].id, "pure_white");
  assert.ok(AUREON_WALL_PAINTS.every((p) => paintColor(p.color) === p.color));
});

test("wall paint: a single wall gets its own colour, the others keep the room colour", async () => {
  const { buildFinishes } = await import("./aureon-finishes.ts");
  const { spliceWallPaints, wallPaints } = await import("../aureon-paints.ts");
  const room = {
    id: "r",
    points: [[0, 0], [4, 0], [4, 3], [0, 3]] as [number, number][],
    aureon_finish: { walls: { material: "paint", color: "#f4f3ef" }, wall_paints: [null, "#c5cdb9", null, null] as (string | null)[] },
  };
  assert.deepEqual(wallPaints(room.aureon_finish, 4), [null, "#c5cdb9", null, null]);
  assert.deepEqual(wallPaints({ wall_paints: ["bad"] }, 2), [null, null]);
  if (typeof document !== "undefined") {
    const g = buildFinishes({ height: 2.6, rooms: [room], openings: [] }, 0.12);
    assert.equal(g.children.length, 2);
  }
  // splitting wall 1 keeps the colour on both halves; removing a corner drops its wall
  spliceWallPaints(room, 2, 0, ["#c5cdb9"]);
  assert.deepEqual(room.aureon_finish.wall_paints, [null, "#c5cdb9", "#c5cdb9", null, null]);
  spliceWallPaints(room, 1, 1, []);
  assert.deepEqual(room.aureon_finish.wall_paints, [null, "#c5cdb9", null, null]);
});

test("bathroom tiles: white tiles with a navy band at mid height, the band once per wall height", async () => {
  const { FINISHES: F, TILE_BAND } = await import("./aureon-finishes.ts");
  assert.ok(F.white_tiles_navy_band && F.white_tiles_wall && F.white_tiles_floor);
  assert.equal(F.white_tiles_navy_band.period[1], TILE_BAND.repeat);
  assert.ok(TILE_BAND.repeat >= 2.3, "no second band below a normal ceiling");
  assert.ok(TILE_BAND.bottom > 0.9 && TILE_BAND.top < 1.5 && TILE_BAND.top > TILE_BAND.bottom);
  assert.ok(F.white_tiles_navy_band.period[1] * F.white_tiles_navy_band.ppm <= 1024);
});

test("a painted ceiling is drawn at ceiling height, facing down only", () => {
  const pts: [number, number][] = [[0, 0], [4, 0], [4, 3], [0, 3]];
  for (const order of [pts, [...pts].reverse()]) {
    const mesh = ceilingMesh(order, 2.596, new MeshStandardMaterial());
    const pos = mesh.geometry.attributes.position.array as Float32Array, nor = mesh.geometry.attributes.normal.array as Float32Array;
    assert.equal(pos.length, 18);
    for (let i = 1; i < pos.length; i += 3) assert.ok(Math.abs(pos[i] - 2.596) < 1e-6);
    for (let i = 1; i < nor.length; i += 3) assert.equal(nor[i], -1);
    // each triangle winds so that its geometric normal points down (-y), whatever the room's point order
    for (let t = 0; t < pos.length; t += 9) {
      const ax = pos[t + 3] - pos[t], az = pos[t + 5] - pos[t + 2], bx = pos[t + 6] - pos[t], bz = pos[t + 8] - pos[t + 2];
      assert.ok(az * bx - ax * bz < 0);
    }
  }
});
