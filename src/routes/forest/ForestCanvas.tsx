import ControlPanel from '@components/ControlPanel';
import ResetButton from '@components/ResetButton';
import SliderControl from '@components/SliderControl';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { ControlItem } from '@type/controls';
import { getCanvasSize } from '@utils/canvas';
import { FOREST_GREENS_ARRAY, KAHU_BLUE } from '@utils/color';
import p5 from 'p5';
import { useState } from 'react';
import { ETYMOLOGY_LINES, FOREST_TITLE, POEM_LINES, POEM_WORDS } from './poem';

type ForestCanvasProps = {
  /** Additional class names for the container. */
  className?: string;
};

type Position2D = {
  x: number;
  y: number;
};

type TreePosition = Position2D & {
  baseX: number;
  baseY: number;
  fontSize: number;
  opacity: number;
  letterScale: number;
};

const WORD_DISPLAY_DURATION = 6000; // milliseconds to display words
const GATHER_ANIMATION_DURATION = 1200; // milliseconds for gathering animation

const DEFAULT_SWAY_AMOUNT = 10;
const DEFAULT_LETTER_DENSITY = 400;
const DISTRIBUTION_MODE = 'gamma'; // 'random', 'gamma', 'gaussian'
const DEFAULT_GAMMA_SHAPE = 0.8; // Shape parameter c (from research)
const DEFAULT_GAMMA_SCALE = 0.033; // Scale parameter b (from research)
const LETTER_SIZE = 16;

type P5ForestInstance = P5CanvasInstance<{
  letterDensity: number;
  swayAmount: number;
  distributionMode?: string;
  gammaShape?: number;
  gammaScale?: number;
}>;

