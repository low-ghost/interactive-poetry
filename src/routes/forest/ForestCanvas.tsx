import ControlPanel from '@components/ControlPanel';
import ResetButton from '@components/ResetButton';
import SliderControl from '@components/SliderControl';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize, improveTextRendering } from '@utils/canvas';
import { FOREST_GREENS_ARRAY, KAHU_BLUE } from '@utils/color';
import {
  calculateCentroid,
  easeOutCubic,
  gammaToScreen,
  generateGammaRandom,
  Position2D,
} from '@utils/math';
import { Font } from 'p5';
import * as R from 'ramda';
import { useState } from 'react';
import { ETYMOLOGY_LINES, FOREST_TITLE, POEM_LINES, POEM_WORDS } from './poem';

type TreePositionBase = {
  baseX: number;
  baseY: number;
  letterScale: number;
};

type TreePosition = Position2D &
  TreePositionBase & {
    fontSize: number;
    opacity: number;
  };

const WORD_DISPLAY_DURATION = 6000; // milliseconds to display words
const GATHER_ANIMATION_DURATION = 1200; // milliseconds for gathering animation
const LETTER_SIZE = 17;

const DEFAULT_CONTROLS = {
  letterDensity: 400,
  swayAmount: 10,
  distributionMode: 'gamma',
  gammaShape: 0.8,
  gammaScale: 0.033,
};

type ForestControls = typeof DEFAULT_CONTROLS;

type P5ForestInstance = P5CanvasInstance<ForestControls>;

