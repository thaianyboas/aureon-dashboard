import assert from "node:assert/strict";
import { test } from "node:test";
import { gardenLayout, pickSky, SKIES, skyTurn, type OutdoorFrame } from "./aureon-outdoor.ts";

test("the sky follows the time of day", () => {
  assert.equal(pickSky(40, 180, { cloud: 0.1 }).key, "clear");
  assert.equal(pickSky(40, 180, { cloud: 0.4 }).key, "day");
  assert.equal(pickSky(4, 100, { cloud: 0.3 }).key, "dawn");
  assert.equal(pickSky(4, 260, { cloud: 0.3 }).key, "sunset");
  assert.equal(pickSky(-5, 270, { cloud: 0.3 }).key, "dusk");
  assert.equal(pickSky(-20, 0, { cloud: 0 }).key, "night");
  assert.equal(pickSky(null, 0, null).key, "day");
});

test("weather picks overcast, mist and dims the light; clouds hide the stars", () => {
  assert.equal(pickSky(30, 180, { cloud: 0.9 }).key, "overcast");
  const rain = pickSky(30, 180, { cloud: 0.5, rain: 0.8 });
  assert.equal(rain.key, "overcast");
  assert.ok(rain.light < 1);
  assert.equal(pickSky(30, 180, { cloud: 0.3, fog: 0.6 }).key, "mist");
  assert.equal(pickSky(-20, 0, { cloud: 0 }).stars, 1);
  assert.ok(pickSky(-20, 0, { cloud: 0.9 }).stars < 0.2);
});

test("the photo turns so that its sun stands at the real sun", () => {
  for (const dir of [0, 90, 200, 350]) {
    const turn = skyTurn("day", dir);
    const u = (((dir / 360 + 0.5 + turn) % 1) + 1) % 1;
    assert.ok(Math.abs(u - SKIES.day.sunU) < 1e-9);
  }
});

const frame = (o: Partial<OutdoorFrame> = {}): OutdoorFrame => ({ x0: 0, x1: 10, z0: 0, z1: 6, floorY: 0, groundY: -0.2, entrance: null, viewTheta: -0.6, garden: true, ...o });

test("shrubs line the base and leave the entrance free", () => {
  const all = gardenLayout(frame()).shrubs;
  assert.ok(all.length > 30);
  for (const [x, z] of all) assert.ok(x < -0.5 || x > 10.5 || z < -0.5 || z > 6.5);
  const gap = gardenLayout(frame({ entrance: [5, 6] })).shrubs;
  assert.ok(gap.length < all.length);
  assert.ok(gap.every(([x, z]) => Math.hypot(x - 5, z - 6) >= 1.4));
});

test("trees stand away from the start view", () => {
  const { trees } = gardenLayout(frame());
  assert.ok(trees.length >= 3);
  const cx = 5, cz = 3;
  for (const [x, z] of trees) {
    const a = Math.atan2(x - cx, z - cz);
    const d = Math.abs(Math.atan2(Math.sin(a + 0.6), Math.cos(a + 0.6)));
    assert.ok(d >= 1.1);
    assert.ok(Math.hypot(x - cx, z - cz) > 7);
  }
});
