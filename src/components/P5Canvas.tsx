import { useP5, type Sketch } from '@hooks/useP5';
import { useCallback, useState } from 'react';

type P5CanvasProps = {
  /** The className of the canvas. */
  className?: string;
  /** The width of the canvas. */
  width?: number;
  /** The height of the canvas. */
  height?: number;
};

/**
 * P5Canvas is a component that renders a simple P5.js canvas.
 *
 * @returns A P5.js canvas inside a div.
 */
const P5Canvas = ({ className, width = 800, height = 800 }: P5CanvasProps) => {
  const [bgColor, setBgColor] = useState(100);

  const handleIncrement = () => {
    setBgColor((prev) => Math.min(prev + 50, 255));
  };

  const handleDecrement = () => {
    setBgColor((prev) => Math.max(prev - 50, 0));
  };

  const sketch: Sketch = useCallback(
    (p) => {
      p.setup = () => {
        p.createCanvas(width, height);
        p.background(bgColor);
      };

      p.draw = () => {
        p.fill(255, 0, 0);
        p.noStroke();
        p.ellipse(p.mouseX, p.mouseY, 20, 20);
      };
    },
    [width, height, bgColor],
  );

  const ref = useP5(sketch);

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ marginRight: '10px' }}>Background: {bgColor}</span>
        <button onClick={handleIncrement} style={{ marginRight: '5px' }}>
          Lighter (+50)
        </button>
        <button onClick={handleDecrement}>Darker (-50)</button>
      </div>
      <div ref={ref} className={className} style={{ width, height }} />
    </div>
  );
};

export default P5Canvas;
