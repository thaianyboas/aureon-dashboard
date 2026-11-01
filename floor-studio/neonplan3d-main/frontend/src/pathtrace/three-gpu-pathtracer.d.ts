// The parts of three-gpu-pathtracer (MIT) used by the AUREON photo refinement, imported file by file.
declare module "three-gpu-pathtracer/src/core/WebGLPathTracer.js" {
  import type { Camera, Scene, Vector2, WebGLRenderer } from "three";
  export class WebGLPathTracer {
    constructor(renderer: WebGLRenderer);
    renderScale: number;
    readonly tiles: Vector2;
    bounces: number;
    transmissiveBounces: number;
    filterGlossyFactor: number;
    minSamples: number;
    fadeDuration: number;
    renderDelay: number;
    dynamicLowRes: boolean;
    rasterizeScene: boolean;
    readonly textureSize: Vector2;
    rasterizeSceneCallback: (scene: Scene, camera: Camera) => void;
    readonly samples: number;
    readonly isCompiling: boolean;
    setScene(scene: Scene, camera: Camera): unknown;
    setCamera(camera: Camera): void;
    updateLights(): void;
    renderSample(): void;
    reset(): void;
    dispose(): void;
  }
}
declare module "three-gpu-pathtracer/src/textures/GradientEquirectTexture.js" {
  import { Color, DataTexture } from "three";
  export class GradientEquirectTexture extends DataTexture {
    constructor(resolution?: number);
    topColor: Color;
    bottomColor: Color;
    update(): void;
  }
}
