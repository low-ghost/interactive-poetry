import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { useMemo, useState } from 'react';

type P5CanvasProps = {
  /** The width of the canvas. */
  width?: number;
  /** The height of the canvas. */
  height?: number;
};

const getSketch =
  (width: number, height: number) =>
  (p: P5CanvasInstance<{ cursorColor: number }>) => {
    let cursorColor = 100;

    p.setup = () => {
      p.createCanvas(width, height);
      p.background(100);
    };

    p.updateWithProps = (props) => {
      if (props.cursorColor) {
        cursorColor = props.cursorColor;
      }
    };

    p.draw = () => {
      if (
        p.mouseX >= 0 &&
        p.mouseY >= 0 &&
        (p.pmouseX !== p.mouseX || p.pmouseY !== p.mouseY)
      ) {
        p.fill(cursorColor, 0, 0);
        p.noStroke();
        p.ellipse(p.mouseX, p.mouseY, 20, 20);
      }
    };
  };

/**
 * P5Canvas is a component that renders a simple P5.js canvas.
 *
 * @returns A P5.js canvas inside a div.
 */
const P5Canvas = ({ height = 800, width = 800 }: P5CanvasProps) => {
  const sketch = useMemo(() => getSketch(width, height), [width, height]);
  const [cursorColor, setCursorColor] = useState(100);

  const handleIncrement = () => {
    setCursorColor((prev) => Math.min(prev + 50, 255));
  };

  const handleDecrement = () => {
    setCursorColor((prev) => Math.max(prev - 50, 0));
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <span style={{ marginRight: '10px' }}>Cursor: {cursorColor}</span>
        <button onClick={handleIncrement} style={{ marginRight: '5px' }}>
          Lighter (+50)
        </button>
        <button onClick={handleDecrement}>Darker (-50)</button>
      </div>
      <ReactP5Wrapper sketch={sketch} cursorColor={cursorColor} />
    </div>
  );
};

export default P5Canvas;
