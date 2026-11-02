// AUREON: the Real look's photo refinement (path tracing), a bundle of its own. It loads only when the Real look runs
// on the "High" quality and the view rests; three.js is lent by the 3D bundle (see aureon-three-lend.ts and build.mjs),
// so the scene's own objects, materials and renderer are used as they are.
// three-gpu-pathtracer and three-mesh-bvh: MIT licence (Garrett Johnson), see THIRD_PARTY_PATHTRACE.txt next to the bundle.
import { WebGLPathTracer } from "three-gpu-pathtracer/src/core/WebGLPathTracer.js";
import { GradientEquirectTexture } from "three-gpu-pathtracer/src/textures/GradientEquirectTexture.js";
import { DenoiseMaterial } from "three-gpu-pathtracer/src/materials/fullscreen/DenoiseMaterial.js";
import type { Camera, Color, Scene, Texture, WebGLRenderer } from "three";

export interface AureonTracer {
  /** Collects the scene (geometry, materials, lights, sky) – call with the Real materials applied. */
  build(scene: Scene, camera: Camera): void;
  /** Re-reads only the lights (a lamp turned on or off, its colour). */
  lights(): void;
  camera(camera: Camera): void;
  /** One more sample; draws the refined picture over the canvas once it is clean enough, else the fallback. */
  sample(fallback: () => void): void;
  reset(): void;
  /** Share of the canvas resolution that is traced (lower: faster, softer). */
  scale(value: number): void;
  readonly samples: number;
  readonly compiling: boolean;
  /** Diagnostics: the tracer object itself. */
  readonly raw: unknown;
  sky(top: Color, bottom: Color): Texture;
  dispose(): void;
}

/** Samples up to which the young picture is denoised. */
export const DENOISE_UNTIL = 96;

export function createTracer(renderer: WebGLRenderer, opts: { scale: number; tiles: number; bounces: number }): AureonTracer {
  const pt = new WebGLPathTracer(renderer);
  pt.renderScale = opts.scale;
  pt.tiles.set(opts.tiles, opts.tiles);
  pt.bounces = opts.bounces;
  pt.transmissiveBounces = 4;
  pt.filterGlossyFactor = 0.5;
  pt.minSamples = 3;
  pt.fadeDuration = 350;
  pt.renderDelay = 0;
  pt.dynamicLowRes = false;
  pt.rasterizeScene = true;
  pt.textureSize.set(512, 512);
  const gradient = new GradientEquirectTexture(32);
  let fallback: () => void = () => {};
  pt.rasterizeSceneCallback = () => fallback();
  // an edge-preserving denoise while the picture is young (few samples): smooth surfaces at once, sharp edges kept;
  // it fades out as the samples add up (the converged picture is shown as traced)
  const denoise = new DenoiseMaterial({ premultipliedAlpha: renderer.getContextAttributes()?.premultipliedAlpha ?? true });
  pt.renderToCanvasCallback = (target, r, quad) => {
    const auto = r.autoClear;
    r.autoClear = false;
    const s = pt.samples;
    if (s < DENOISE_UNTIL && quad.material.opacity >= 1) {
      const k = 1 - s / DENOISE_UNTIL;
      denoise.uniforms.map.value = target.texture;
      denoise.uniforms.sigma.value = 1.5 + 3.5 * k;
      denoise.uniforms.threshold.value = 0.08 + 0.12 * k;
      denoise.uniforms.opacity.value = 1;
      const m = quad.material;
      quad.material = denoise;
      quad.render(r);
      quad.material = m;
    } else quad.render(r);
    r.autoClear = auto;
  };
  return {
    build(scene, camera) {
      pt.setScene(scene, camera);
    },
    lights() {
      pt.updateLights();
    },
    camera(camera) {
      pt.setCamera(camera);
    },
    sample(draw) {
      fallback = draw;
      pt.renderSample();
    },
    reset() {
      pt.reset();
    },
    scale(value) {
      pt.renderScale = Math.min(1, Math.max(0.25, value));
      pt.reset();
    },
    get samples() {
      return pt.samples;
    },
    get raw() {
      return pt;
    },
    get compiling() {
      return pt.isCompiling;
    },
    sky(top, bottom) {
      if (!gradient.topColor.equals(top) || !gradient.bottomColor.equals(bottom)) {
        gradient.topColor.copy(top);
        gradient.bottomColor.copy(bottom);
        gradient.update();
      }
      return gradient;
    },
    dispose() {
      gradient.dispose();
      denoise.dispose();
      pt.dispose();
    },
  };
}
