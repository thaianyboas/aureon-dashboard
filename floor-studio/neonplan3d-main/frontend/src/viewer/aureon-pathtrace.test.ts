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
