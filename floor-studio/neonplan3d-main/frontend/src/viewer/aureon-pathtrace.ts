/**
 * AUREON: photo refinement of the Real look. While the view rests on quality "High", the picture is path traced
 * (light bouncing between walls, floor and furniture, soft shadows and corners) and fades in over the live picture;
 * any change of view or scene shows the live picture again at once. The tracer is a bundle of its own
 * (neonplan3d-pathtrace.js) that borrows three.js from this bundle. Nothing here calls Home Assistant.
 */
import type { Camera, Material, Object3D, Scene, WebGLRenderer } from "three";
import { BufferAttribute, BufferGeometry, Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3, type Plane } from "three";
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


interface FoldInfo {
  masks: { standing: { value: number }; glass: { value: number } };
  role: "plain" | "solid" | "glass";
}
/** The fold shader's choice for one vertex (see fold.ts), done on the CPU for the tracer. */
export function foldShows(fold: number, standing: number, glass: number, role: FoldInfo["role"]): boolean {
  let show = role !== "glass";
  if (fold > -0.5) {
    const f = Math.round(fold), kind = Math.floor(f / 16), bucket = f - kind * 16;
    const isStanding = ((standing >> bucket) & 1) === 1, isGlass = ((glass >> bucket) & 1) === 1;
    show = kind === 0 || kind === 4 ? isStanding : kind === 1 || kind === 3 ? !isStanding : true;
    const wall = kind === 0 || kind === 2;
    if (role === "solid" && isGlass && wall) show = false;
    if (role === "glass") show = show && isGlass && wall;
  }
  return show;
}

/**
 * The live picture cuts walls on the GPU (fold shader) and clips models at the cut height (clipping planes); the
 * tracer reads raw geometry, so it gets a copy with only the triangles the live picture shows. Null: draw as is.
 */
export function visibleGeometry(mesh: Mesh): BufferGeometry | null {
  const g = mesh.geometry, mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const foldAttr = g.getAttribute("fold");
  const fd = mats[0]?.userData?.fp3dFold as FoldInfo | undefined;
  const planes = (mats[0]?.clippingPlanes ?? null) as Plane[] | null;
  const useFold = !!foldAttr && !!fd, usePlanes = !!planes && planes.length > 0;
  if (!useFold && !usePlanes) return null;
  const pos = g.getAttribute("position");
  if (!pos) return null;
  const n = pos.count, show = new Uint8Array(n);
  const v = new Vector3();
  for (let i = 0; i < n; i++) {
    let ok = true;
    if (useFold) ok = foldShows(foldAttr.getX(i), fd!.masks.standing.value, fd!.masks.glass.value, fd!.role);
    if (ok && usePlanes) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      for (const p of planes!) if (p.distanceToPoint(v) < 0) ok = false;
    }
    show[i] = ok ? 1 : 0;
  }
  const index = g.index;
  const at = (k: number) => (index ? index.getX(k) : k);
  const total = index ? index.count : n;
  const groups = g.groups.length ? g.groups : [{ start: 0, count: total, materialIndex: 0 }];
  const out: number[] = [];
  const copy = new BufferGeometry();
  for (const grp of groups) {
    const start = out.length;
    const end = Math.min(total, grp.start + grp.count);
    for (let k = grp.start; k + 2 < end; k += 3) {
      const a = at(k), b = at(k + 1), c = at(k + 2);
      // a triangle stays when the live picture draws it (all corners shown; clipped models keep cut faces)
      if (useFold ? show[a] && show[b] && show[c] : show[a] || show[b] || show[c]) out.push(a, b, c);
    }
    if (g.groups.length) copy.addGroup(start, out.length - start, grp.materialIndex ?? 0);
  }
  for (const [name, attr] of Object.entries(g.attributes)) copy.setAttribute(name, attr);
  copy.setIndex(new BufferAttribute(new Uint32Array(out), 1));
  // the tracer merges every mesh into one geometry: a copy keeps the original's layout (indexed or not), otherwise
  // its material ranges shift and furniture takes another surface's material (seen as see-through sofas)
  if (index) return copy;
  const flat = copy.toNonIndexed();
  copy.dispose();
  return flat;
}

