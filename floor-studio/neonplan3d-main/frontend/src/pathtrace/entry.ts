// AUREON: the Real look's photo refinement (path tracing), a bundle of its own. It loads only when the Real look runs
// on the "High" quality and the view rests; three.js is lent by the 3D bundle (see aureon-three-lend.ts and build.mjs),
// so the scene's own objects, materials and renderer are used as they are.
// three-gpu-pathtracer and three-mesh-bvh: MIT licence (Garrett Johnson), see THIRD_PARTY_PATHTRACE.txt next to the bundle.
import { WebGLPathTracer } from "three-gpu-pathtracer/src/core/WebGLPathTracer.js";
import { GradientEquirectTexture } from "three-gpu-pathtracer/src/textures/GradientEquirectTexture.js";
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
  sky(top: Color, bottom: Color): Texture;
  dispose(): void;
}

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
      pt.dispose();
    },
  };
}
