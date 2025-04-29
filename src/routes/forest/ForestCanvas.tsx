import ControlPanel from '@components/ControlPanel';
import SliderControl from '@components/SliderControl';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { ControlItem } from '@type/controls';
import { getCanvasSize } from '@utils/canvas';
import p5 from 'p5';
import { useState } from 'react';

type ForestCanvasProps = {
  /** Additional class names for the container. */
  className?: string;
};

const DEFAULT_SWAY_AMOUNT = 10;
const DEFAULT_LETTER_DENSITY = 400;

const DEFAULT_POEM = `as if to say
in the forest
and of it
planting
the trees
of my voice
my fingers
duplicating
every part
of me
finally as
beautiful
as breath
every
intersection
of body
alive with
meaning
and significance
lost
running through
branches
find me
where
I look`;

const DEFAULT_ETYMOLOGY = `From Middle
English forest,
from Old French
forest, from
Early Medieval
Latin forestis,
likely from
Frankish *
forhist ("forest,
wooded country")
to Old English
fyrh(þe)
("forested
land"). Old High
German forst
("forest"), Old
Norse fýri-
("pine forest"),
in this sense
mostly displaced
the native
Middle English
word from Old
Englishwudu
("wood, forest,
wooded"), and
Middle English
weld, weald, from Old
English weald
("modern 'wold,
wild, weald'
from Proto-
Germanic *
walþuz ("forest
of trees"), from
Proto-Indo-European
*wal-tus
("forest,
wooded
country"), from
Proto-Germanic *
walþiz. *furrhō
("fir, pine").
from Proto-
Indo-European
*perkwu
("oak"),`;

const sketch = (
  p: P5CanvasInstance<{
    letterDensity: number;
    swayAmount: number;
  }>,
) => {
  const text = DEFAULT_POEM;
  const etymology = DEFAULT_ETYMOLOGY;
  const letterSize = 16;
  let letterDensity = 400;
  let forestTitle = 'fəɹəst';
  let bodoniFont: p5.Font;

  // Sway variables
  let swayAmount = 0;
  let time = 0;
  let xOffset = 0;
  let yOffset = 0;
  let targetXOffset = 0;
  let targetYOffset = 0;

  p.preload = () => {
    bodoniFont = p.loadFont('/interactive-poetry/fonts/bodoni-72-book.ttf');
  };

  p.setup = () => {
    const [width, height] = getCanvasSize(p);
    p.createCanvas(width, height);
    p.textFont(bodoniFont);
    p.textAlign(p.LEFT, p.TOP);
    p.background(255);
  };

  p.updateWithProps = (props) => {
    if (props.letterDensity !== undefined) {
      letterDensity = props.letterDensity;
    }
    if (props.swayAmount !== undefined) {
      swayAmount = props.swayAmount;
    }
  };

  p.draw = () => {
    p.background(255);

    // Update time for animation
    time += 0.01;

    // Update offsets based on mouse position
    if (p.mouseX !== 0 && p.mouseY !== 0) {
      // Calculate mouse influence
      targetXOffset = (p.mouseX - p.width / 2) / 50;
      targetYOffset = (p.mouseY - p.height / 2) / 50;
    }

    // Smoothly interpolate to target offsets
    xOffset = p.lerp(xOffset, targetXOffset, 0.05);
    yOffset = p.lerp(yOffset, targetYOffset, 0.05);

    // Draw the background letter 't' pattern (light but visible)
    p.push();
    p.textSize(18);
    p.fill(0, 0, 0, 30); // Increased opacity to make them more visible

    // Use a deterministic pattern for background t letters with animation
    p.randomSeed(42);
    for (let i = 0; i < letterDensity * 2.2; i++) {
      // Get base position
      const baseX = p.random(p.width);
      const baseY = p.random(p.height);

      // Add wave motion + mouse influence
      const swayX = Math.sin(time + baseY * 0.01) * swayAmount + xOffset;
      const swayY = Math.cos(time + baseX * 0.01) * (swayAmount / 2) + yOffset;

      p.text('t', baseX + swayX, baseY + swayY);
    }
    p.pop();

    // Draw the title "fəɹəst"
    p.push();
    p.textSize(92);
    p.fill(0, 149, 218); // Exact blue from original
    p.text(forestTitle, 40, 88);
    p.pop();
    // Draw the poem text (left side)
    p.push();
    p.textSize(letterSize);
    p.fill(0);
    const lines = text.split('\n');
    let y = p.height * 0.3; // Exact positioning
    for (let line of lines) {
      p.text(line, 113, y);
      y += letterSize * 1.5;
    }
    p.pop();

    // Draw the etymology text (right side) - starting off-screen
    p.push();
    p.textSize(letterSize + 2);
    p.fill(0, 149, 218); // Match title color
    const etymLines = etymology.split('\n');
    // Use the hardcoded y position
    y = -5;
    for (let line of etymLines) {
      p.text(line, p.width - 280, y);
      y += letterSize * 1.75;
    }
    p.pop();
  };

  p.windowResized = () => {
    const [width, height] = getCanvasSize(p);
    p.resizeCanvas(width, height);
  };

  p.mouseMoved = () => {
    // Accelerate the movement based on mouse speed
    const mouseSpeed =
      p.abs(p.mouseX - p.pmouseX) + p.abs(p.mouseY - p.pmouseY);
    targetXOffset = (p.mouseX - p.width / 2) / (50 - mouseSpeed * 0.1);
    targetYOffset = (p.mouseY - p.height / 2) / (50 - mouseSpeed * 0.1);

    // Constrain values to prevent extreme movement
    targetXOffset = p.constrain(targetXOffset, -30, 30);
    targetYOffset = p.constrain(targetYOffset, -30, 30);
  };
};

/**
 * ForestCanvas is a component that renders a typographic forest visualization.
 *
 * @returns A P5.js canvas inside a div.
 */
const ForestCanvas = ({ className = '' }: ForestCanvasProps) => {
  const [letterDensity, setLetterDensity] = useState<number>(
    DEFAULT_LETTER_DENSITY,
  );
  const [swayAmount, setSwayAmount] = useState<number>(DEFAULT_SWAY_AMOUNT);

  // Handle reset for all controls
  const handleReset = () => {
    setLetterDensity(DEFAULT_LETTER_DENSITY);
    setSwayAmount(DEFAULT_SWAY_AMOUNT);
  };

  // Define control items
  const controlItems: ControlItem[] = [
    {
      id: 'letterDensity',
      label: 'Background Density',
      description:
        'Controls how many background "t" letters appear on the canvas.',
      control: (
        <div className="flex items-center gap-2">
          <SliderControl
            value={letterDensity}
            onChange={setLetterDensity}
            min={100}
            max={1000}
            step={50}
          />
          <button
            onClick={() => setLetterDensity(400)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      ),
    },
    {
      id: 'swayAmount',
      label: 'Sway Intensity',
      description: 'Controls how much the background "t" letters sway.',
      control: (
        <div className="flex items-center gap-2">
          <SliderControl
            value={swayAmount}
            onChange={setSwayAmount}
            min={0}
            max={50}
            step={5}
          />
          <button
            onClick={() => setSwayAmount(10)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-4 w-full">
        <ControlPanel controls={controlItems} onReset={handleReset} />
      </div>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <ReactP5Wrapper
          sketch={sketch}
          letterDensity={letterDensity}
          swayAmount={swayAmount}
        />
      </div>
    </div>
  );
};

export default ForestCanvas;