/** One non-indexed geometry per material range of a mesh (attributes the tracer reads: position, normal, uv). */
export function splitByMaterial(mesh: Mesh): { geometry: BufferGeometry; material: Material }[] {
  const g = mesh.geometry;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const index = g.index;
  const total = index ? index.count : (g.getAttribute("position")?.count ?? 0);
  const groups = g.groups.length ? g.groups : [{ start: 0, count: total, materialIndex: 0 }];
  const out: { geometry: BufferGeometry; material: Material }[] = [];
  for (const grp of groups) {
    const material = mats[grp.materialIndex ?? 0];
    if (!material || !material.visible) continue;
    const start = grp.start, end = Math.min(total, grp.start + grp.count);
    if (end - start < 3) continue;
    const part = new BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      const a = g.getAttribute(name);
      if (!a) continue;
      const size = a.itemSize, arr = new Float32Array((end - start) * size);
      for (let k = start; k < end; k++) {
        const v = index ? index.getX(k) : k;
        for (let c = 0; c < size; c++) arr[(k - start) * size + c] = a.getComponent(v, c);
      }
      part.setAttribute(name, new BufferAttribute(arr, size));
    }
    if (!part.getAttribute("normal")) part.computeVertexNormals();
    out.push({ geometry: part, material });
  }
  return out;
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
  /** Diagnostics (tests only): leave out the cut/clip copies or the lamp-shade swap. */
  static debug = { copies: true, shades: true, lean: true };
  /** Switch for tests and diagnostics; the refinement runs on quality "High" (see the viewer's traceWanted). */
  static enabled = true;
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
      const swapped: [Mesh, Material | Material[]][] = [];
      const geoms: [Mesh, BufferGeometry][] = [];
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
          (scene as Scene & { environmentIntensity?: number }).environmentIntensity = 1.8 * (1 - night) + 0.14 * night;
          scene.traverseVisible((o) => {
            if (!(o as Mesh).isMesh || traceable(o)) return;
            hidden.push(o);
          });
          for (const o of hidden) o.visible = false;
          // a lamp's own shade lets its light through (linen, paper, bamboo): translucent in the photo, as it is lit
          scene.traverseVisible((o) => {
            const mesh = o as Mesh;
            if (!AureonPathTrace.debug.shades || !traceable(o) || mesh.castShadow || !o.userData.aureonModelMaterial || Array.isArray(mesh.material) || !SHADE.test((mesh.material as Material).name)) return;
            const before = mesh.material as MeshStandardMaterial;
            swapped.push([mesh, before]);
            mesh.material = this.shade(before);
          });
          // the photo needs colour (and cut-out alpha) only: a light copy per material without normal/roughness/
          // metalness maps keeps the tracer's texture array small (a large one is unreliable on weaker graphics)
          scene.traverseVisible((o) => {
            const mesh = o as Mesh;
            if (!traceable(o) || !AureonPathTrace.debug.lean) return;
            const before = mesh.material as Material | Material[];
            const list = Array.isArray(before) ? before : [before];
            const lean = list.map((m) => this.lean(m as MeshStandardMaterial));
            swapped.push([mesh, before as Material]);
            mesh.material = Array.isArray(before) ? lean : lean[0];
          });
          // walls cut at the cut height and models clipped there, as in the live picture
          scene.traverseVisible((o) => {
            const mesh = o as Mesh;
            if (!traceable(o) || !AureonPathTrace.debug.copies) return;
            const copy = visibleGeometry(mesh);
            if (!copy) return;
            geoms.push([mesh, mesh.geometry]);
            mesh.geometry = copy;
          });
          for (const old of this.copies) old.dispose();
          this.copies = geoms.map(([mesh]) => mesh.geometry);
          // the tracer keeps one material per vertex: meshes with several materials (walls, floors) and shared
          // vertices would mix them up, so it gets one plain, unshared, single-material mesh per material range
          const flat = new Group();
          flat.name = "aureon-trace-flat";
          const flatGeoms: BufferGeometry[] = [];
          scene.updateMatrixWorld();
          scene.traverseVisible((o) => {
            const mesh = o as Mesh;
            if (!traceable(o)) return;
            for (const part of splitByMaterial(mesh)) {
              const m = new Mesh(part.geometry, part.material);
              m.matrixAutoUpdate = false;
              m.matrix.copy(mesh.matrixWorld);
              m.matrixWorld.copy(mesh.matrixWorld);
              flat.add(m);
              flatGeoms.push(part.geometry);
            }
            hidden.push(o);
          });
          for (const o of hidden) o.visible = false;
          scene.add(flat);
          try {
            t.build(scene, camera);
          } finally {
            scene.remove(flat);
            for (const g of flatGeoms) g.dispose();
          }
          for (const [mesh, before] of geoms) mesh.geometry = before;
          geoms.length = 0;
          for (const [mesh, before] of [...swapped].reverse()) mesh.material = before;
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
        for (const [mesh, before] of [...swapped].reverse()) mesh.material = before;
        for (const [mesh, before] of geoms) mesh.geometry = before;
        scene.environment = prevEnv;
        (scene as Scene & { environmentIntensity?: number }).environmentIntensity = prevIntensity;
      }
    });
    return more;
  }
  private copies: BufferGeometry[] = [];
  private shades = new Map<Material, MeshPhysicalMaterial>();
  private leans = new Map<Material, MeshStandardMaterial>();
  private lean(m: MeshStandardMaterial): MeshStandardMaterial {
    if ((m as MeshStandardMaterial & { isMeshPhysicalMaterial?: boolean }).isMeshPhysicalMaterial && (m as MeshPhysicalMaterial).transmission > 0) return m;
    let l = this.leans.get(m);
    if (!l) {
      l = (m as Material & { isMeshPhysicalMaterial?: boolean }).isMeshPhysicalMaterial ? new MeshPhysicalMaterial() : new MeshStandardMaterial();
      l.name = m.name;
      l.color.copy(m.color);
      l.map = m.map;
      l.alphaMap = m.alphaMap;
      l.alphaTest = m.alphaTest;
      l.transparent = m.transparent;
      l.opacity = m.opacity;
      l.side = m.side;
      // metal only where the material says so; maps of the live picture carry the rest
      l.metalness = m.metalnessMap ? (m.metalness >= 0.99 && /metal|brass|nickel|chrome|steel|black/i.test(m.name) ? 0.9 : 0) : m.metalness;
      l.roughness = m.roughnessMap ? Math.max(0.35, Math.min(1, m.roughness * 0.75)) : m.roughness;
      l.emissive.copy(m.emissive);
      l.emissiveIntensity = m.emissiveIntensity;
      l.visible = m.visible;
      l.userData = m.userData;
      this.leans.set(m, l);
    }
    return l;
  }
  private shade(m: MeshStandardMaterial): MeshPhysicalMaterial {
    let s = this.shades.get(m);
    if (!s) {
      s = new MeshPhysicalMaterial({ color: m.color, map: m.map, normalMap: m.normalMap, roughness: 1, metalness: 0, transmission: 0.75, thickness: 0, ior: 1.2, side: m.side });
      this.shades.set(m, s);
    }
    return s;
  }
  dispose(): void {
    for (const c of this.copies) c.dispose();
    this.copies = [];
    for (const l of this.leans.values()) l.dispose();
    this.leans.clear();
    for (const s of this.shades.values()) s.dispose();
    this.shades.clear();
    this.disposed = true;
    this.tracer?.dispose();
    this.tracer = null;
  }
}
