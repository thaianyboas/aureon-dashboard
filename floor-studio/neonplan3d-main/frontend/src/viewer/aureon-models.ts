/**
 * AUREON extension: own furniture models (glTF 2.0 binary, .glb) for furniture items that carry `aureon_model`.
 * The item keeps an original built-in `type`, so the original editor lists, selects, moves, turns and resizes it as
 * before; only the 3D viewer draws the model instead of the built-in shape once the file has loaded (and falls back
 * to the built-in shape when it cannot). No glTF library: a small reader for self-contained .glb files (triangles,
 * POSITION/NORMAL/TEXCOORD_0, indices, node transforms, metallic-roughness materials, embedded PNG/JPEG textures).
 * Primitives are merged per material, so a model costs one draw call per material.
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  FrontSide,
  Group,
  Matrix3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Plane,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Texture,
  Vector3,
  type Material,
} from "three";

export interface AureonModelRef {
  /** Same-origin path of a .glb (e.g. /local/aureon-moveis/<token>/sofa.glb). */
  url: string;
  /** Catalogue id, for the owner's reference only. */
  id?: string | null;
}

interface FurnitureLike {
  id: string;
  type: string;
  x: number;
  z: number;
  rotation: number;
  w: number;
  d: number;
  h: number;
  mirror?: boolean | null;
  mount_y?: number | null;
  aureon_model?: AureonModelRef | null;
}

interface LoadedModel {
  parts: { geometry: BufferGeometry; material: MeshStandardMaterial }[];
  min: Vector3;
  size: Vector3;
  triangles: number;
}

type Entry = { state: "loading" } | { state: "ready"; model: LoadedModel } | { state: "error"; error: string };

const MAX_BYTES = 24 * 1024 * 1024;
const MAX_TRIANGLES = 120_000;

