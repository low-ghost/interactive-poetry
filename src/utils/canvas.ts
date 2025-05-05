import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@constants/canvas';
import { P5CanvasInstance } from '@p5-wrapper/react';

/**
 * Get the canvas size based on the window width if mobile, otherwise use the default canvas size.
 *
 * @param p - The p5 instance.
 * @returns The canvas size.
 */
export const getCanvasSize = <T extends {}>(
  p: P5CanvasInstance<T>,
): [number, number] =>
  p.windowWidth < 1020
    ? p.windowWidth > 768
      ? [p.windowWidth - 162, CANVAS_HEIGHT] // subtract sidebar + padding
      : [p.windowWidth - 80, CANVAS_HEIGHT] // mobile, so just subtract padding
    : [CANVAS_WIDTH, CANVAS_HEIGHT];

/**
 * Pixel density value used across the application
 */
const PIXEL_DENSITY = 2;

/**
 * Improve text rendering for the canvas by setting the pixel density,
 * removing the stroke, and setting the text rendering to geometric precision.
 *
 * @param p - The p5 instance.
 */
export const improveTextRendering = <T extends {}>(p: P5CanvasInstance<T>) => {
  p.pixelDensity(PIXEL_DENSITY);
  p.noStroke();

  // Set higher quality for text rendering
  if (p.drawingContext) {
    // Set canvas context properties for better text
    const ctx = p.drawingContext as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRendering = 'geometricPrecision';
  }
};
