// AUREON: the living sky and the garden around the plan in the realistic looks.
// The sky is a photo of a real sky (CC0, Poly Haven) chosen by the sun's height and the weather and turned so its
// sun stands where the real sun is; at night stars are added. The garden is one lawn to the horizon, a light stone
// base under the plan with a row of shrubs and a few trees. Plants are sprites of real models (two crossed quads,
// one draw call per kind), so the whole outdoor scene costs a handful of draw calls and about 1 MB of pictures,
// loaded only for the sky that shows.

import {
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector3,
  TextureLoader,
  Vector2,
  type Camera,
} from "three";

export type SkyKey = "dawn" | "day" | "clear" | "sunset" | "dusk" | "night" | "overcast" | "mist";

/** Where each photo's own sun (or moon) stands (u across the picture) and its colour at the horizon (sRGB 0…1). */
export const SKIES: Record<SkyKey, { sunU: number; horizon: [number, number, number] }> = {
  dawn: { sunU: 0.5969, horizon: [0.602, 0.597, 0.626] },
  day: { sunU: 0.595, horizon: [0.664, 0.68, 0.729] },
  clear: { sunU: 0.6003, horizon: [0.772, 0.793, 0.822] },
  sunset: { sunU: 0.6072, horizon: [0.658, 0.639, 0.623] },
  dusk: { sunU: 0.6045, horizon: [0.423, 0.366, 0.431] },
  night: { sunU: 0.6001, horizon: [0.415, 0.425, 0.42] },
  overcast: { sunU: 0.5928, horizon: [0.486, 0.499, 0.526] },
  mist: { sunU: 0.6182, horizon: [0.576, 0.573, 0.586] },
};
/** The photos hold the sky from the zenith down to a little under the horizon (this share of the full height). */
const ROWS = 0.53;

export interface OutdoorWeather {
  cloud?: number;
  rain?: number;
  snow?: number;
  fog?: number;
}

export interface SkyChoice {
  key: SkyKey;
  /** 0…1: stars over the night sky. */
  stars: number;
  /** 1 = as photographed; less under rain. */
  light: number;
  /** 0…1: the moon shows (night, not hidden by clouds). */
  moon: number;
}

/**
 * Which sky shows: the sun's height (degrees; null = unknown, a day sky) and whether it is morning (azimuth under
 * 180°) pick the time of day; clouds, rain, snow and fog pick the weather. Pure, see aureon-outdoor.test.ts.
 */
export function pickSky(elevation: number | null, azimuth: number, w: OutdoorWeather | null): SkyChoice {
  const cloud = w?.cloud ?? 0.3;
  const wet = Math.max(w?.rain ?? 0, w?.snow ?? 0);
  const fog = w?.fog ?? 0;
  const light = wet > 0.5 ? 0.78 : wet > 0.15 ? 0.88 : 1;
  if (elevation === null) return { key: "day", stars: 0, light: 1, moon: 0 };
  const morning = ((azimuth % 360) + 360) % 360 < 180;
  if (elevation < -8) return { key: "night", stars: cloud > 0.75 || wet > 0.15 ? 0.1 : 1 - cloud * 0.8, light: cloud > 0.75 ? 0.7 : 0.82, moon: cloud > 0.8 || wet > 0.3 ? 0 : 1 - cloud * 0.6 };
  if (elevation < -2) return { key: morning ? "dawn" : "dusk", stars: morning ? 0 : 0.35 * (1 - cloud), light, moon: 0 };
  if (fog > 0.45) return { key: "mist", stars: 0, light, moon: 0 };
  if (cloud > 0.72 || wet > 0.15) return { key: "overcast", stars: 0, light, moon: 0 };
  if (elevation < 9) return { key: morning ? "dawn" : "sunset", stars: 0, light, moon: 0 };
  return { key: cloud < 0.2 ? "clear" : "day", stars: 0, light, moon: 0 };
}

