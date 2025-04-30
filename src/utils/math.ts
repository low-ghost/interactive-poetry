import p5 from 'p5';
import * as R from 'ramda';

// Position type for 2D coordinates
export type Position2D = {
  x: number;
  y: number;
};

/**
 * Generates a gamma-distributed random value
 */
export const generateGammaRandom = (
  p5Instance: p5,
  shape: number,
  scale: number,
): number => {
  // Use a recursive approach for shape < 1
  if (shape < 1) {
    const g = generateGammaRandom(p5Instance, shape + 1, 1);
    return g * Math.pow(p5Instance.random(), 1 / shape) * scale;
  }

  // For shape >= 1, use Marsaglia and Tsang's method
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    const x = p5Instance.randomGaussian();
    const v = Math.pow(1 + c * x, 3);
    if (v <= 0) continue;

    const u = p5Instance.random();
    if (u < 1 - 0.0331 * Math.pow(x, 4)) return d * v * scale;
    if (Math.log(u) < 0.5 * Math.pow(x, 2) + d * (1 - v + Math.log(v)))
      return d * v * scale;
  }
};

/**
 * Maps gamma values to screen coordinates
 */
export const gammaToScreen = (value: number, maxWidth: number): number =>
  Math.min(maxWidth * 0.98, maxWidth * 0.02 + (value / 2.5) * maxWidth * 0.95);

/**
 * Calculates centroid of a set of points
 */
export const calculateCentroid = <T extends Position2D>(
  positions: T[],
): Position2D =>
  positions.length === 0
    ? { x: 0, y: 0 }
    : {
        x: R.mean(R.pluck('x', positions)),
        y: R.mean(R.pluck('y', positions)),
      };

/**
 * Cubic easing out function
 */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
