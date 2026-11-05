// AUREON: small pictures of the owner's own furniture models for "Meus móveis": the model itself, lit like a
// product photo, seen from the front at an angle. One offscreen renderer; pictures are kept for the page.
import { Box3, DirectionalLight, HemisphereLight, Mesh, PerspectiveCamera, Scene, SRGBColorSpace, ACESFilmicToneMapping, Vector3, WebGLRenderer } from "three";
import { parseGlb } from "./aureon-models.ts";

let renderer: WebGLRenderer | null = null;
const cache = new Map<string, Promise<string | null>>();
let queue: Promise<unknown> = Promise.resolve();

/** A JPEG data URL of the model at `url` (read with `read`, e.g. Home Assistant's authenticated fetch), or null. */
export function aureonModelThumb(url: string, read: (url: string) => Promise<Response>, size = 200): Promise<string | null> {
  const key = `${url}|${size}`;
  let hit = cache.get(key);
  if (hit) return hit;
  // one at a time: a long list does not download and draw every model at once
  hit = (queue = queue.then(() => draw(url, read, size)).catch(() => null)) as Promise<string | null>;
  cache.set(key, hit);
  return hit;
}

async function draw(url: string, read: (url: string) => Promise<Response>, size: number): Promise<string | null> {
  const res = await read(url);
  if (!res.ok) return null;
  const model = await parseGlb(await res.arrayBuffer(), async (blob) => (typeof createImageBitmap === "function" ? createImageBitmap(blob) : null));
  renderer ??= new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, Math.round(size * 0.72), false);
  renderer.setClearColor(0x1d272e, 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  const scene = new Scene();
  scene.add(new HemisphereLight(0xfff6ea, 0x3a4248, 1.5));
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(-2, 3, -2.5);
  scene.add(sun);
  for (const p of model.parts) scene.add(new Mesh(p.geometry, p.material));
  const box = new Box3().setFromObject(scene);
  const centre = box.getCenter(new Vector3());
  const radius = box.getSize(new Vector3()).length() / 2 || 0.5;
  // models face -z: the camera stands in front, a little to the side and above
  const camera = new PerspectiveCamera(28, size / Math.round(size * 0.72), radius / 50, radius * 30);
  const d = (radius / Math.sin((14 * Math.PI) / 180)) * 1.02;
  camera.position.set(centre.x + d * 0.42, centre.y + d * 0.38, centre.z - d * 0.82);
  camera.lookAt(centre);
  renderer.render(scene, camera);
  const url2 = renderer.domElement.toDataURL("image/jpeg", 0.85);
  for (const p of model.parts) {
    p.geometry.dispose();
    const m = p.material as unknown as Record<string, { dispose?: () => void } | null>;
    for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "alphaMap"]) m[k]?.dispose?.();
    p.material.dispose();
  }
  return url2;
}