const sketch = (p: P5ForestInstance) => {
  const state = {
    letterDensity: DEFAULT_LETTER_DENSITY,
    swayAmount: DEFAULT_SWAY_AMOUNT,
    distributionMode: DISTRIBUTION_MODE,
    gammaShape: DEFAULT_GAMMA_SHAPE,
    gammaScale: DEFAULT_GAMMA_SCALE,
  };
  let bodoniFont: p5.Font;

  let currentWordIndex = 0;
  type ReplacedWord = {
    x: number;
    y: number;
    word: string;
    animationStart: number;
    colorIndex: number;
    sourcePositions: Position2D[];
  };
  const replacedWords: ReplacedWord[] = [];
  // Track which t positions are replaced
  const replacedPositions: Position2D[] = [];

  // Sway variables
  let time = 0;
  let xOffset = 0;
  let yOffset = 0;
  let targetXOffset = 0;
  let targetYOffset = 0;
  let lastFrameTime = 0; // To calculate delta time for smoother animation

  let currentGreenIndex = 0;

  /**
   * Generates a gamma-distributed random value using the acceptance-rejection method.
   * @param shape - The shape parameter of the gamma distribution
   * @param scale - The scale parameter of the gamma distribution
   * @returns A random value from a gamma distribution with the specified parameters
   */
  const generateGammaRandom = (shape: number, scale: number): number => {
    // For shape >= 1, we use Marsaglia and Tsang's method
    if (shape >= 1) {
      const d = shape - 1 / 3;
      const c = 1 / Math.sqrt(9 * d);
      while (true) {
        const x = p.randomGaussian();
        let v = 1 + c * x;
        if (v <= 0) continue;
        v = v * v * v;
        const u = p.random();
        if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v)))
          return d * v * scale;
      }
    } else {
      // For shape < 1, we use a different approach
      const g = generateGammaRandom(shape + 1, 1);
      const u = p.random();
      return g * Math.pow(u, 1 / shape) * scale;
    }
  };

  /**
   * Converts a value from gamma distribution to screen position.
   * @param value - The gamma distribution value to convert
   * @param maxWidth - The maximum width of the screen
   * @returns The mapped screen coordinate
   */
  const gammaToScreen = (value: number, maxWidth: number): number =>
    // Map gamma values to screen coordinates using a wider distribution
    Math.min(
      maxWidth * 0.98,
      maxWidth * 0.02 + (value / 2.5) * maxWidth * 0.95,
    );
  /**
   * Calculates tree ('t' letter) positions based on the selected distribution mode.
   * @param seed - Random seed for deterministic pattern generation (default: 42)
   * @returns Array of tree positions with formatting information
   */
  const calculateTreePositions = (seed: number = 42): TreePosition[] => {
    const positions: TreePosition[] = [];
    const [width, height] = [p.width, p.height];
    const centerX = width / 2;
    const centerY = height / 2;

    // Use a deterministic pattern for t letters
    p.randomSeed(seed);

    for (let i = 0; i < state.letterDensity * 2.2; i++) {
      let baseX, baseY;
      let letterScale = 1.0;

      // Generate positions based on selected distribution
      if (state.distributionMode === 'gamma') {
        const seed1 = i * 10;
        const seed2 = i * 20 + 500;
        const randomOffset = p.noise(seed1, time * 0.1) * 0.4 + 0.8;
        const gammaX = generateGammaRandom(
          state.gammaShape * randomOffset,
          state.gammaScale,
        );
        const gammaY = generateGammaRandom(
          state.gammaShape * randomOffset,
          state.gammaScale * 1.1,
        );

        const xNoiseFactor = p.noise(seed1 * 0.3, time * 0.03) * width * 0.9;
        const yNoiseFactor = p.noise(seed2 * 0.3, time * 0.03) * height * 0.9;

        baseX = gammaToScreen(gammaX, width) + xNoiseFactor;
        baseY = gammaToScreen(gammaY, height) + yNoiseFactor;

        // Environmental variability via Perlin noise
        const envFactor = p.noise(baseX * 0.005, baseY * 0.005, i * 0.0001);

        // Create clustering effect with attractors
        const numAttractors = 5;
        let attraction = 0;
        let attractX = 0;
        let attractY = 0;

        for (let a = 0; a < numAttractors; a++) {
          const attractorSeed1 = a * 1000;
          const attractorSeed2 = a * 2000;
          const aX = p.noise(attractorSeed1, time * 0.01) * width;
          const aY = p.noise(attractorSeed2, time * 0.01) * height;
          const dist = p.dist(baseX, baseY, aX, aY);
          const influence = 1 / (1 + dist * 0.01);
          attraction += influence;
          attractX += aX * influence;
          attractY += aY * influence;
        }

        if (attraction > 0) {
          attractX /= attraction;
          attractY /= attraction;
          baseX = p.lerp(baseX, attractX, 0.3 * envFactor);
          baseY = p.lerp(baseY, attractY, 0.3 * envFactor);
        }

        baseX += p.noise(seed1 * 0.5, time * 0.02) * width * 0.3 - width * 0.15;
        baseY +=
          p.noise(seed2 * 0.5, time * 0.02) * height * 0.3 - height * 0.15;

        baseX = p.constrain(baseX, 5, width - 15);
        baseY = p.constrain(baseY, 5, height - 15);

        // Store gamma value for letter sizing
        const gammaValue = p.noise(seed1 * 0.7) * 1.5;
        letterScale = 0.8 + Math.min(gammaValue, 1.5) / 3;
      } else if (state.distributionMode === 'gaussian') {
        baseX = p.randomGaussian(centerX, width * 0.2);
        baseY = p.randomGaussian(centerY, height * 0.2);
      } else {
        baseX = p.random(width);
        baseY = p.random(height);
      }

      // Add wave motion + mouse influence
      const swayX = Math.sin(time + baseY * 0.01) * state.swayAmount + xOffset;
      const swayY =
        Math.cos(time + baseX * 0.01) * (state.swayAmount / 2) + yOffset;

      // Final position of the 't'
      const finalX = baseX + swayX;
      const finalY = baseY + swayY;

      // Determine text size based on distribution
      let fontSize = 18;
      if (state.distributionMode === 'gamma') {
        fontSize = Math.floor(18 * letterScale);
      } else if (state.distributionMode === 'gaussian') {
        fontSize = 18;
      } else {
        const sizeVar = p.noise(i * 0.5, 9999) * 0.4 + 0.8;
        fontSize = 18 * sizeVar;
      }

      // Vary opacity based on distance
      const dist = p.dist(baseX, baseY, centerX, centerY);
      const normalizedDist = p.constrain(dist / Math.max(width, height), 0, 1);
      const opacity = p.map(normalizedDist, 0, 0.5, 60, 20);

      positions.push({
        x: finalX,
        y: finalY,
        baseX,
        baseY,
        fontSize,
        opacity,
        letterScale,
      });
    }

    return positions;
  };

  /**
   * Draws the background 't' letters that represent trees in the forest.
   * Uses the shared calculation function to determine positions.
   */
  const drawBackgroundLetters = () => {
    p.push();
    p.textSize(18);
    p.fill(0, 0, 0, 30);

    // Get all tree positions
    const positions = calculateTreePositions();

    // Draw each tree that hasn't been replaced
    for (const pos of positions) {
      // Check if this position has been replaced - use a more reliable comparison
      const isReplaced = replacedPositions.some(
        (rp) => p.dist(pos.baseX, pos.baseY, rp.x, rp.y) < 15, // Increased tolerance and using baseX/baseY
      );

      if (!isReplaced) {
        p.fill(0, 0, 0, pos.opacity);
        p.textSize(pos.fontSize);
        p.text('t', pos.x, pos.y);
      }
    }

    p.pop();
  };

  /**
   * Draws replaced words and animating t's
   */
  const drawReplacedWords = (
    p: P5ForestInstance,
    replacedWords: ReplacedWord[],
  ) => {
    p.push();
    const currentMillis = p.millis();

    // Filter out expired words
    const activeWords = replacedWords.filter(
      (word) => currentMillis - word.animationStart <= WORD_DISPLAY_DURATION,
    );

    // Update the original array with only active words
    replacedWords.length = 0;
    replacedWords.push(...activeWords);

    // Draw each active word
    activeWords.forEach((rw) => {
      // Calculate age of the replacement
      const age = currentMillis - rw.animationStart;

      // Calculate animation progress and opacity
      const gatherProgress = Math.min(1, age / GATHER_ANIMATION_DURATION);
      const easedProgress = 1 - Math.pow(1 - gatherProgress, 3); // Cubic easing out

      // Calculate opacity based on age
      let opacity = 255;
      if (age > WORD_DISPLAY_DURATION - 1000) {
        // Fade out in the last second
        opacity = p.map(
          age,
          WORD_DISPLAY_DURATION - 1000,
          WORD_DISPLAY_DURATION,
          255,
          0,
        );
      } else if (age < GATHER_ANIMATION_DURATION) {
        // Fade in during gathering
        opacity = p.map(age, 0, GATHER_ANIMATION_DURATION, 150, 255);
      }

      // Get the color for this word
      const targetColor = FOREST_GREENS_ARRAY[rw.colorIndex];
      const wordLetters = rw.word.split('');
      const sourcePositions = rw.sourcePositions;

      // Calculate word layout
      const letterSpacing = 10;
      const wordWidth = wordLetters.length * letterSpacing;
      const startX = rw.x - wordWidth / 2;

      // Draw each letter using zipWith-like functionality
      const letterCount = Math.min(sourcePositions.length, wordLetters.length);
      const letterIndices = Array.from({ length: letterCount }, (_, j) => j);

      letterIndices.forEach((j) => {
        const sourcePos = sourcePositions[j];
        const targetX = startX + j * letterSpacing;
        const targetY = rw.y;

        // Interpolate position, color and opacity based on animation phase
        if (gatherProgress < 1) {
          // During gather animation
          const x = p.lerp(sourcePos.x, targetX, easedProgress);
          const y = p.lerp(sourcePos.y, targetY, easedProgress);

          // Interpolate color from black to target color
          const r = p.lerp(0, targetColor[0], easedProgress);
          const g = p.lerp(0, targetColor[1], easedProgress);
          const b = p.lerp(0, targetColor[2], easedProgress);

          // Interpolate between 't' and actual letter with opacity
          const letterOpacity = p.map(easedProgress, 0.5, 0.8, 0, opacity);
          const tOpacity = p.map(easedProgress, 0.5, 0.8, opacity, 0);

          // Draw the fading 't'
          if (tOpacity > 0) {
            p.fill(0, 0, 0, tOpacity);
            p.textSize(18);
            p.text('t', x, y);
          }

          // Draw the appearing letter
          if (letterOpacity > 0) {
            p.fill(r, g, b, letterOpacity);
            p.textSize(18);
            p.text(wordLetters[j], x, y);
          }
        } else {
          // After animation is complete
          const x = p.lerp(sourcePos.x, targetX, 1); // Use final position
          const y = p.lerp(sourcePos.y, targetY, 1);

          // Draw with final color
          p.fill(targetColor[0], targetColor[1], targetColor[2], opacity);
          p.textSize(18);
          p.text(wordLetters[j], x, y);
        }
      });
    });
    p.pop();
  };

  /**
   * Draws the title "fəɹəst"
   */
  const drawTitle = (p: P5ForestInstance) => {
    p.push();
    p.textSize(92);
    p.fill(...KAHU_BLUE);
    p.text(FOREST_TITLE, 40, 88);
    p.pop();
  };

  /**
   * Draws the poem text (left side)
   */
  const drawPoem = (p: P5ForestInstance) => {
    p.push();
    p.textSize(LETTER_SIZE);
    p.fill(0);

    const startY = p.height * 0.3;
    const lineSpacing = LETTER_SIZE * 1.4;

    POEM_LINES.forEach((line, index) => {
      const yPosition = startY + index * lineSpacing;
      p.text(line, 114, yPosition);
    });

    p.pop();
  };

  /**
   * Draws the etymology text (right side)
   */
  const drawEtymology = (p: P5ForestInstance) => {
    p.push();
    p.textSize(LETTER_SIZE);
    p.fill(...KAHU_BLUE);

    const startY = -5; // off-screen
    const lineSpacing = LETTER_SIZE * 1.21;

    ETYMOLOGY_LINES.forEach((line, index) => {
      const yPosition = Math.floor(startY + index * lineSpacing) + 0.5;
      p.text(line, p.width - 280, yPosition);
    });

    p.pop();
  };

  p.preload = () => {
    bodoniFont = p.loadFont('/interactive-poetry/fonts/bodoni-72-book.ttf');
  };

  p.setup = () => {
    const [width, height] = getCanvasSize(p);
    p.createCanvas(width, height);
    p.textFont(bodoniFont);
    p.textAlign(p.LEFT, p.TOP);
    p.background(255);
    // Improve text rendering quality
    p.pixelDensity(2);
  };

  p.updateWithProps = (props) => {
    if (props.letterDensity !== undefined) {
      state.letterDensity = props.letterDensity;
    }
    if (props.swayAmount !== undefined) {
      state.swayAmount = props.swayAmount;
    }
    if (props.distributionMode !== undefined) {
      state.distributionMode = props.distributionMode;
    }
    if (props.gammaShape !== undefined) {
      state.gammaShape = props.gammaShape;
    }
    if (props.gammaScale !== undefined) {
      state.gammaScale = props.gammaScale;
    }
  };

  /**
   * Calculates the influence of mouse position and movement on the tree sway effect.
   * @param mouseX - Current X position of the mouse
   * @param mouseY - Current Y position of the mouse
   * @param speed - Optional speed of mouse movement to create stronger effects when moving fast
   */
  const updateMouseInfluence = (
    mouseX: number,
    mouseY: number,
    speed: number = 0,
  ) => {
    if (mouseX !== 0 && mouseY !== 0) {
      // Calculate divisor based on speed - faster movement creates stronger effect
      const divisor = 50 - speed * 0.1;

      // Calculate target offsets with constraints
      targetXOffset = (mouseX - p.width / 2) / divisor;
      targetYOffset = (mouseY - p.height / 2) / divisor;

      // Constrain values to prevent extreme movement
      targetXOffset = p.constrain(targetXOffset, -30, 30);
      targetYOffset = p.constrain(targetYOffset, -30, 30);
    }
  };

  p.draw = () => {
    p.background(255);

    // Calculate delta time for smoother animation
    const currentTime = p.millis() * 0.001; // Convert to seconds
    const deltaTime = Math.min(0.05, currentTime - lastFrameTime); // Cap to prevent jumps
    lastFrameTime = currentTime;

    // Increment time using delta time for frame-rate independent animation.
    // The multiplier (0.5) slows down the animation for a gentler effect.
    time += deltaTime * 0.5;

    // Update offsets based on mouse position with smoother transitions
    updateMouseInfluence(p.mouseX, p.mouseY);

    // Smoothly interpolate to target offsets with deltaTime
    const lerpFactor = 0.05 * (deltaTime * 20); // Adjust lerp factor based on frame rate
    xOffset = p.lerp(xOffset, targetXOffset, lerpFactor);
    yOffset = p.lerp(yOffset, targetYOffset, lerpFactor);

    drawBackgroundLetters();
    drawReplacedWords(p, replacedWords);
    drawTitle(p);
    drawPoem(p);
    drawEtymology(p);
  };

  p.windowResized = () => {
    const [width, height] = getCanvasSize(p);
    p.resizeCanvas(width, height);
  };

  p.mouseMoved = () => {
    // Calculate mouse movement speed and use it to accelerate the tree sway effect.
    // Faster mouse movements create stronger effects.
    const mouseSpeed =
      p.abs(p.mouseX - p.pmouseX) + p.abs(p.mouseY - p.pmouseY);
    updateMouseInfluence(p.mouseX, p.mouseY, mouseSpeed);
  };

  p.mouseClicked = () => {
    // Only process clicks within canvas
    if (
      p.mouseX < 0 ||
      p.mouseX > p.width ||
      p.mouseY < 0 ||
      p.mouseY > p.height
    ) {
      return;
    }

    const word = POEM_WORDS[currentWordIndex];
    currentWordIndex = (currentWordIndex + 1) % POEM_WORDS.length;

    // Find nearby t's
    const clickPos = { x: p.mouseX, y: p.mouseY };

    // Get all available t positions using the shared calculation function
    const allPositions = calculateTreePositions();

    // Filter to only positions that haven't been replaced yet
    const availablePositions = allPositions
      .filter(
        (pos) =>
          !replacedPositions.some(
            (rp) => p.dist(pos.baseX, pos.baseY, rp.x, rp.y) < 15, // Use the base positions for comparison
          ),
      )
      .map((pos) => ({
        ...pos,
        dist: p.dist(clickPos.x, clickPos.y, pos.x, pos.y),
      }));

    // Sort all positions by distance to click
    availablePositions.sort((a, b) => a.dist - b.dist);

    // Get the required number of positions for the word
    const letterCount = word.length;
    const positionsToReplace = availablePositions.slice(0, letterCount);

    if (positionsToReplace.length > 0) {
      // Store the original positions of the t's for animation
      const sourcePositions = positionsToReplace.map((pos) => ({
        x: pos.x,
        y: pos.y,
      }));

      // Calculate centroid (average position) of the selected positions
      const centroid = calculateCentroid(positionsToReplace);

      // Add positions to the replaced list
      for (const pos of positionsToReplace) {
        replacedPositions.push({
          x: pos.baseX,
          y: pos.baseY,
        });
      }

      // Get the next color and increment the index
      const colorIndex = currentGreenIndex;
      currentGreenIndex = (currentGreenIndex + 1) % FOREST_GREENS_ARRAY.length;

      // Add the replacement word with source positions for animation
      replacedWords.push({
        ...centroid,
        word,
        animationStart: p.millis(),
        colorIndex,
        sourcePositions,
      });
    }

    return false; // Prevent default behavior
  };

  /**
   * Calculates the centroid (average position) of a set of points.
   * @param positions - Array of positions to average
   * @returns The centroid position with x and y coordinates
   */
  const calculateCentroid = (positions: Position2D[]): Position2D => {
    if (positions.length === 0) return { x: 0, y: 0 };

    const { sumX, sumY } = positions.reduce(
      (acc, pos) => ({
        sumX: acc.sumX + pos.x,
        sumY: acc.sumY + pos.y,
      }),
      { sumX: 0, sumY: 0 },
    );

    return { x: sumX / positions.length, y: sumY / positions.length };
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
  const [distributionMode, setDistributionMode] =
    useState<string>(DISTRIBUTION_MODE);
  const [gammaShape, setGammaShape] = useState<number>(DEFAULT_GAMMA_SHAPE);
  const [gammaScale, setGammaScale] = useState<number>(DEFAULT_GAMMA_SCALE);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  // Handle reset for all controls
  const handleReset = () => {
    setLetterDensity(DEFAULT_LETTER_DENSITY);
    setSwayAmount(DEFAULT_SWAY_AMOUNT);
    setDistributionMode(DISTRIBUTION_MODE);
    setGammaShape(DEFAULT_GAMMA_SHAPE);
    setGammaScale(DEFAULT_GAMMA_SCALE);
  };

  // Define control items
  const controlItems: ControlItem[] = [
    {
      id: 'letterDensity',
      label: 'Tree Density',
      description:
        'Controls how many "t" letters appear on the canvas, similar to forest density.',
      control: (
        <>
          <SliderControl
            value={letterDensity}
            onChange={setLetterDensity}
            min={100}
            max={1000}
            step={50}
          />
          <ResetButton onClick={() => setLetterDensity(400)} />
        </>
      ),
    },
    {
      id: 'swayAmount',
      label: 'Wind Intensity',
      description: 'Controls how much the trees sway, like wind in a forest.',
      control: (
        <>
          <SliderControl
            value={swayAmount}
            onChange={setSwayAmount}
            min={0}
            max={50}
            step={5}
          />
          <ResetButton onClick={() => setSwayAmount(10)} />
        </>
      ),
    },
    {
      id: 'distributionMode',
      label: 'Forest Type',
      description: 'Select distribution pattern for different forest types.',
      control: (
        <select
          value={distributionMode}
          onChange={(e) => setDistributionMode(e.target.value)}
          className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
        >
          <option value="random">Random (Scattered)</option>
          <option value="gamma">Natural Forest (Gamma)</option>
          <option value="gaussian">Plantation (Gaussian)</option>
        </select>
      ),
    },
    {
      id: 'gammaShape',
      label: 'Age Structure',
      description: 'Controls tree diameter distribution shape (c parameter).',
      control: (
        <>
          <SliderControl
            value={gammaShape}
            onChange={setGammaShape}
            min={0.5}
            max={5}
            step={0.1}
          />
          <ResetButton onClick={() => setGammaShape(DEFAULT_GAMMA_SHAPE)} />
        </>
      ),
    },
    {
      id: 'gammaScale',
      label: 'Size Variability',
      description:
        'Controls the scale of tree size distribution (b parameter).',
      control: (
        <>
          <SliderControl
            value={gammaScale}
            onChange={setGammaScale}
            min={0.01}
            max={0.1}
            step={0.001}
          />
          <ResetButton onClick={() => setGammaScale(DEFAULT_GAMMA_SCALE)} />
        </>
      ),
    },
  ];

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="mb-4 w-full">
        <ControlPanel controls={controlItems} onReset={handleReset} />

        <div className="mt-3 ml-2">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="text-sm underline text-blue-600 hover:text-blue-800"
          >
            {showFormula ? 'Hide Scientific Model' : 'Show Scientific Model'}
          </button>

          {showFormula && (
            <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">
                Gamma Distribution Model
              </h3>
              <p className="text-sm mb-2">
                This visualization uses the gamma distribution to model natural
                forest spatial patterns and tree size distribution:
              </p>
              <div className="text-center py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <span className="font-mono">
                  f(x; c, b) = (x^(c-1) * e^(-x/b)) / (b^c * Γ(c))
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>c = {gammaShape.toFixed(1)}</strong> (shape parameter)
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Controls the age-size structure distribution
                  </div>
                </div>
                <div>
                  <strong>b = {gammaScale.toFixed(3)}</strong> (scale parameter)
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Controls distribution spread
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Values c≈0.8, b≈0.033 are typical in natural old-growth forests
                based on ecological research.
              </p>

              <h4 className="text-sm font-medium mt-3 mb-1">
                Scientific Sources:
              </h4>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>
                  <a
                    href="https://doi.org/10.1111/j.1365-2745.2009.01583.x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Enquist, B.J., West, G.B. & Brown, J.H. (2009). Extensions
                    and evaluations of a general quantitative theory of forest
                    structure and dynamics.{' '}
                    <em>Proceedings of the National Academy of Sciences</em>,
                    106(17), 7046-7051.
                  </a>
                </li>
                <li>
                  <a
                    href="https://doi.org/10.1073/pnas.0901970106"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Muller-Landau, H.C. et al. (2006). Testing metabolic ecology
                    theory for allometric scaling of tree size, growth and
                    mortality in tropical forests. <em>Ecology Letters</em>,
                    9(5), 575-588.
                  </a>
                </li>
                <li>
                  <a
                    href="https://doi.org/10.1126/science.1066854"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    West, G.B., Enquist, B.J. & Brown, J.H. (2009). A general
                    quantitative theory of forest structure and dynamics.{' '}
                    <em>PNAS</em>, 106(17), 7040-7045.
                  </a>
                </li>
                <li>
                  <a
                    href="https://doi.org/10.1111/j.1461-0248.2006.00904.x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Coomes, D.A. & Allen, R.B. (2007). Mortality and tree-size
                    distributions in natural mixed-age forests.{' '}
                    <em>Journal of Ecology</em>, 95(1), 27-40.
                  </a>
                </li>
                <li>
                  <a
                    href="https://doi.org/10.1145/358407.358414"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Marsaglia, G. & Tsang, W.W. (2000). A simple method for
                    generating gamma variables.{' '}
                    <em>ACM Transactions on Mathematical Software</em>, 26(3),
                    363-372.
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <ReactP5Wrapper
          sketch={sketch}
          letterDensity={letterDensity}
          swayAmount={swayAmount}
          distributionMode={distributionMode}
          gammaShape={gammaShape}
          gammaScale={gammaScale}
        />
      </div>
    </div>
  );
};

export default ForestCanvas;
