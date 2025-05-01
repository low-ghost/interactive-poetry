import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize } from '@utils/canvas';
import { useState } from 'react';

type SimpleDemoCanvasProps = {
  /** Additional class names for the container. */
  className?: string;
};

const sketch = (p: P5CanvasInstance<{ cursorColor: number }>) => {
  let cursorColor = 100;

  p.setup = () => {
    p.createCanvas(...getCanvasSize(p));
    p.background(100);
  };

  p.windowResized = () => {
    p.resizeCanvas(...getCanvasSize(p));
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
 * SimpleDemoCanvas is a component that renders a simple P5.js demo.
 *
 * @returns A P5.js canvas inside a div.
 */
const SimpleDemoCanvas = ({ className = '' }: SimpleDemoCanvasProps) => {
  const [cursorColor, setCursorColor] = useState(100);

  const handleIncrement = () => {
    setCursorColor((prev) => Math.min(prev + 50, 255));
  };

  const handleDecrement = () => {
    setCursorColor((prev) => Math.max(prev - 50, 0));
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-4 mb-4 self-start">
        <span className="text-sm font-medium">Cursor Color: {cursorColor}</span>
        <button
          onClick={handleIncrement}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Lighter (+50)
        </button>
        <button
          onClick={handleDecrement}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Darker (-50)
        </button>
      </div>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <ReactP5Wrapper sketch={sketch} cursorColor={cursorColor} />
      </div>
    </div>
  );
};

export default SimpleDemoCanvas;
