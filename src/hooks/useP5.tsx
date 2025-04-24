import { p5 } from 'p5js-wrapper';
import { useEffect, useRef } from 'react';

export type Sketch = (p: p5) => void;

/**
 * Custom hook to encapsulate P5.js sketch functionality
 * @param sketch Function that defines the P5 sketch behavior
 * @returns Reference to the canvas container element
 */
export const useP5 = (sketch: Sketch) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    console.log('sketch');
    const myP5 = new p5(sketch, canvasRef.current);

    return () => {
      myP5.remove();
    };
  }, [sketch]);

  return canvasRef;
};
