import { P5CanvasInstance } from '@p5-wrapper/react';

export const createRandomColorArray = <T extends {}>(p: P5CanvasInstance<T>) =>
  [p.random(255), p.random(255), p.random(255)] as const;

/**
 * Creates a random color, using 0-255 for each channel.
 */
export const createRandomColor = <T extends {}>(p: P5CanvasInstance<T>) =>
  p.color(...createRandomColorArray(p));

/**
 * Different shades of green for a forest
 * in RGB format
 */
export const FOREST_GREENS = {
  forestGreen: [34, 139, 34],
  darkGreen: [0, 100, 0],
  darkOliveGreen: [85, 107, 47],
  oliveDrab: [107, 142, 35],
  mediumSeaGreen: [60, 179, 113],
  seaGreen: [46, 139, 87],
  lightSeaGreen: [32, 178, 170],
  green: [0, 128, 0],
} as const;

export const FOREST_GREENS_ARRAY = Object.values(FOREST_GREENS);

export const KAHU_BLUE = [0, 149, 218] as const;
