import { test } from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera, Scene, Sprite } from "three";
import { cameraSignature, sceneSignature, traceable, TRACE_IDLE_MS, TRACE_SAMPLES } from "./aureon-pathtrace.ts";
import { AUREON_THREE_LEND } from "./aureon-three-lend.ts";

test("only solid lit surfaces are path traced", () => {
  assert.equal(traceable(new Mesh(new BoxGeometry(), new MeshStandardMaterial())), true);
  assert.equal(traceable(new Mesh(new BoxGeometry(), new MeshPhysicalMaterial())), true);
  // glows, window spill and helpers keep their unlit material: they stay out of the photo
  assert.equal(traceable(new Mesh(new BoxGeometry(), new MeshBasicMaterial())), false);
  assert.equal(traceable(new Mesh(new BoxGeometry(), [new MeshStandardMaterial(), new MeshBasicMaterial()])), false);
  const hidden = new MeshStandardMaterial();
  hidden.visible = false;
  assert.equal(traceable(new Mesh(new BoxGeometry(), hidden)), false);
  // contact shadow planes are painted shadows; the tracer finds real ones
  const contact = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  contact.userData.aureonContact = true;
  assert.equal(traceable(contact), false);
  assert.equal(traceable(new Line(undefined, new LineBasicMaterial())), false);
  assert.equal(traceable(new Sprite()), false);
});

test("the scene signature changes with solid geometry and places, not with lines or glows", () => {
  const scene = new Scene(),
    group = new Group(),
    box = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
  group.add(box);
  scene.add(group);
  scene.updateMatrixWorld(true);
  const a = sceneSignature(scene);
  scene.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
  scene.add(new Line(undefined, new LineBasicMaterial()));
  scene.updateMatrixWorld(true);
  assert.equal(sceneSignature(scene), a);
  box.position.x = 1;
  scene.updateMatrixWorld(true);
  assert.notEqual(sceneSignature(scene), a);
  const b = sceneSignature(scene);
  box.visible = false;
  assert.notEqual(sceneSignature(scene), b);
});

test("the camera signature follows place and lens", () => {
  const cam = new PerspectiveCamera(50, 1.5, 0.1, 100);
  cam.updateMatrixWorld();
  const a = cameraSignature(cam);
  cam.position.set(0, 1, 0);
  cam.updateMatrixWorld();
  assert.notEqual(cameraSignature(cam), a);
  const b = cameraSignature(cam);
  cam.fov = 40;
  cam.updateProjectionMatrix();
  assert.notEqual(cameraSignature(cam), b);
});

test("refinement waits for a resting view and stops at a finite sample count", () => {
  assert.ok(TRACE_IDLE_MS >= 300 && TRACE_IDLE_MS <= 2000);
  assert.ok(TRACE_SAMPLES >= 32 && TRACE_SAMPLES <= 512);
});

test("the lent three.js classes are real classes and constants", () => {
  for (const [name, value] of Object.entries(AUREON_THREE_LEND)) assert.notEqual(value, undefined, name);
  assert.equal(AUREON_THREE_LEND.Mesh, Mesh);
});

test("the tracer sees walls cut like the live picture (fold rules on the CPU)", async () => {
  const { foldShows, visibleGeometry } = await import("./aureon-pathtrace.ts");
  const { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, Plane, Vector3 } = await import("three");
  // bucket 2: upper part (kind 0) shows only while the bucket stands; cap at the cut (kind 3) only when cut
  assert.equal(foldShows(0 * 16 + 2, 0b100, 0, "solid"), true);
  assert.equal(foldShows(0 * 16 + 2, 0, 0, "solid"), false);
  assert.equal(foldShows(3 * 16 + 2, 0, 0, "solid"), true);
  assert.equal(foldShows(2 * 16 + 2, 0, 0b100, "solid"), false);
  assert.equal(foldShows(-1, 0, 0, "solid"), true);
  // two triangles: the lower one (kind 2) stays, the upper one (kind 0, bucket cut) goes
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 2, 0]), 3));
  g.setAttribute("fold", new BufferAttribute(new Float32Array([32, 32, 32, 0, 0, 0]), 1));
  const m = new MeshStandardMaterial();
  m.userData.fp3dFold = { masks: { standing: { value: 0 }, glass: { value: 0 } }, role: "solid" };
  const copy = visibleGeometry(new Mesh(g, m));
  assert.ok(copy);
  // non-indexed source → non-indexed copy holding only the kept triangle
  assert.equal(copy!.index, null);
  assert.equal(copy!.getAttribute("position").count, 3);
  assert.equal(copy!.getAttribute("position").getY(2), 1);
  // a model clipped at 1.5 m keeps triangles with a corner below the plane, drops those wholly above
  const box = new BufferGeometry();
  box.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 1.8, 0, 1, 1.8, 0, 0, 2.2, 0]), 3));
  const cm = new MeshStandardMaterial();
  cm.clippingPlanes = [new Plane(new Vector3(0, -1, 0), 1.5)];
  const mesh = new Mesh(box, cm);
  mesh.updateMatrixWorld();
  assert.equal(visibleGeometry(mesh)!.getAttribute("position").count, 3);
  assert.equal(visibleGeometry(new Mesh(box, new MeshStandardMaterial())), null);
});

test("multi-material meshes reach the tracer as one plain mesh per material", async () => {
  const { splitByMaterial } = await import("./aureon-pathtrace.ts");
  const { BoxGeometry, Mesh, MeshStandardMaterial } = await import("three");
  const box = new BoxGeometry(); // indexed, 6 groups, shared vertices per face
  const a = new MeshStandardMaterial({ name: "a" }), b = new MeshStandardMaterial({ name: "b" });
  box.clearGroups();
  box.addGroup(0, 18, 0);
  box.addGroup(18, 18, 1);
  const parts = splitByMaterial(new Mesh(box, [a, b]));
  assert.equal(parts.length, 2);
  assert.deepEqual(parts.map((p) => p.material.name), ["a", "b"]);
  for (const p of parts) {
    assert.equal(p.geometry.index, null);
    assert.equal(p.geometry.getAttribute("position").count, 18);
    assert.ok(p.geometry.getAttribute("uv"));
  }
  const hidden = new MeshStandardMaterial();
  hidden.visible = false;
  assert.equal(splitByMaterial(new Mesh(new BoxGeometry(), hidden)).length, 0);
});