/** Only same-origin absolute paths to a .glb: never another host, a data: URL or a path with tokens in it. */
export function aureonModelUrl(f: { aureon_model?: AureonModelRef | null }): string | null {
  const url = f.aureon_model?.url;
  if (typeof url !== "string" || url.length > 512) return null;
  if (!url.startsWith("/") || url.startsWith("//") || /[?#\\]|\.\./.test(url) || !/\.glb$/i.test(url)) return null;
  return url;
}

const COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const ARRAYS: Record<number, { new (b: ArrayBuffer, o: number, n: number): ArrayLike<number> & { BYTES_PER_ELEMENT: number } }> = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

/** Parses a self-contained .glb into merged geometries per material (exported for tests). */
export async function parseGlb(buffer: ArrayBuffer, makeImage: (blob: Blob) => Promise<TexImageSource | null>): Promise<LoadedModel> {
  const dv = new DataView(buffer);
  if (buffer.byteLength < 20 || dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(4, true) !== 2) throw new Error("not a glTF 2.0 .glb");
  let json: any = null;
  let bin: ArrayBuffer | null = null;
  for (let off = 12; off + 8 <= Math.min(buffer.byteLength, dv.getUint32(8, true)); ) {
    const len = dv.getUint32(off, true);
    const type = dv.getUint32(off + 4, true);
    if (off + 8 + len > buffer.byteLength) throw new Error("truncated chunk");
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, off + 8, len)));
    else if (type === 0x004e4942) bin = buffer.slice(off + 8, off + 8 + len);
    off += 8 + len + ((4 - (len % 4)) % 4);
  }
  if (!json || !bin) throw new Error("missing JSON or BIN chunk");
  if ((json.buffers ?? []).some((b: any) => typeof b.uri === "string")) throw new Error("external buffers are not supported");
  const accessor = (index: number): { array: Float32Array | Uint32Array; size: number } => {
    const a = json.accessors?.[index];
    if (!a) throw new Error("missing accessor");
    const size = COMPONENTS[a.type];
    const Arr = ARRAYS[a.componentType];
    const view = json.bufferViews?.[a.bufferView];
    if (!size || !Arr || !view || (view.buffer ?? 0) !== 0) throw new Error("unsupported accessor");
    const elem = Arr.prototype.BYTES_PER_ELEMENT as number;
    const stride = view.byteStride ?? size * elem;
    const start = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
    if (start + stride * (a.count - 1) + size * elem > bin!.byteLength) throw new Error("accessor out of range");
    const out = a.componentType === 5126 ? new Float32Array(a.count * size) : new Uint32Array(a.count * size);
    const src = new DataView(bin!);
    const read = (o: number): number => {
      switch (a.componentType) {
        case 5126: return src.getFloat32(o, true);
        case 5125: return src.getUint32(o, true);
        case 5123: return src.getUint16(o, true);
        case 5122: return src.getInt16(o, true);
        case 5121: return src.getUint8(o);
        default: return src.getInt8(o);
      }
    };
    for (let i = 0; i < a.count; i++) for (let k = 0; k < size; k++) out[i * size + k] = read(start + i * stride + k * elem);
    return { array: out, size };
  };
  // textures: embedded images only
  const images: Promise<Texture | null>[] = (json.images ?? []).map(async (img: any) => {
    const view = json.bufferViews?.[img.bufferView];
    if (!view || typeof img.mimeType !== "string" || !/^image\/(png|jpeg)$/.test(img.mimeType)) return null;
    const blob = new Blob([new Uint8Array(bin!, view.byteOffset ?? 0, view.byteLength)], { type: img.mimeType });
    const source = await makeImage(blob);
    if (!source) return null;
    const t = new Texture(source as never);
    t.flipY = false;
    t.needsUpdate = true;
    return t;
  });
  const loaded = await Promise.all(images);
  const textureOf = (info: any, srgb: boolean): Texture | null => {
    const tex = info ? json.textures?.[info.index] : null;
    const t = tex ? (loaded[tex.source] ?? null) : null;
    if (t && srgb) t.colorSpace = SRGBColorSpace;
    return t;
  };
  const materials: MeshStandardMaterial[] = (json.materials ?? []).map((m: any) => {
    const pbr = m.pbrMetallicRoughness ?? {};
    const f = pbr.baseColorFactor ?? [1, 1, 1, 1];
    const mat = new MeshStandardMaterial({
      color: new Color().setRGB(f[0], f[1], f[2]),
      opacity: f[3] ?? 1,
      transparent: m.alphaMode === "BLEND" || (f[3] ?? 1) < 1,
      metalness: pbr.metallicFactor ?? 1,
      roughness: pbr.roughnessFactor ?? 1,
      side: m.doubleSided ? DoubleSide : FrontSide,
    });
    mat.map = textureOf(pbr.baseColorTexture, true);
    mat.name = typeof m.name === "string" ? m.name : "";
    return mat;
  });
  const fallback = new MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8, metalness: 0 });
  // gather triangles per material in model space (node transforms applied)
  const buckets = new Map<number, { p: number[]; n: number[]; uv: number[] }>();
  let triangles = 0;
  const visit = (index: number, parent: Matrix4, depth: number) => {
    const node = json.nodes?.[index];
    if (!node || depth > 32) return;
    const local = new Matrix4();
    if (Array.isArray(node.matrix)) local.fromArray(node.matrix);
    else local.compose(new Vector3().fromArray(node.translation ?? [0, 0, 0]), new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(node.scale ?? [1, 1, 1]));
    const world = parent.clone().multiply(local);
    const normalMatrix = new Matrix3().getNormalMatrix(world);
    const mesh = node.mesh !== undefined ? json.meshes?.[node.mesh] : null;
    for (const prim of mesh?.primitives ?? []) {
      if ((prim.mode ?? 4) !== 4 || prim.attributes?.POSITION === undefined) continue;
      const pos = accessor(prim.attributes.POSITION);
      const nor = prim.attributes.NORMAL !== undefined ? accessor(prim.attributes.NORMAL) : null;
      const uv = prim.attributes.TEXCOORD_0 !== undefined ? accessor(prim.attributes.TEXCOORD_0) : null;
      const count = pos.array.length / 3;
      const idx = prim.indices !== undefined ? accessor(prim.indices).array : Uint32Array.from({ length: count }, (_, i) => i);
      triangles += idx.length / 3;
      if (triangles > MAX_TRIANGLES) throw new Error("model too detailed");
      const key = typeof prim.material === "number" ? prim.material : -1;
      const b = buckets.get(key) ?? { p: [], n: [], uv: [] };
      buckets.set(key, b);
      const v = new Vector3();
      for (const i of idx) {
        if (i >= count) throw new Error("index out of range");
        v.set(pos.array[i * 3], pos.array[i * 3 + 1], pos.array[i * 3 + 2]).applyMatrix4(world);
        b.p.push(v.x, v.y, v.z);
        if (nor) {
          v.set(nor.array[i * 3], nor.array[i * 3 + 1], nor.array[i * 3 + 2]).applyMatrix3(normalMatrix).normalize();
          b.n.push(v.x, v.y, v.z);
        }
        b.uv.push(uv ? uv.array[i * 2] : 0, uv ? uv.array[i * 2 + 1] : 0);
      }
    }
    for (const child of node.children ?? []) visit(child, world, depth + 1);
  };
  const scene = json.scenes?.[json.scene ?? 0];
  for (const root of scene?.nodes ?? (json.nodes ?? []).map((_: unknown, i: number) => i)) visit(root, new Matrix4(), 0);
  const parts: LoadedModel["parts"] = [];
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const [key, b] of buckets) {
    if (!b.p.length) continue;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(b.p), 3));
    if (b.n.length === b.p.length) g.setAttribute("normal", new BufferAttribute(new Float32Array(b.n), 3));
    else g.computeVertexNormals();
    g.setAttribute("uv", new BufferAttribute(new Float32Array(b.uv), 2));
    g.computeBoundingBox();
    min.min(g.boundingBox!.min);
    max.max(g.boundingBox!.max);
    parts.push({ geometry: g, material: materials[key] ?? fallback });
  }
  if (!parts.length) throw new Error("no triangles");
  return { parts, min, size: max.clone().sub(min), triangles };
}