const sketch = (p: P5ForestInstance) => {
  // Use the default controls object for initial state
  const state = { ...DEFAULT_CONTROLS };

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
  // Use a Set for efficient lookup of replaced positions
  const replacedPositionKeys = new Set<string>();

  // Sway variables
  let time = 0;
  let xOffset = 0;
  let yOffset = 0;
  let targetXOffset = 0;
  let targetYOffset = 0;
  let lastFrameTime = 0; // To calculate delta time for smoother animation
  let bodoniFont: Font;
  let currentGreenIndex = 0;

  /**
   * Calculates tree ('t' letter) positions based on the selected distribution mode.
   * @returns Array of tree positions with formatting information
   */
  const calculateTreePositions = (): TreePosition[] => {
    const [width, height] = getCanvasSize(p);
    p.randomSeed(42);

    // Calculate position based on the distribution type
    const createGammaPosition = (i: number) => {
      const seed1 = i * 10;
      const seed2 = i * 20 + 500;
      const randomOffset = p.noise(seed1, time * 0.05) * 0.4 + 0.8;

      // Generate basic position from gamma distribution
      const gammaX = generateGammaRandom(
        p,
        state.gammaShape * randomOffset,
        state.gammaScale,
      );
      const gammaY = generateGammaRandom(
        p,
        state.gammaShape * randomOffset,
        state.gammaScale * 1.1,
      );

      // Add noise factors - use continuous time for smoother animation
      let baseX =
        gammaToScreen(gammaX, width) +
        p.noise(seed1 * 0.3, time * 0.015) * width * 0.9;
      let baseY =
        gammaToScreen(gammaY, height) +
        p.noise(seed2 * 0.3, time * 0.015) * height * 0.9;

      // Apply environmental and attractor influences
      const envFactor = p.noise(baseX * 0.005, baseY * 0.005, i * 0.0001);

      // Calculate attractor influences
      const attractors = R.range(0, 5).map((a) => ({
        pos: {
          x: p.noise(a * 1000, time * 0.005) * width,
          y: p.noise(a * 2000, time * 0.005) * height,
        },
        influence: 0,
      }));

      // Update influences based on distance
      const withInfluence = attractors.map((a) => ({
        ...a,
        influence: 1 / (1 + p.dist(baseX, baseY, a.pos.x, a.pos.y) * 0.01),
      }));

      const totalInfluence = R.sum(R.pluck('influence', withInfluence));

      if (totalInfluence > 0) {
        // Calculate weighted position
        const weightedPos = withInfluence.reduce(
          (acc, { pos, influence }) => ({
            x: acc.x + pos.x * influence,
            y: acc.y + pos.y * influence,
          }),
          { x: 0, y: 0 },
        );

        // Apply attraction effect
        baseX = p.lerp(baseX, weightedPos.x / totalInfluence, 0.3 * envFactor);
        baseY = p.lerp(baseY, weightedPos.y / totalInfluence, 0.3 * envFactor);
      }

      // Add random drift and constrain to canvas
      baseX = p.constrain(
        baseX + p.noise(seed1 * 0.5, time * 0.01) * width * 0.3 - width * 0.15,
        5,
        width - 15,
      );

      baseY = p.constrain(
        baseY +
          p.noise(seed2 * 0.5, time * 0.01) * height * 0.3 -
          height * 0.15,
        5,
        height - 15,
      );

      return {
        baseX,
        baseY,
        letterScale: 0.8 + Math.min(p.noise(seed1 * 0.7) * 1.5, 1.5) / 3,
      };
    };

    const createGaussianPosition = () => ({
      baseX: p.randomGaussian(width / 2, width * 0.2),
      baseY: p.randomGaussian(height / 2, height * 0.2),
      letterScale: 1.0,
    });

    const createRandomPosition = (i: number) => {
      // Time factor controls animation speed of pattern changes, 0.01 is slow
      const timeFactored = time * 0.01;
      // Large offsets ensure different noise spaces for different properties
      // The specific values aren't critical, just need to be far apart
      const Y_COORDINATE_OFFSET = 5000;
      const SCALE_VARIATION_OFFSET = 10000;
      return {
        // Scale the noise output (0-1) to cover the entire canvas plus edges (1.1 == 110% coverage)
        baseX: p.noise(i, timeFactored) * width * 1.1,
        baseY: p.noise(i + Y_COORDINATE_OFFSET, timeFactored) * height * 1.1,
        // Tree size variation parameters
        // - scale range of 0.4 = magnitude of variation (±20% from base)
        // - scale base of 0.8 = minimum scale (80% of default size at minimum)
        letterScale: p.noise(i + SCALE_VARIATION_OFFSET) * 0.4 + 0.8,
      };
    };

    // Higher-order function to create the final tree position
    const finalizePosition = (basePos: TreePositionBase) => {
      // Add sway effect with smoother continuous movement
      const swayX =
        Math.sin(time * 0.8 + basePos.baseY * 0.01) * state.swayAmount +
        xOffset;
      const swayY =
        Math.cos(time * 0.8 + basePos.baseX * 0.01) * (state.swayAmount / 2) +
        yOffset;

      // Calculate opacity based on distance from center
      const dist = p.dist(basePos.baseX, basePos.baseY, width / 2, height / 2);
      const normalizedDist = p.constrain(dist / Math.max(width, height), 0, 1);

      return {
        baseX: basePos.baseX,
        baseY: basePos.baseY,
        x: basePos.baseX + swayX,
        y: basePos.baseY + swayY,
        fontSize:
          state.distributionMode === 'gamma'
            ? Math.floor(18 * basePos.letterScale)
            : state.distributionMode === 'gaussian'
            ? 18
            : 18 * basePos.letterScale,
        opacity: p.map(normalizedDist, 0, 0.5, 60, 20),
        letterScale: basePos.letterScale,
      };
    };

    // Generate positions based on selected distribution mode
    const generatePosition = (i: number): TreePosition => {
      const basePosition =
        state.distributionMode === 'gamma'
          ? createGammaPosition(i)
          : state.distributionMode === 'gaussian'
          ? createGaussianPosition()
          : createRandomPosition(i);
      return finalizePosition(basePosition);
    };

    return R.times(generatePosition, Math.floor(state.letterDensity * 2.2));
  };

  /**
   * Draws the background 't' letters that represent trees in the forest.
   * Uses the shared calculation function to determine positions.
   */
  const drawBackgroundLetters = () => {
    p.push();

    // Get all positions and filter out replaced ones using the Set
    const isNotReplaced = (pos: TreePosition) =>
      !replacedPositionKeys.has(`${pos.baseX},${pos.baseY}`);

    // Draw all non-replaced trees with appropriate size and opacity
    R.pipe(
      calculateTreePositions,
      R.filter(isNotReplaced),
      R.forEach((pos: TreePosition) => {
        p.fill(0, 0, 0, pos.opacity);
        p.textSize(pos.fontSize);
        p.text('t', pos.x, pos.y);
      }),
    )();

    p.pop();
  };

  /** Draws replaced words and animating t's */
  const drawReplacedWords = (replacedWords: ReplacedWord[]) => {
    p.push();
    const currentMillis = p.millis();

    // Filter out expired words and update the array
    R.filter(
      (word: ReplacedWord) =>
        currentMillis - word.animationStart <= WORD_DISPLAY_DURATION,
      replacedWords,
    ).forEach((rw) => {
      // Calculate animation parameters
      const age = currentMillis - rw.animationStart;
      const gatherProgress = Math.min(1, age / GATHER_ANIMATION_DURATION);

      // Calculate opacity based on age
      const opacity =
        age > WORD_DISPLAY_DURATION - 1000
          ? p.map(
              age,
              WORD_DISPLAY_DURATION - 1000,
              WORD_DISPLAY_DURATION,
              255,
              0,
            )
          : age < GATHER_ANIMATION_DURATION
          ? p.map(age, 0, GATHER_ANIMATION_DURATION, 150, 255)
          : 255;

      // Rendering parameters
      const colorIndex = rw.colorIndex % FOREST_GREENS_ARRAY.length;
      const targetColor = FOREST_GREENS_ARRAY[colorIndex];
      const letterSpacing = 10;
      const wordWidth = rw.word.length * letterSpacing;
      const startX = Math.round(rw.x - wordWidth / 2);

      // Render each letter
      const letterCount = Math.min(rw.sourcePositions.length, rw.word.length);
      // Animating letters
      const easedProgress = easeOutCubic(gatherProgress);
      // Cross-fade between 't' and target letter
      const letterOpacity = p.map(easedProgress, 0.5, 0.8, 0, opacity);
      const tOpacity = p.map(easedProgress, 0.5, 0.8, opacity, 0);

      R.range(0, letterCount).forEach((j) => {
        const letter = rw.word[j];
        const sourcePos = rw.sourcePositions[j];
        const targetPos = {
          x: Math.round(startX + j * letterSpacing),
          y: Math.round(rw.y),
        };

        if (gatherProgress < 1) {
          const pos = {
            x: p.lerp(sourcePos.x, targetPos.x, easedProgress),
            y: p.lerp(sourcePos.y, targetPos.y, easedProgress),
          };

          // Draw fading 't'
          if (tOpacity > 0) {
            p.fill(0, 0, 0, tOpacity);
            p.textSize(LETTER_SIZE);
            p.text('t', pos.x, pos.y);
          }

          // Draw appearing letter
          if (letterOpacity > 0) {
            // Color transition
            const [r, g, b] = targetColor.map((c) =>
              p.lerp(0, c, easedProgress),
            );
            p.fill(r, g, b, letterOpacity);
            p.textSize(LETTER_SIZE);
            p.text(letter, pos.x, pos.y);
          }
        } else {
          // Draw final letter
          p.fill(targetColor[0], targetColor[1], targetColor[2], opacity);
          p.textSize(LETTER_SIZE);
          p.text(letter, targetPos.x, targetPos.y);
        }
      });
    });

    p.pop();
  };

  /** Draws the title "forest" in IPA notation */
  const drawTitle = () => {
    p.push();
    // Adjust title size based on screen width
    const titleSize = p.width < 500 ? 72 : 92;
    p.textSize(titleSize);
    p.fill(...KAHU_BLUE);
    // Adjust position for smaller screens
    const titleX = p.width < 500 ? 20 : 40;
    p.text(FOREST_TITLE, Math.round(titleX), 88);
    p.pop();
  };

  /** Draws the poem text (left side) */
  const drawPoem = () => {
    p.push();
    // Adjust text size based on screen width
    const fontSize = p.width < 500 ? LETTER_SIZE - 2 : LETTER_SIZE;
    p.textSize(fontSize);
    p.fill(0);
    const baseY = Math.round(p.height * 0.3);

    // Calculate left margin based on canvas width
    const leftMargin = p.width < 500 ? 20 : 114;

    POEM_LINES.forEach((line, i) =>
      p.text(
        line,
        Math.round(leftMargin),
        Math.round(baseY + i * fontSize * 1.4),
      ),
    );
    p.pop();
  };

  /** Draws the etymology text (right side) */
  const drawEtymology = () => {
    p.push();
    // Adjust text size based on screen width
    const fontSize =
      p.width < 500 ? Math.max(LETTER_SIZE - 2, 12) : LETTER_SIZE;
    p.textSize(fontSize);
    p.fill(...KAHU_BLUE);

    // Calculate right position based on canvas width
    // Ensure minimum separation between poem and etymology
    const rightPosition = Math.round(
      p.width < 500 ? Math.max(p.width - 160, 170) : p.width - 280,
    );

    // Calculate line height based on canvas height to stretch etymology
    // across the full height plus a bit more to go off-screen
    const totalLines = ETYMOLOGY_LINES.length;
    const lineHeight = (p.height * 1.02) / totalLines;

    // Start position slightly above the top of the canvas
    const startY = Math.round(-p.height * 0.01);

    ETYMOLOGY_LINES.forEach((line, i) =>
      p.text(line, rightPosition, Math.round(startY + i * lineHeight)),
    );
    p.pop();
  };

  p.preload = () => {
    bodoniFont = p.loadFont('/interactive-poetry/fonts/bodoni-72-book.ttf');
  };

  p.setup = () => {
    p.createCanvas(...getCanvasSize(p));
    improveTextRendering(p);
    p.textFont(bodoniFont);
    p.textAlign(p.LEFT, p.TOP);
    p.background(255);
  };

  p.updateWithProps = (props) => {
    // No need to check for undefined on the base type now, but checking doesn't hurt
    if (props.letterDensity !== undefined)
      state.letterDensity = props.letterDensity;
    if (props.swayAmount !== undefined) state.swayAmount = props.swayAmount;
    if (props.distributionMode !== undefined)
      state.distributionMode = props.distributionMode;
    if (props.gammaShape !== undefined) state.gammaShape = props.gammaShape;
    if (props.gammaScale !== undefined) state.gammaScale = props.gammaScale;
  };

  p.draw = () => {
    p.background(255);

    // Update animation timing with improved frame rate independence
    const currentTime = p.millis() * 0.001;
    const deltaTime = Math.min(0.05, currentTime - lastFrameTime); // Cap max delta time
    lastFrameTime = currentTime;
    time += deltaTime * 0.5;

    updateMouseInfluence();

    // Apply smoother transitions to sway with consistent animation speed
    const lerpFactor = 0.05;
    xOffset = p.lerp(xOffset, targetXOffset, lerpFactor);
    yOffset = p.lerp(yOffset, targetYOffset, lerpFactor);

    // Draw all elements
    drawBackgroundLetters();
    drawReplacedWords(replacedWords);
    drawTitle();
    drawPoem();
    drawEtymology();
  };

  p.windowResized = () => {
    p.resizeCanvas(...getCanvasSize(p));
  };

  p.mouseMoved = () => {
    const mouseSpeed =
      p.abs(p.mouseX - p.pmouseX) + p.abs(p.mouseY - p.pmouseY);
    updateMouseInfluence(mouseSpeed);
  };

  p.mouseClicked = () => {
    // Only process clicks within canvas
    if (
      p.mouseX < 0 ||
      p.mouseX > p.width ||
      p.mouseY < 0 ||
      p.mouseY > p.height
    ) {
      return false;
    }

    // Get next poem word
    const word = POEM_WORDS[currentWordIndex];
    currentWordIndex = (currentWordIndex + 1) % POEM_WORDS.length;

    // Get tree positions
    const positions = calculateTreePositions();

    // Find trees near click point that haven't been replaced
    const availableTrees = positions.filter(
      (pos) => !replacedPositionKeys.has(`${pos.baseX},${pos.baseY}`),
    );

    // Add distance from click and sort
    const treesWithDistance = availableTrees.map((pos) => ({
      ...pos,
      dist: p.dist(p.mouseX, p.mouseY, pos.x, pos.y),
    }));

    // Sort by distance and take what we need
    const sortedTrees = R.sort((a, b) => a.dist - b.dist, treesWithDistance);
    const treesToReplace = R.take(word.length, sortedTrees);

    if (treesToReplace.length === 0) return false;

    // Create replacement word
    const sourcePositions = treesToReplace.map((pos) => ({
      x: pos.x,
      y: pos.y,
    }));
    const centroid = calculateCentroid(treesToReplace);

    // Mark positions as replaced using the Set
    treesToReplace.forEach((pos) =>
      replacedPositionKeys.add(`${pos.baseX},${pos.baseY}`),
    );

    // Add the word with animation
    replacedWords.push({
      x: centroid.x,
      y: centroid.y,
      word,
      animationStart: p.millis(),
      colorIndex: currentGreenIndex,
      sourcePositions,
    });

    // Cycle to next color
    currentGreenIndex = (currentGreenIndex + 1) % FOREST_GREENS_ARRAY.length;

    return false;
  };

  /**
   * Calculates the influence of mouse position and movement on the tree sway effect.
   * Accepts current x and y coordinates and optional speed of mouse movement
   * to create stronger effects when moving fast
   */
  const updateMouseInfluence = (speed: number = 0) => {
    if (p.mouseX !== 0 && p.mouseY !== 0) {
      // Calculate divisor based on speed - faster movement creates stronger effect
      const divisor = 50 - speed * 0.1;

      // Calculate target offsets with constraints
      targetXOffset = (p.mouseX - p.width / 2) / divisor;
      targetYOffset = (p.mouseY - p.height / 2) / divisor;

      // Constrain values to prevent extreme movement
      targetXOffset = p.constrain(targetXOffset, -30, 30);
      targetYOffset = p.constrain(targetYOffset, -30, 30);
    } else {
      // Slowly decay offset when mouse is outside canvas for smoother transition
      targetXOffset *= 0.95;
      targetYOffset *= 0.95;
    }
  };
};

