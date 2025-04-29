import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@constants/canvas';
import { P5CanvasInstance } from '@p5-wrapper/react';

/**
 * Creates a random color, using 0-255 for each channel.
 *
 * @param p - The p5 instance.
 * @returns A random color.
 */
export const createRandomColor = <T extends {}>(p: P5CanvasInstance<T>) =>
  p.color(p.random(255), p.random(255), p.random(255));

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
