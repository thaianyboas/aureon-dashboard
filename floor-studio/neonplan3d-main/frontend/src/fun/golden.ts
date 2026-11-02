// AUREON: the Golden Retriever from the owner's own model file (private, in <config>/aureon_models, never in the
// repository). The file is a single posed mesh without a skeleton; here it gets one at run time: bones at the
// shoulders, hips, neck and tail root, and every vertex weighted to the part it belongs to (smoothly across the
// joints). The bones are the pets' rig (body, four legs, head, tail), so walking, lying down and sleeping work as
// for every pet. Without the file (or before it has loaded) the dog keeps the simple built-in look.
import type * as THREE from "three";

/** The file the owner's Golden Retriever is read from (served to signed-in users only). */
export const GOLDEN_URL = "/api/neonplan3d/aureon_models/pet-golden-retriever.glb";

/** The model as the 3D bundle reads it (one or more parts, metres, feet at y = 0, front towards +z). */
export interface PetAsset {
  parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
}

export type SkinLib = {
  Group: typeof THREE.Group;
  Bone: typeof THREE.Bone;
  Skeleton: typeof THREE.Skeleton;
  SkinnedMesh: typeof THREE.SkinnedMesh;
  Float32BufferAttribute: typeof THREE.Float32BufferAttribute;
  Uint16BufferAttribute: typeof THREE.Uint16BufferAttribute;
};

/** Where the joints sit in the owner's model (measured on the prepared file: 0.72 m high, 1.12 m long). */
const RIG = {
  legs: [
    { x: -0.11, z: 0.22, top: 0.27, front: true },
    { x: 0.07, z: 0.22, top: 0.27, front: true },
    { x: -0.12, z: -0.3, top: 0.29, front: false },
    { x: 0.07, z: -0.3, top: 0.29, front: false },
  ],
  hip: 0.31,
  head: { y: 0.5, z: 0.3 },
  tail: { y: 0.5, z: -0.36 },
};
/** For lying down: the pets lower the body by leg + hi × 0.12. */
export const GOLDEN_LOOK = { leg: 0.17, hi: 0.26 };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface GoldenModel {
  root: THREE.Group;
  body: THREE.Object3D;
  legs: THREE.Object3D[];
  tail: THREE.Object3D;
  head: THREE.Object3D;
  eyes: THREE.Object3D[];
}

/** The owner's Golden Retriever on the pets' rig (the geometry is shared, the bones are this dog's own). */
export function buildGolden(lib: SkinLib, asset: PetAsset): GoldenModel {
  const root = new lib.Group();
  const body = new lib.Bone();
  const legs = RIG.legs.map((l) => {
    const b = new lib.Bone();
    b.position.set(l.x, RIG.hip, l.z);
    body.add(b);
    return b;
  });
  const head = new lib.Bone();
  head.position.set(0, RIG.head.y, RIG.head.z);
  const tail = new lib.Bone();
  tail.position.set(0, RIG.tail.y, RIG.tail.z);
  // the tail's rest pose is the pets' standing pose (they set its rotation absolutely)
  tail.rotation.set(-0.9, 0, 0);
  body.add(head, tail);
  root.add(body);
  root.updateMatrixWorld(true);
  const bones = [body, ...legs, head, tail];
  const skeleton = new lib.Skeleton(bones);
  for (const part of asset.parts) {
    const geo = part.geometry.clone();
    const pos = geo.getAttribute("position");
    const n = pos.count;
    const index = new Uint16Array(n * 4);
    const weight = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      // head: forward of the neck and above the chest; tail: behind the rump and above the hocks
      const wHead = smooth(0.26, 0.34, z) * smooth(0.26, 0.36, y);
      const wTail = smooth(-0.32, -0.4, z) * smooth(0.36, 0.42, y);
      // a leg: below the belly line, the nearest column on its half (front or back)
      let best = -1, d = 1e9;
      RIG.legs.forEach((l, k) => {
        if (l.front !== z > -0.05) return;
        const dd = Math.hypot(x - l.x, z - l.z);
        if (dd < d) (d = dd), (best = k);
      });
      const leg = RIG.legs[best];
      const wLeg = best >= 0 && wHead === 0 && wTail === 0 ? smooth(leg.top, leg.top - 0.07, y) : 0;
      const parts: [number, number][] = [
        [5, wHead],
        [6, wTail],
        [1 + best, wLeg],
      ].filter(([, w]) => w > 0.001) as [number, number][];
      const rest = Math.max(0, 1 - parts.reduce((s, [, w]) => s + w, 0));
      parts.push([0, rest]);
      parts.sort((a, b) => b[1] - a[1]);
      const sum = parts.slice(0, 4).reduce((s, [, w]) => s + w, 0) || 1;
      parts.slice(0, 4).forEach(([j, w], k) => {
        index[i * 4 + k] = j;
        weight[i * 4 + k] = w / sum;
      });
    }
    geo.setAttribute("skinIndex", new lib.Uint16BufferAttribute(index, 4));
    geo.setAttribute("skinWeight", new lib.Float32BufferAttribute(weight, 4));
    const mesh = new lib.SkinnedMesh(geo, part.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(body);
    mesh.bind(skeleton);
    root.add(mesh);
    break; // one skinned mesh carries the bones (the owner's model is a single part)
  }
  // the textured model keeps its eyes open: the pets' "close the eyes" scales an empty group
  return { root, body, legs, tail, head, eyes: [] };
}