/** Turn of the photo (in turns) so that its sun stands at the real sun's direction (degrees, north added). */
export function skyTurn(key: SkyKey, direction: number): number {
  const u = (((direction / 360 + 0.5) % 1) + 1) % 1;
  return SKIES[key].sunU - u;
}

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAGMENT = /* glsl */ `
uniform sampler2D mapA;
uniform sampler2D mapB;
uniform float mixAB;
uniform float turnA;
uniform float turnB;
uniform vec3 horizonA;
uniform vec3 horizonB;
uniform float stars;
uniform float light;
uniform float moon;
uniform float night;
uniform vec3 moonDir;
varying vec3 vDir;
float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash3(vec3(i, 1.0)), b = hash3(vec3(i + vec2(1.0, 0.0), 1.0)), c = hash3(vec3(i + vec2(0.0, 1.0), 1.0)), e = hash3(vec3(i + 1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, e, f.x), f.y);
}
vec3 starLayer(vec3 d, float scale, float keep, float gain, float size) {
  vec3 p = d * scale;
  vec3 cell = floor(p);
  float h = hash3(cell);
  if (h < keep) return vec3(0.0);
  vec3 off = vec3(hash3(cell + 1.3), hash3(cell + 2.7), hash3(cell + 4.1)) * 0.6 + 0.2;
  float s = smoothstep(size, 0.0, length(fract(p) - off));
  float b = (0.25 + pow((h - keep) / (1.0 - keep), 1.5)) * gain;
  vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.9, 0.75), hash3(cell + 9.0));
  return tint * s * b;
}
vec3 sky(sampler2D m, float turn, vec3 horizon, vec3 d) {
  float v = acos(clamp(d.y, -1.0, 1.0)) / 3.14159265;
  float u = fract(atan(d.x, -d.z) / 6.2831853 + 0.5 + turn);
  vec3 c = texture2D(m, vec2(u, 1.0 - min(v, ${ROWS.toFixed(3)} - 0.004) / ${ROWS.toFixed(3)})).rgb;
  return mix(c, horizon, smoothstep(0.495, ${ROWS.toFixed(3)}, v));
}
void main() {
  vec3 d = normalize(vDir);
  vec3 c = mix(sky(mapA, turnA, horizonA, d), sky(mapB, turnB, horizonB, d), mixAB) * light;
  if (night > 0.0) {
    // a clear night drawn here: deep blue overhead, a little lighter and warmer at the horizon
    float h = clamp(d.y, 0.0, 1.0);
    vec3 n = mix(vec3(0.035, 0.05, 0.11), vec3(0.006, 0.01, 0.03), pow(h, 0.45));
    n += vec3(0.09, 0.07, 0.07) * exp(-h * 14.0);
    c = mix(c, n, night);
  }
  if (stars > 0.0) {
    float up = smoothstep(0.0, 0.08, d.y);
    // a faint milky way across the sky
    float band = abs(dot(d, normalize(vec3(0.35, 0.55, -0.76))));
    float mw = exp(-band * band * 38.0) * (0.55 + 0.45 * hash3(floor(d * 40.0)));
    c += vec3(0.62, 0.66, 0.85) * mw * 0.11 * stars * up;
    // two layers of stars: many faint ones and fewer bright ones, slightly coloured
    c += starLayer(d, 520.0, 0.972, 1.1, 0.26) * stars * up;
    c += starLayer(d, 200.0, 0.985, 2.2, 0.28) * stars * up;
    c += starLayer(d, 80.0, 0.993, 3.8, 0.24) * stars * up;
  }
  if (moon > 0.0) {
    float a = acos(clamp(dot(d, moonDir), -1.0, 1.0));
    float r = 0.03;
    // the disc: lighter highlands, darker seas, a soft limb
    vec3 e1 = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)));
    vec3 e2 = cross(e1, moonDir);
    vec2 q = vec2(dot(d - moonDir, e1), dot(d - moonDir, e2)) / r;
    float disc = smoothstep(1.0, 0.94, length(q));
    float seas = vnoise(q * 2.3 + 3.1) * 0.6 + vnoise(q * 5.7) * 0.4;
    float limb = sqrt(max(0.0, 1.0 - dot(q, q)));
    vec3 face = mix(vec3(0.74, 0.74, 0.71), vec3(0.98, 0.97, 0.92), smoothstep(0.35, 0.7, seas)) * (0.72 + 0.28 * limb);
    c = mix(c, face * 1.15, disc * moon);
    // its glow and the halo in the haze
    c += vec3(0.55, 0.62, 0.8) * (exp(-a / 0.05) * 0.45 + exp(-a / 0.22) * 0.12) * moon * (1.0 - disc);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export interface OutdoorFrame {
  /** The plan's footprint (m) and the height of its lowest floor. */
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  floorY: number;
  /** The ground under the plan. */
  groundY: number;
  /** The middle of the entrance hall, if the plan has one: the shrubs leave a gap there. */
  entrance: [number, number] | null;
  /** The side the camera looks from at the start (radians, as the orbit's theta): trees stay out of that view. */
  viewTheta: number;
  garden: boolean;
}

/** Shrubs along the base and the trees' places, in metres. Pure, see aureon-outdoor.test.ts. */
export function gardenLayout(f: OutdoorFrame): { shrubs: [number, number, number][]; trees: [number, number, number][] } {
  const pad = 0.55;
  const x0 = f.x0 - pad, x1 = f.x1 + pad, z0 = f.z0 - pad, z1 = f.z1 + pad;
  const shrubs: [number, number, number][] = [];
  const step = 0.85;
  const along = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (f.entrance && Math.hypot(x - f.entrance[0], z - f.entrance[1]) < Math.max(1.4, Math.min(f.x1 - f.x0, f.z1 - f.z0) * 0.18)) continue;
      shrubs.push([x, z, 0.8 + ((i * 37) % 10) / 30]);
    }
  };
  const o = 0.42;
  along(x0 - o, z0 - o, x1 + o, z0 - o);
  along(x1 + o, z0 - o, x1 + o, z1 + o);
  along(x1 + o, z1 + o, x0 - o, z1 + o);
  along(x0 - o, z1 + o, x0 - o, z0 - o);
  // trees round the plan, away from the start view's side
  const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2, r = Math.hypot(f.x1 - f.x0, f.z1 - f.z0) / 2;
  const trees: [number, number, number][] = [];
  const view = Math.atan2(Math.sin(f.viewTheta), Math.cos(f.viewTheta));
  for (const [a, k, h] of [[0.4, 1.35, 6.2], [1.5, 1.6, 7], [2.5, 1.3, 5.6], [3.5, 1.55, 6.6], [4.5, 1.4, 5.9], [5.5, 1.7, 7.2]] as const) {
    const diff = Math.abs(Math.atan2(Math.sin(a - view), Math.cos(a - view)));
    if (diff < 1.1) continue;
    trees.push([cx + Math.sin(a) * (r * k + 2.5), cz + Math.cos(a) * (r * k + 2.5), h]);
  }
  return { shrubs, trees };
}

/** Two crossed quads per plant, standing on the ground, all in one geometry. */
function sprites(items: [number, number, number][], aspect: number, y: number, turn = 0.6): BufferGeometry {
  const pos: number[] = [], uv: number[] = [], nor: number[] = [], idx: number[] = [];
  items.forEach(([x, z, h], i) => {
    const w = h * aspect;
    for (const a of [turn + i * 0.7, turn + i * 0.7 + Math.PI / 2]) {
      const dx = (Math.cos(a) * w) / 2, dz = (Math.sin(a) * w) / 2, s = pos.length / 3;
      pos.push(x - dx, y, z - dz, x + dx, y, z + dz, x + dx, y + h, z + dz, x - dx, y + h, z - dz);
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      // lit from above whatever way the quad faces: no dark backs
      for (let k = 0; k < 4; k++) nor.push(0, 1, 0);
      idx.push(s, s + 1, s + 2, s, s + 2, s + 3);
    }
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function blobTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export class AureonOutdoor {
  readonly group = new Group();
  private readonly loader = new TextureLoader();
  private readonly skies = new Map<SkyKey, Texture>();
  private readonly sky: Mesh<SphereGeometry, ShaderMaterial>;
  private current: SkyKey | null = null;
  private fade = 1;
  private fadeFrom = 0;
  private garden = new Group();
  private gardenKey = "";
  private textures: Texture[] = [];
  private horizon = new Color();
  private lawnUniforms = { horizon: { value: new Color() }, centre: { value: new Vector2() }, near: { value: 30 }, far: { value: 200 }, wet: { value: 0 }, snow: { value: 0 } };
  private disposed = false;

  private readonly base: string;
  private readonly redraw: () => void;

  constructor(base: string, redraw: () => void) {
    this.base = base;
    this.redraw = redraw;
    const blank = new Texture();
    this.sky = new Mesh(
      new SphereGeometry(300, 48, 24),
      new ShaderMaterial({
        uniforms: {
          mapA: { value: blank },
          mapB: { value: blank },
          mixAB: { value: 1 },
          turnA: { value: 0 },
          turnB: { value: 0 },
          horizonA: { value: new Color() },
          horizonB: { value: new Color() },
          stars: { value: 0 },
          light: { value: 1 },
          moon: { value: 0 },
          night: { value: 0 },
          moonDir: { value: new Vector3(0, 1, 0) },
        },
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    );
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -100;
    this.sky.onBeforeRender = (_r, _s, camera: Camera) => {
      this.sky.position.copy(camera.position);
      this.sky.updateMatrixWorld();
    };
    this.group.add(this.sky, this.garden);
    this.group.name = "aureon-outdoor";
  }

  private url(path: string): string {
    return new URL(path, this.base).href;
  }

  private texture(key: SkyKey): Promise<Texture> {
    const have = this.skies.get(key);
    if (have) return Promise.resolve(have);
    return new Promise((resolve, reject) =>
      this.loader.load(
        this.url(`images/aureon-sky/${key}.jpg`),
        (t) => {
          t.colorSpace = SRGBColorSpace;
          t.wrapS = RepeatWrapping;
          // no mip maps: they would draw a seam where the picture's ends meet
          t.generateMipmaps = false;
          t.minFilter = LinearFilter;
          this.skies.set(key, t);
          resolve(t);
        },
        undefined,
        reject,
      ),
    );
  }

  /** Shows the sky for this moment; a change of sky blends over in about two seconds. */
  async setSky(choice: SkyChoice, direction: number): Promise<void> {
    const u = this.sky.material.uniforms;
    u.stars.value = choice.stars;
    u.light.value = choice.light;
    u.moon.value = choice.moon;
    u.night.value = choice.key === "night" ? (choice.stars > 0.3 ? 1 : 0.4) : 0;
    {
      const az = (direction * Math.PI) / 180, el = (11 * Math.PI) / 180;
      (u.moonDir.value as Vector3).set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    }
    const turn = skyTurn(choice.key, direction);
    if (choice.key === this.current) {
      u.turnB.value = turn;
      this.redraw();
      return;
    }
    const prev = this.current;
    this.current = choice.key;
    let t: Texture;
    try {
      t = await this.texture(choice.key);
    } catch {
      return;
    }
    if (this.disposed || this.current !== choice.key) return;
    const [r, g, b] = SKIES[choice.key].horizon;
    if (prev) {
      u.mapA.value = u.mapB.value;
      u.turnA.value = u.turnB.value;
      (u.horizonA.value as Color).copy(u.horizonB.value as Color);
      this.fade = 0;
      this.fadeFrom = performance.now();
    } else this.fade = 1;
    u.mapB.value = t;
    u.turnB.value = turn;
    (u.horizonB.value as Color).setRGB(r, g, b, SRGBColorSpace);
    this.horizon.setRGB(r, g, b, SRGBColorSpace);
    this.lawnUniforms.horizon.value.copy(this.horizon).multiplyScalar(choice.light);
    u.mixAB.value = this.fade;
    this.redraw();
  }

  /** Steps the blend between two skies; true while it still runs (the view keeps drawing). */
  tick(now: number): boolean {
    if (this.fade >= 1) return false;
    this.fade = Math.min(1, (now - this.fadeFrom) / 1800);
    this.sky.material.uniforms.mixAB.value = this.fade * this.fade * (3 - 2 * this.fade);
    return this.fade < 1;
  }

  /** Wet or snowy lawn (0…1 each). */
  setGround(wet: number, snow: number): void {
    this.lawnUniforms.wet.value = wet;
    this.lawnUniforms.snow.value = snow;
  }

  /** Lawn, base and plants for this plan; rebuilt only when the plan's footprint or the options change. */
  setFrame(f: OutdoorFrame): void {
    const key = JSON.stringify(f);
    if (key === this.gardenKey) return;
    this.gardenKey = key;
    this.clearGarden();
    const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2, r = Math.hypot(f.x1 - f.x0, f.z1 - f.z0) / 2;
    const tex = (path: string, color = true) => {
      const t = this.loader.load(this.url(path), () => this.redraw());
      if (color) t.colorSpace = SRGBColorSpace;
      t.wrapS = t.wrapT = RepeatWrapping;
      this.textures.push(t);
      return t;
    };
    // lawn to the horizon: tiles every 2.5 m, a larger pattern breaks the repeat, far away it fades into the sky
    const grass = tex("images/aureon-nature/grass.jpg");
    const grassN = tex("images/aureon-nature/grass-normal.jpg", false);
    const R = 380;
    grass.repeat.set(R / 1.25, R / 1.25);
    grassN.repeat.copy(grass.repeat);
    const lawnMat = new MeshStandardMaterial({ map: grass, normalMap: grassN, roughness: 1, color: 0xe8f0dc });
    lawnMat.fog = false;
    this.lawnUniforms.centre.value.set(cx, cz);
    this.lawnUniforms.near.value = Math.max(25, r * 4);
    this.lawnUniforms.far.value = 260;
    lawnMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { aHorizon: this.lawnUniforms.horizon, aCentre: this.lawnUniforms.centre, aNear: this.lawnUniforms.near, aFar: this.lawnUniforms.far, aWet: this.lawnUniforms.wet, aSnow: this.lawnUniforms.snow });
      sh.vertexShader = sh.vertexShader.replace("void main() {", "varying vec3 aWorld;\nvoid main() {").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\naWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "varying vec3 aWorld;\nuniform vec3 aHorizon;\nuniform vec2 aCentre;\nuniform float aNear;\nuniform float aFar;\nuniform float aWet;\nuniform float aSnow;\nvoid main() {")
        .replace(
          "#include <map_fragment>",
          "#include <map_fragment>\n#ifdef USE_MAP\nfloat aVar = texture2D(map, aWorld.xz * 0.017).g + texture2D(map, aWorld.xz * 0.0053 + 0.37).g;\ndiffuseColor.rgb *= 0.74 + 0.5 * aVar;\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.62, aWet);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.98), aSnow * 0.85);\n#endif",
        )
        .replace("#include <dithering_fragment>", "#include <dithering_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, aHorizon, smoothstep(aNear, aFar, distance(aWorld.xz, aCentre)));");
    };
    const lawn = new Mesh(new CircleGeometry(R, 96), lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(cx, f.groundY - 0.01, cz);
    lawn.renderOrder = -50;
    this.garden.add(lawn);
    // the light stone base the plan stands on
    const pad = 0.55;
    const h = Math.max(0.12, f.floorY - f.groundY);
    const base = new Mesh(new BoxGeometry(f.x1 - f.x0 + pad * 2, h, f.z1 - f.z0 + pad * 2), new MeshStandardMaterial({ color: 0xe9e5dd, roughness: 0.78 }));
    base.position.set(cx, f.groundY + h / 2 - 0.035, cz);
    this.garden.add(base);
    if (!f.garden) return this.redraw();
    const { shrubs, trees } = gardenLayout(f);
    // soft shadows: flat quads under each plant
    const sp: number[] = [], suv: number[] = [], si: number[] = [];
    const blob = (x: number, z: number, s: number) => {
      const k = sp.length / 3;
      sp.push(x - s, f.groundY + 0.004, z - s, x + s, f.groundY + 0.004, z - s, x + s, f.groundY + 0.004, z + s, x - s, f.groundY + 0.004, z + s);
      suv.push(0, 0, 1, 0, 1, 1, 0, 1);
      si.push(k, k + 2, k + 1, k, k + 3, k + 2);
    };
    for (const [x, z, s] of shrubs) blob(x, z, 0.55 * s);
    for (const [x, z, hh] of trees) blob(x + 0.6, z + 0.4, hh * 0.38);
    const sg = new BufferGeometry();
    sg.setAttribute("position", new Float32BufferAttribute(sp, 3));
    sg.setAttribute("uv", new Float32BufferAttribute(suv, 2));
    sg.setIndex(si);
    const shadows = new Mesh(sg, new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, side: DoubleSide }));
    shadows.renderOrder = -40;
    this.garden.add(shadows);
    const plant = (path: string, items: [number, number, number][], aspect: number) => {
      if (!items.length) return;
      const m = new MeshLambertMaterial({ map: tex(path), alphaTest: 0.5, side: DoubleSide });
      this.garden.add(new Mesh(sprites(items, aspect, f.groundY), m));
    };
    plant("images/aureon-nature/bush.webp", shrubs.map(([x, z, s]) => [x, z, 0.62 * s]), 384 / 227);
    plant("images/aureon-nature/tree-a.webp", trees.filter((_, i) => i % 2 === 0), 327 / 512);
    plant("images/aureon-nature/tree-b.webp", trees.filter((_, i) => i % 2 === 1), 482 / 512);
    this.redraw();
  }

  private clearGarden(): void {
    for (const o of [...this.garden.children]) {
      this.garden.remove(o);
      const m = o as Mesh;
      m.geometry?.dispose();
      const mat = m.material as MeshStandardMaterial | MeshBasicMaterial | undefined;
      (mat as MeshBasicMaterial | undefined)?.map?.dispose();
      mat?.dispose();
    }
    for (const t of this.textures) t.dispose();
    this.textures = [];
  }

  dispose(): void {
    this.disposed = true;
    this.clearGarden();
    for (const t of this.skies.values()) t.dispose();
    this.skies.clear();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
  }
}