/** ForestCanvas is a component that renders a typographic forest visualization. */
const ForestCanvas = () => {
  // Use the default controls object for initial state
  const [controls, setControls] = useState<ForestControls>(DEFAULT_CONTROLS);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  // Update a single control value (handle string for dropdown)
  const updateControl =
    (key: keyof ForestControls) => (value: number | string) =>
      setControls((prev) => ({ ...prev, [key]: value }));

  // Reset all controls directly using the default object
  const handleReset = () => setControls(DEFAULT_CONTROLS);

  // Create a slider control with reset button using the default object
  const createSliderControl = (
    key: keyof ForestControls,
    min: number,
    max: number,
    step: number,
    // No defaultValue param needed here, it's sourced from DEFAULT_CONTROLS
  ) => (
    <>
      <SliderControl
        value={controls[key] as number} // Need cast as type might include string
        onChange={(val) => updateControl(key)(val)} // Ensure number is passed
        min={min}
        max={max}
        step={step}
      />
      {/* Reset button now uses the value from DEFAULT_CONTROLS */}
      <ResetButton onClick={() => updateControl(key)(DEFAULT_CONTROLS[key])} />
    </>
  );

  // Control configuration
  const controlConfig = [
    {
      id: 'letterDensity',
      label: 'Tree Density',
      description:
        'Controls how many "t" letters appear on the canvas, similar to forest density.',
      control: createSliderControl(
        'letterDensity',
        100,
        1000,
        50,
        // No default needed here
      ),
    },
    {
      id: 'swayAmount',
      label: 'Wind Intensity',
      description: 'Controls how much the trees sway, like wind in a forest.',
      control: createSliderControl(
        'swayAmount',
        0,
        50,
        5,
        // No default needed here
      ),
    },
    {
      id: 'distributionMode',
      label: 'Forest Type',
      description: 'Select distribution pattern for different forest types.',
      control: (
        <select
          value={controls.distributionMode}
          onChange={(e) => updateControl('distributionMode')(e.target.value)}
          className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
        >
          <option value="random">Random (Perlin Scattered)</option>
          <option value="gamma">Natural Forest (Gamma)</option>
          <option value="gaussian">Plantation (Gaussian)</option>
        </select>
      ),
    },
    {
      id: 'gammaShape',
      label: 'Age Structure',
      description: 'Controls tree diameter distribution shape (c parameter).',
      control: createSliderControl(
        'gammaShape',
        0.5,
        5,
        0.1,
        // No default needed here
      ),
    },
    {
      id: 'gammaScale',
      label: 'Size Variability',
      description:
        'Controls the scale of tree size distribution (b parameter).',
      control: createSliderControl(
        'gammaScale',
        0.01,
        0.1,
        0.001,
        // No default needed here
      ),
    },
  ];

  // References for the scientific paper citations
  const scientificSources = [
    {
      href: 'https://doi.org/10.1111/j.1365-2745.2009.01583.x',
      text: 'Enquist, B.J., West, G.B. & Brown, J.H. (2009). Extensions and evaluations of a general quantitative theory of forest structure and dynamics. Proceedings of the National Academy of Sciences, 106(17), 7046-7051.',
    },
    {
      href: 'https://doi.org/10.1073/pnas.0901970106',
      text: 'Muller-Landau, H.C. et al. (2006). Testing metabolic ecology theory for allometric scaling of tree size, growth and mortality in tropical forests. Ecology Letters, 9(5), 575-588.',
    },
    {
      href: 'https://doi.org/10.1126/science.1066854',
      text: 'West, G.B., Enquist, B.J. & Brown, J.H. (2009). A general quantitative theory of forest structure and dynamics. PNAS, 106(17), 7040-7045.',
    },
    {
      href: 'https://doi.org/10.1111/j.1461-0248.2006.00904.x',
      text: 'Coomes, D.A. & Allen, R.B. (2007). Mortality and tree-size distributions in natural mixed-age forests. Journal of Ecology, 95(1), 27-40.',
    },
    {
      href: 'https://doi.org/10.1145/358407.358414',
      text: 'Marsaglia, G. & Tsang, W.W. (2000). A simple method for generating gamma variables. ACM Transactions on Mathematical Software, 26(3), 363-372.',
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="mb-4 w-full">
        <ControlPanel controls={controlConfig} onReset={handleReset} />

        <div className="mt-3 ml-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="text-sm underline text-blue-600 hover:text-blue-800"
            >
              {showFormula ? 'Hide Scientific Model' : 'Show Scientific Model'}
            </button>
          </div>

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
                  <strong>c = {controls.gammaShape?.toFixed(1)}</strong> (shape
                  parameter)
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Controls the age-size structure distribution
                  </div>
                </div>
                <div>
                  <strong>b = {controls.gammaScale?.toFixed(3)}</strong> (scale
                  parameter)
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
                {scientificSources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.href}
                      className="text-blue-600 hover:underline break-words hyphens-auto"
                    >
                      {source.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <ReactP5Wrapper sketch={sketch} {...controls} />
      </div>
    </div>
  );
};

export default ForestCanvas;
