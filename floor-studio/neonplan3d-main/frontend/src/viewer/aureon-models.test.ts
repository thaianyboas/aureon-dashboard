import assert from "node:assert/strict";
import { test } from "node:test";
import { aureonModelUrl, parseGlb } from "./aureon-models.ts";

/** A synthetic .glb: a 2 x 1 x 0.5 m box-ish quad pair under a translated node, with one material. */
function makeGlb(opts: { external?: boolean; translate?: number[] } = {}): ArrayBuffer {
  const pos = new Float32Array([-1, 0, -0.25, 1, 0, -0.25, 1, 1, 0.25, -1, 1, 0.25]);
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const bin = new Uint8Array(pos.byteLength + idx.byteLength);
  bin.set(new Uint8Array(pos.buffer), 0);
  bin.set(new Uint8Array(idx.buffer), pos.byteLength);
  const json = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, translation: opts.translate ?? [0, 0, 0] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.5, 0.25, 1, 1], metallicFactor: 0, roughnessFactor: 0.7 }, doubleSided: true }],
    buffers: [{ byteLength: bin.byteLength, ...(opts.external ? { uri: "x.bin" } : {}) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.byteLength },
      { buffer: 0, byteOffset: pos.byteLength, byteLength: idx.byteLength },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: "VEC3" },
      { bufferView: 1, componentType: 5123, count: 6, type: "SCALAR" },
    ],
  };
  let text = new TextEncoder().encode(JSON.stringify(json));
  const pad = (n: number) => (4 - (n % 4)) % 4;
  const jsonChunk = new Uint8Array(text.length + pad(text.length)).fill(0x20);
  jsonChunk.set(text);
  const binChunk = new Uint8Array(bin.length + pad(bin.length));
  binChunk.set(bin);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonChunk.length, true);
  dv.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(out, 20, jsonChunk.length).set(jsonChunk);
  const o = 20 + jsonChunk.length;
  dv.setUint32(o, binChunk.length, true);
  dv.setUint32(o + 4, 0x004e4942, true);
  new Uint8Array(out, o + 8, binChunk.length).set(binChunk);
  text = new Uint8Array();
  return out;
}

test("own furniture models: only same-origin .glb paths are accepted", () => {
  assert.equal(aureonModelUrl({ aureon_model: { url: "/local/aureon-moveis/abc/sofa.glb" } }), "/local/aureon-moveis/abc/sofa.glb");
  for (const url of ["https://example.com/a.glb", "//evil/a.glb", "/local/a.glb?token=1", "/local/../a.glb", "data:model/gltf-binary;base64,AA", "/local/a.obj", ""]) assert.equal(aureonModelUrl({ aureon_model: { url } }), null, url);
  assert.equal(aureonModelUrl({}), null);
});

test("own furniture models: a .glb is read in metres with node transforms, merged per material", async () => {
  const model = await parseGlb(makeGlb({ translate: [0, 0.5, 0] }), async () => null);
  assert.equal(model.parts.length, 1);
  assert.equal(model.triangles, 2);
  assert.deepEqual([model.size.x, model.size.y, model.size.z].map((v) => +v.toFixed(3)), [2, 1, 0.5]);
  assert.equal(+model.min.y.toFixed(3), 0.5);
  const m = model.parts[0].material;
  assert.equal(+m.roughness.toFixed(2), 0.7);
  assert.equal(m.metalness, 0);
  assert.ok(model.parts[0].geometry.getAttribute("normal"), "normals are computed when the file has none");
});

test("own furniture models: external buffers and non-glb data are rejected", async () => {
  await assert.rejects(parseGlb(makeGlb({ external: true }), async () => null), /external/);
  await assert.rejects(parseGlb(new ArrayBuffer(32), async () => null), /glTF/);
});
