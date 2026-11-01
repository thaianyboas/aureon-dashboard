/**
 * AUREON: photo refinement of the Real look. While the view rests on quality "High", the picture is path traced
 * (light bouncing between walls, floor and furniture, soft shadows and corners) and fades in over the live picture;
 * any change of view or scene shows the live picture again at once. The tracer is a bundle of its own
 * (neonplan3d-pathtrace.js) that borrows three.js from this bundle. Nothing here calls Home Assistant.
 */
import type { Camera, Material, Mesh, Object3D, Scene, WebGLRenderer } from "three";
import { Color, MeshPhysicalMaterial, type MeshStandardMaterial } from "three";
import type * as TraceBundle from "../pathtrace/entry.ts";
import { AUREON_THREE_LEND } from "./aureon-three-lend.ts";

declare const __FP3D_PATHTRACE_HASH__: string;

let loading: Promise<typeof TraceBundle> | undefined;
function loadTracer(): Promise<typeof TraceBundle> {
  const g = globalThis as { __AUREON_THREE__?: unknown };
  g.__AUREON_THREE__ ??= AUREON_THREE_LEND;
  // the hash is set by build.mjs; other bundlings (tests) have none and fall back to an uncached name
  const hash = typeof __FP3D_PATHTRACE_HASH__ === "string" ? __FP3D_PATHTRACE_HASH__ : "dev";
  let url: string;
  try {
    url = new URL(`./neonplan3d-pathtrace.js?v=${hash}`, new URL(import.meta.url)).href;
  } catch (err) {
    return Promise.reject(err);
  }
  loading ??= (import(/* @vite-ignore */ url) as Promise<typeof TraceBundle>).catch((err) => {
    loading = undefined;
    throw err;
  });
  return loading;
}

/** How long the view must rest before refining, how many samples make the final picture. */
export const TRACE_IDLE_MS = 400;
export const TRACE_SAMPLES = 160;

/** Only lit, solid surfaces take part: glows, lines, labels, contact planes and see-through helpers stay out. */
export function traceable(object: Object3D): boolean {
  const mesh = object as Mesh;
  if (!mesh.isMesh || object.userData.aureonContact) return false;
  const m = mesh.material as Material | Material[];
  const list = Array.isArray(m) ? m : [m];
  return list.length > 0 && list.every((x) => !!x && (x as Material & { isMeshStandardMaterial?: boolean }).isMeshStandardMaterial === true && x.visible);
}

/** Signature of what the tracer has collected: solid meshes, their geometry and place. */
export function sceneSignature(scene: Scene): string {
  let n = 0,
    acc = 0;
  scene.traverseVisible((o) => {
    if (!traceable(o)) return;
    const mesh = o as Mesh;
    const pos = mesh.geometry.getAttribute("position");
    n++;
    const e = o.matrixWorld.elements;
    acc = (acc * 31 + mesh.geometry.id * 7 + (pos ? ("version" in pos ? pos.version : pos.data.version) : 0) + (pos?.count ?? 0) + Math.round((e[12] + e[13] * 3 + e[14] * 5 + e[0] + e[10]) * 1000)) % 2147483647;
  });
  return `${n}:${acc}`;
}

export function cameraSignature(camera: Camera): string {
  const p = (camera as Camera & { projectionMatrix: { elements: number[] } }).projectionMatrix.elements;
  return [...camera.matrixWorld.elements, p[0], p[5]].map((v) => v.toFixed(4)).join(",");
}

/** Materials of a lamp model that its light shines through (by the model's material names). */
export const SHADE = /shade|linen|bamboo|paper|rattan|fabric|cloth|opal|frosted/i;

type Tracer = TraceBundle.AureonTracer;
/** Runs a callback with the Real look staged (lights, materials, environment); the callback draws or collects. */
export type Staged = (fn: () => void) => void;