const DEG = Math.PI / 180;

/** Loads, caches and places the models; one Group per floor id, kept outside the floor groups. */
export class AureonModels {
  private entries = new Map<string, Entry>();
  private groups = new Map<string, Group>();
  private basic = new Map<Material, MeshBasicMaterial>();
  private look = "";
  private readonly onReady: () => void;
  constructor(onReady: () => void) {
    this.onReady = onReady;
  }

  /** Starts loading what the items need; true when every model of `items` with a valid URL is ready. */
  request(items: readonly FurnitureLike[]): void {
    for (const f of items) {
      const url = aureonModelUrl(f);
      if (!url || this.entries.has(url)) continue;
      this.entries.set(url, { state: "loading" });
      void this.load(url);
    }
  }

  private async load(url: string): Promise<void> {
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const size = Number(res.headers.get("content-length") ?? 0);
      if (size > MAX_BYTES) throw new Error("file too large");
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) throw new Error("file too large");
      const model = await parseGlb(buf, async (blob) => (typeof createImageBitmap === "function" ? createImageBitmap(blob) : null));
      this.entries.set(url, { state: "ready", model });
    } catch (err) {
      console.warn("AUREON model not loaded:", url, err);
      this.entries.set(url, { state: "error", error: String((err as Error)?.message ?? err) });
    }
    this.onReady();
  }

  /** Ids of the items drawn by a model (their built-in shape is left out of the floor geometry). */
  modelled(items: readonly FurnitureLike[]): Set<string> {
    const out = new Set<string>();
    for (const f of items) {
      const url = aureonModelUrl(f);
      if (url && this.entries.get(url)?.state === "ready") out.add(f.id);
    }
    return out;
  }

  /** True while any requested model is still loading. */
  get loading(): boolean {
    for (const e of this.entries.values()) if (e.state === "loading") return true;
    return false;
  }

  /** Status per item, for diagnostics and tests. */
  status(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [url, e] of this.entries) out[url] = e.state === "error" ? `error: ${e.error}` : e.state;
    return out;
  }

  /** (Re)builds the model instances of one floor. */
  place(floorId: string, items: readonly FurnitureLike[], parent: Group, extra?: Group): Group {
    this.groups.get(floorId)?.removeFromParent();
    const group = new Group();
    group.name = "aureon-models";
    for (const f of items) {
      const url = aureonModelUrl(f);
      const e = url ? this.entries.get(url) : undefined;
      if (!e || e.state !== "ready") continue;
      const { model } = e;
      const item = new Group();
      item.userData.aureonFurniture = f.id;
      const inner = new Group();
      // model space: metres, Y up, front towards -Z; NeonPlan items face +z locally, so the model turns half round
      const sx = model.size.x > 1e-6 ? f.w / model.size.x : 1;
      const sy = model.size.y > 1e-6 ? f.h / model.size.y : 1;
      const sz = model.size.z > 1e-6 ? f.d / model.size.z : 1;
      inner.scale.set(sx * (f.mirror ? -1 : 1), sy, sz);
      inner.position.set(-(model.min.x + model.size.x / 2) * inner.scale.x, -model.min.y * sy, -(model.min.z + model.size.z / 2) * sz);
      for (const part of model.parts) {
        const mesh = new Mesh(part.geometry, part.material);
        // a lamp's own shade does not block its light (the light sits inside it): no lattice shadows over the room
        mesh.castShadow = !f.type.startsWith("lamp_");
        mesh.receiveShadow = true;
        mesh.userData.aureonModelMaterial = part.material;
        inner.add(mesh);
      }
      item.add(inner);
      item.rotation.y = -f.rotation * DEG + Math.PI;
      item.position.set(f.x, Math.max(0, f.mount_y ?? 0), f.z);
      group.add(item);
    }
    if (extra?.children.length) group.add(extra);
    this.groups.set(floorId, group);
    parent.add(group);
    this.look = "";
    return group;
  }

  /** Follows the floor group (stacking, opening a floor) and the look: physical materials only in Real. */
  sync(floors: ReadonlyMap<string, { group: Group; cut: number | null }>, look: string, night: number): void {
    for (const [id, g] of this.groups) {
      const f = floors.get(id);
      if (!f) {
        g.visible = false;
        continue;
      }
      const fg = f.group;
      g.visible = fg.visible;
      g.position.copy(fg.position);
      g.quaternion.copy(fg.quaternion);
      g.scale.copy(fg.scale);
      // with cut walls, models are cut at the same height as the walls (as the built-in tall furniture)
      fg.updateMatrixWorld();
      const planes = f.cut === null ? [] : [new Plane(new Vector3(0, -1, 0), new Vector3(0, f.cut, 0).applyMatrix4(fg.matrixWorld).y)];
      g.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        const mats = [mesh.material as Material, mesh.userData.aureonModelMaterial as Material | undefined, this.basic.get(mesh.userData.aureonModelMaterial)];
        for (const m of mats) if (m && (m.clippingPlanes?.length ?? 0) + planes.length > 0 && (m.clippingPlanes?.[0]?.constant ?? null) !== (planes[0]?.constant ?? null)) {
          m.clippingPlanes = planes;
          m.needsUpdate = true;
        }
      });
    }
    const key = `${look}|${look === "real" ? 0 : Math.round(night * 10)}`;
    if (key === this.look) return;
    this.look = key;
    // the other looks have no lights: an unlit copy of each material, dimmer in the dark looks
    const dim = look === "day" ? 1 : look === "real" ? 1 : look === "night" ? 0.55 : 0.42;
    for (const g of this.groups.values())
      g.traverse((o) => {
        const mesh = o as Mesh;
        const original = mesh.userData?.aureonModelMaterial as MeshStandardMaterial | undefined;
        if (!mesh.isMesh || !original) return;
        if (look === "real") {
          mesh.material = original;
          return;
        }
        let b = this.basic.get(original);
        if (!b) {
          b = new MeshBasicMaterial({ map: original.map, transparent: original.transparent, opacity: original.opacity, side: original.side, polygonOffset: original.polygonOffset, polygonOffsetFactor: original.polygonOffsetFactor, polygonOffsetUnits: original.polygonOffsetUnits });
          this.basic.set(original, b);
        }
        b.color.copy(original.color).multiplyScalar(dim);
        mesh.material = b;
      });
  }

  dispose(): void {
    for (const g of this.groups.values()) g.removeFromParent();
    this.groups.clear();
    for (const e of this.entries.values())
      if (e.state === "ready")
        for (const p of e.model.parts) {
          p.geometry.dispose();
          p.material.map?.dispose();
          p.material.dispose();
        }
    for (const m of this.basic.values()) m.dispose();
    this.basic.clear();
    this.entries.clear();
  }
}
