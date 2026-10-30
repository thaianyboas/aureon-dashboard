// Looks of the 3D view, shared by the main bundle (settings, stage background) and the 3D bundle.

export type Theme = "neon" | "blueprint" | "day" | "night" | "real";

export const THEMES: Theme[] = ["neon", "blueprint", "day", "night", "real"];

/** Background of the 3D stage per look (sky in the middle, ground at the edges), night and day. */
export const STAGE: Record<Theme, { night: [number[], number[]]; day: [number[], number[]] }> = {
  neon: {
    night: [
      [11, 17, 32],
      [7, 11, 20],
    ],
    day: [
      [26, 44, 78],
      [12, 20, 36],
    ],
  },
  blueprint: {
    night: [
      [26, 70, 130],
      [10, 38, 78],
    ],
    day: [
      [34, 86, 150],
      [14, 48, 96],
    ],
  },
  day: {
    night: [
      [214, 224, 238],
      [176, 190, 210],
    ],
    day: [
      [242, 246, 251],
      [205, 216, 230],
    ],
  },
  night: { night: [[8, 13, 25], [4, 7, 14]], day: [[15, 25, 42], [7, 12, 22]] },
  real: { night: [[39, 43, 52], [20, 24, 30]], day: [[195, 205, 215], [135, 147, 158]] },
};