export class AureonPathTrace {
  private tracer: Tracer | null = null;
  private failed = false;
  private sceneSig = "";
  private cameraSig = "";
  private lightSig = "";
  private rebuilds: number[] = [];
  private errors = 0;
  private loadingNow = false;
  /** While the scene keeps changing (models still arriving, a turning fan …) the refinement waits until then. */
  pausedUntil = 0;
  private renderer: WebGLRenderer;
  private disposed = false;
  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }
  /** The tracer is loaded (false while loading or after a failure). */
  get ready(): boolean {
    return !!this.tracer && !this.failed;
  }
  get samples(): number {
    return this.tracer?.samples ?? 0;
  }
  get done(): boolean {
    return this.samples >= TRACE_SAMPLES;
  }
  /** Stops for good on this view (the tracer did not load, or failed again and again). */
  get off(): boolean {
    return this.failed;
  }
  load(onReady: () => void): void {
    if (this.tracer || this.failed || this.loadingNow) return;
    this.loadingNow = true;
    loadTracer()
      .then((b) => {
        this.loadingNow = false;
        if (this.disposed) return;
        const w = this.renderer.domElement.width;
        // the tracer works at about 1 MP at most; tiles keep each frame short so the panel stays responsive
        const scale = Math.min(1, Math.sqrt(1_000_000 / Math.max(1, w * this.renderer.domElement.height)));
        this.tracer = b.createTracer(this.renderer, { scale, tiles: 2, bounces: 5 });
        onReady();
      })
      .catch(() => {
        this.loadingNow = false;
        this.failed = true;
      });
  }
  /** The live picture is drawn: a changed view or scene starts the refinement over. */
  touch(): void {
    this.tracer?.reset();
  }
  /**
   * One step of refinement while the view rests. `staged` applies the Real look (materials, lights) around a callback;
   * `fallback` draws the live picture (shown until the traced one is clean enough). Returns true while more steps help.
   */
  step(scene: Scene, camera: Camera, staged: Staged, fallback: () => void, lightSig: string, night: number): boolean {
    const t = this.tracer;
    if (!t || this.failed) return false;
    let more = true;
    staged(() => {
      // the sky lights the house from outside by day; by night it is a deep blue that barely lights
      const top = new Color(0xc9dcf5).lerp(new Color(0x0b1220), night),
        bottom = new Color(0x8c7f6c).lerp(new Color(0x0a0907), night);
      const prevEnv = scene.environment,
        prevIntensity = (scene as Scene & { environmentIntensity?: number }).environmentIntensity;
      const hidden: Object3D[] = [];
      const swapped: [Mesh, Material][] = [];
      try {
        const sig = sceneSignature(scene);
        if (sig !== this.sceneSig) {
          const now = performance.now();
          this.rebuilds = this.rebuilds.filter((x) => now - x < 20_000);
          this.rebuilds.push(now);
          // a scene that keeps changing (models still arriving, a turning fan …): wait, then try again
          if (this.rebuilds.length > 4) {
            this.rebuilds = [];
            this.pausedUntil = now + 15_000;
            more = false;
            fallback();
            return;
          }
          scene.environment = t.sky(top, bottom);
          (scene as Scene & { environmentIntensity?: number }).environmentIntensity = 0.9 * (1 - night) + 0.14 * night;
          scene.traverseVisible((o) => {
            if (!(o as Mesh).isMesh || traceable(o)) return;
            hidden.push(o);
          });
          for (const o of hidden) o.visible = false;
          // a lamp's own shade lets its light through (linen, paper, bamboo): translucent in the photo, as it is lit
          scene.traverseVisible((o) => {
            const mesh = o as Mesh;
            if (!traceable(o) || mesh.castShadow || !o.userData.aureonModelMaterial || Array.isArray(mesh.material) || !SHADE.test((mesh.material as Material).name)) return;
            const before = mesh.material as MeshStandardMaterial;
            swapped.push([mesh, before]);
            mesh.material = this.shade(before);
          });
          t.build(scene, camera);
          for (const [mesh, before] of swapped) mesh.material = before;
          swapped.length = 0;
          for (const o of hidden) o.visible = true;
          hidden.length = 0;
          this.sceneSig = sig;
          this.cameraSig = cameraSignature(camera);
          this.lightSig = lightSig;
        }
        if (lightSig !== this.lightSig) {
          t.lights();
          this.lightSig = lightSig;
        }
        const cs = cameraSignature(camera);
        if (cs !== this.cameraSig) {
          t.camera(camera);
          this.cameraSig = cs;
        }
        scene.environment = prevEnv;
        (scene as Scene & { environmentIntensity?: number }).environmentIntensity = prevIntensity;
        t.sample(fallback);
        more = t.samples < TRACE_SAMPLES;
        this.errors = 0;
      } catch {
        // a passing error (a scene changed mid-build) is tried again later; a lasting one stops the refinement
        this.sceneSig = "";
        if (++this.errors > 3) this.failed = true;
        else this.pausedUntil = performance.now() + 5_000;
        more = false;
        fallback();
      } finally {
        for (const o of hidden) o.visible = true;
        for (const [mesh, before] of swapped) mesh.material = before;
        scene.environment = prevEnv;
        (scene as Scene & { environmentIntensity?: number }).environmentIntensity = prevIntensity;
      }
    });
    return more;
  }
  private shades = new Map<Material, MeshPhysicalMaterial>();
  private shade(m: MeshStandardMaterial): MeshPhysicalMaterial {
    let s = this.shades.get(m);
    if (!s) {
      s = new MeshPhysicalMaterial({ color: m.color, map: m.map, normalMap: m.normalMap, roughness: 1, metalness: 0, transmission: 0.75, thickness: 0, ior: 1.2, side: m.side });
      this.shades.set(m, s);
    }
    return s;
  }
  dispose(): void {
    for (const s of this.shades.values()) s.dispose();
    this.shades.clear();
    this.disposed = true;
    this.tracer?.dispose();
    this.tracer = null;
  }
}
