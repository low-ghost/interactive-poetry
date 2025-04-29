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

// Forest distribution parameters based on research
const DISTRIBUTION_MODE = 'gamma'; // 'random', 'gamma', 'gaussian'
const DEFAULT_GAMMA_SHAPE = 0.8; // Shape parameter c (default from research ~0.8)
const DEFAULT_GAMMA_SCALE = 0.05; // Scale parameter b (adjusted from research ~0.033 for better visual display)

const POEM = `as if to say
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

const ETYMOLOGY = `From Middle
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

const FOREST_TITLE = 'fəɹəst';

const sketch = (
  p: P5CanvasInstance<{
    letterDensity: number;
    swayAmount: number;
    distributionMode?: string;
    gammaShape?: number;
    gammaScale?: number;
  }>,
) => {
  const letterSize = 16;
  let letterDensity = 400;
  let bodoniFont: p5.Font;
  let distributionMode = DISTRIBUTION_MODE;
  let gammaShape = DEFAULT_GAMMA_SHAPE;
  let gammaScale = DEFAULT_GAMMA_SCALE;

  // Poem word replacement
  let poemWords: string[] = [];
  let currentWordIndex = 0;
  const replacedWords: {
    x: number;
    y: number;
    word: string;
    animationStart: number;
    colorIndex: number;
    sourcePositions: { x: number; y: number }[];
  }[] = [];
  const REPLACE_RADIUS = 80; // pixels around click to replace
  const WORD_DISPLAY_DURATION = 6000; // milliseconds to display words
  const GATHER_ANIMATION_DURATION = 1200; // milliseconds for gathering animation
  // Track which t positions are replaced
  const replacedPositions: { x: number; y: number }[] = [];

  // Sway variables
  let swayAmount = 0;
  let time = 0;
  let xOffset = 0;
  let yOffset = 0;
  let targetXOffset = 0;
  let targetYOffset = 0;
  let lastFrameTime = 0; // To calculate delta time for smoother animation

  // Different shades of green for the forest
  const FOREST_GREENS = [
    [34, 139, 34], // Forest Green
    [0, 100, 0], // Dark Green
    [85, 107, 47], // Dark Olive Green
    [107, 142, 35], // Olive Drab
    [60, 179, 113], // Medium Sea Green
    [46, 139, 87], // Sea Green
    [32, 178, 170], // Light Sea Green
    [0, 128, 0], // Green
  ];
  let currentGreenIndex = 0;

  // Generate a gamma-distributed random value
  // Using acceptance-rejection method
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

  // Convert a value from gamma distribution to screen position
  const gammaToScreenX = (value: number, maxWidth: number): number => {
    // Map gamma values to screen coordinates using a wider distribution
    return Math.min(
      maxWidth * 0.98,
      maxWidth * 0.02 + (value / 2.5) * maxWidth * 0.95,
    );
  };

  // Convert a value from gamma distribution to screen position (Y)
  const gammaToScreenY = (value: number, maxHeight: number): number => {
    // Similar mapping for Y coordinates with wider distribution
    return Math.min(
      maxHeight * 0.98,
      maxHeight * 0.02 + (value / 2.5) * maxHeight * 0.95,
    );
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

    // Initialize poem words array by splitting the poem text
    poemWords = POEM.split(/\s+/).filter((word) => word.trim().length > 0);
  };

  p.updateWithProps = (props) => {
    if (props.letterDensity !== undefined) {
      letterDensity = props.letterDensity;
    }
    if (props.swayAmount !== undefined) {
      swayAmount = props.swayAmount;
    }
    if (props.distributionMode !== undefined) {
      distributionMode = props.distributionMode;
    }
    if (props.gammaShape !== undefined) {
      gammaShape = props.gammaShape;
    }
    if (props.gammaScale !== undefined) {
      gammaScale = props.gammaScale;
    }
  };

  p.draw = () => {
    p.background(255);

    // Calculate delta time for smoother animation
    const currentTime = p.millis() * 0.001; // Convert to seconds
    const deltaTime = Math.min(0.05, currentTime - lastFrameTime); // Cap to prevent jumps
    lastFrameTime = currentTime;

    // Update time for animation - use delta time for consistent speed
    time += deltaTime * 0.5; // Slow down the time increment

    // Update offsets based on mouse position with smoother transitions
    if (p.mouseX !== 0 && p.mouseY !== 0) {
      // Calculate mouse influence
      targetXOffset = (p.mouseX - p.width / 2) / 50;
      targetYOffset = (p.mouseY - p.height / 2) / 50;
    }

    // Smoothly interpolate to target offsets with deltaTime
    const lerpFactor = 0.05 * (deltaTime * 20); // Adjust lerp factor based on frame rate
    xOffset = p.lerp(xOffset, targetXOffset, lerpFactor);
    yOffset = p.lerp(yOffset, targetYOffset, lerpFactor);

    // Store t positions for click interaction
    const tPositions: { x: number; y: number; size: number }[] = [];

    // Draw the background letter 't' pattern (light but visible)
    p.push();
    p.textSize(18);
    p.fill(0, 0, 0, 30); // Increased opacity to make them more visible

    // Use a deterministic pattern for t letters with animation
    p.randomSeed(42);

    const [width, height] = [p.width, p.height];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < letterDensity * 2.2; i++) {
      let baseX, baseY;
      let letterScale = 1.0; // Default scale factor

      // Generate positions based on selected distribution
      if (distributionMode === 'gamma') {
        // Natural forest distribution based on gamma model

        // Generate the base gamma values with slight randomization to create variety
        // Use deterministic random values based on index to prevent stuttering
        // Use fixed seed to prevent flashing
        const seed1 = i * 10; // Fixed seed based on letter index
        const seed2 = i * 20 + 500;
        const randomOffset = p.noise(seed1, time * 0.1) * 0.4 + 0.8; // 0.8 to 1.2 range
        const gammaX = generateGammaRandom(
          gammaShape * randomOffset,
          gammaScale,
        );
        const gammaY = generateGammaRandom(
          gammaShape * randomOffset,
          gammaScale * 1.1,
        );

        // Apply larger random offsets that are stable across frames
        // Use separate noise functions with different seeds for more variety
        // These offsets help letters spread across the entire canvas
        const xOffset = p.noise(seed1 * 0.3, time * 0.03) * width * 0.9;
        const yOffset = p.noise(seed2 * 0.3, time * 0.03) * height * 0.9;

        // Calculate base positions with wider spreading
        baseX = gammaToScreenX(gammaX, width) + xOffset;
        baseY = gammaToScreenY(gammaY, height) + yOffset;

        // Replace artificial quadrant distribution with a more natural approach
        // Natural forests show clustering based on environmental factors and seed dispersal
        // without strict quadrant divisions

        // Use Perlin noise to create natural environmental variability
        const envFactor = p.noise(baseX * 0.005, baseY * 0.005, i * 0.0001);

        // Create clustering effect with attractors at various natural points
        // This is more realistic than quadrant-based distribution
        const numAttractors = 5;
        let attraction = 0;
        let attractX = 0;
        let attractY = 0;

        // Create several attraction points with different strengths
        for (let a = 0; a < numAttractors; a++) {
          // Use stable seeds for consistent attractors
          const attractorSeed1 = a * 1000;
          const attractorSeed2 = a * 2000;

          // Calculate attractor positions across the canvas using noise
          // This creates natural-looking population centers
          const aX = p.noise(attractorSeed1, time * 0.01) * width;
          const aY = p.noise(attractorSeed2, time * 0.01) * height;

          // Calculate distance influence with inverse square law (natural dispersion)
          const dist = p.dist(baseX, baseY, aX, aY);
          const influence = 1 / (1 + dist * 0.01);

          // Accumulate attraction effects
          attraction += influence;
          attractX += aX * influence;
          attractY += aY * influence;
        }

        // Normalize the attraction influence
        if (attraction > 0) {
          attractX /= attraction;
          attractY /= attraction;

          // Apply attraction with environmental variation
          // Lower lerp value (0.3) makes the distribution more natural and less artificial
          baseX = p.lerp(baseX, attractX, 0.3 * envFactor);
          baseY = p.lerp(baseY, attractY, 0.3 * envFactor);
        }

        // Apply a slight noise offset for more organic distribution
        baseX += p.noise(seed1 * 0.5, time * 0.02) * width * 0.3 - width * 0.15;
        baseY +=
          p.noise(seed2 * 0.5, time * 0.02) * height * 0.3 - height * 0.15;

        // Ensure letters stay within canvas boundaries with a margin
        baseX = p.constrain(baseX, 5, width - 15);
        baseY = p.constrain(baseY, 5, height - 15);

        // Store gamma value for letter sizing - this represents tree diameter
        // Use a consistent formula to prevent size flashing
        const gammaValue = p.noise(seed1 * 0.7) * 1.5; // Consistent value between 0 and 1.5

        // Scale letter size based on gamma value (DBH simulation)
        // Create a more subtle size variation that looks natural
        letterScale = 0.8 + Math.min(gammaValue, 1.5) / 3; // Scale from 0.8 to 1.3 times normal size
      } else if (distributionMode === 'gaussian') {
        // Plantation forest (managed) distribution - more uniform
        baseX = p.randomGaussian(centerX, width * 0.2);
        baseY = p.randomGaussian(centerY, height * 0.2);
      } else {
        // Original random distribution
        baseX = p.random(width);
        baseY = p.random(height);
      }

      // Add wave motion + mouse influence with delta-time based animation
      const swayX = Math.sin(time + baseY * 0.01) * swayAmount + xOffset;
      const swayY = Math.cos(time + baseX * 0.01) * (swayAmount / 2) + yOffset;

      // Final position of the 't'
      const finalX = baseX + swayX;
      const finalY = baseY + swayY;

      // Determine text size based on distribution
      let fontSize = 18;
      if (distributionMode === 'gamma') {
        fontSize = Math.floor(18 * letterScale);
      } else if (distributionMode === 'gaussian') {
        fontSize = 18;
      } else {
        const sizeVar = p.noise(i * 0.5, 9999) * 0.4 + 0.8;
        fontSize = 18 * sizeVar;
      }

      // Store positions for click interaction with their size
      tPositions.push({ x: finalX, y: finalY, size: fontSize });

      // Vary opacity based on "tree size" (gamma value) - making larger "trees" more visible
      const dist = p.dist(baseX, baseY, centerX, centerY);
      const normalizedDist = p.constrain(dist / Math.max(width, height), 0, 1);
      const opacity = p.map(normalizedDist, 0, 0.5, 60, 20);

      // Check if this position has been replaced
      const isReplaced = replacedPositions.some(
        (rp) => p.dist(finalX, finalY, rp.x, rp.y) < 5,
      );

      if (!isReplaced) {
        p.fill(0, 0, 0, opacity);
        p.textSize(fontSize);
        p.text('t', finalX, finalY);
      }
    }
    p.pop();

    // Draw replaced words and animating t's
    p.push();
    const currentMillis = p.millis();
    for (let i = replacedWords.length - 1; i >= 0; i--) {
      const rw = replacedWords[i];
      // Calculate age of the replacement and remove if too old
      const age = currentMillis - rw.animationStart;

      if (age > WORD_DISPLAY_DURATION) {
        // Remove old words
        replacedWords.splice(i, 1);
        continue;
      }

      // Calculate animation progress for t gathering (0 to 1)
      const gatherProgress = Math.min(1, age / GATHER_ANIMATION_DURATION);

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
      const targetColor = FOREST_GREENS[rw.colorIndex];

      // Calculate positions and draw letters
      const sourcePositions = rw.sourcePositions;
      const wordLetters = rw.word.split('');

      // Only calculate letter distribution at the beginning for consistent animation
      const letterSpacing = 10;
      const wordWidth = wordLetters.length * letterSpacing;
      const startX = rw.x - wordWidth / 2;

      // If still in gathering animation phase, animate the transition
      if (gatherProgress < 1) {
        // During gather animation, draw each transitioning 't'
        for (
          let j = 0;
          j < Math.min(sourcePositions.length, wordLetters.length);
          j++
        ) {
          const sourcePos = sourcePositions[j];
          const targetX = startX + j * letterSpacing;
          const targetY = rw.y;

          // Apply easing function for smoother animation
          // Use cubic easing out for natural movement
          const easedProgress = 1 - Math.pow(1 - gatherProgress, 3);

          // Interpolate position
          const x = p.lerp(sourcePos.x, targetX, easedProgress);
          const y = p.lerp(sourcePos.y, targetY, easedProgress);

          // Interpolate color from black to target color
          const r = p.lerp(0, targetColor[0], easedProgress);
          const g = p.lerp(0, targetColor[1], easedProgress);
          const b = p.lerp(0, targetColor[2], easedProgress);

          // Interpolate between 't' and actual letter
          // We'll represent this by opacity fade-swap
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
        }
      } else {
        // After gathering is complete, maintain final positions instead of snapping to tight alignment
        for (
          let j = 0;
          j < Math.min(sourcePositions.length, wordLetters.length);
          j++
        ) {
          const sourcePos = sourcePositions[j];
          const targetX = startX + j * letterSpacing;
          const targetY = rw.y;

          // Use final animation positions (100% of the easing progress)
          // This preserves the last frame of the animation without snapping
          const finalEasedProgress = 1; // 100% progress
          const x = p.lerp(sourcePos.x, targetX, finalEasedProgress);
          const y = p.lerp(sourcePos.y, targetY, finalEasedProgress);

          // Draw with final color
          p.fill(targetColor[0], targetColor[1], targetColor[2], opacity);
          p.textSize(18);
          p.text(wordLetters[j], x, y);
        }
      }
    }
    p.pop();

    // Draw the title "fəɹəst"
    p.push();
    p.textSize(92);
    p.fill(0, 149, 218); // light blue
    p.text(FOREST_TITLE, 40, 88);
    p.pop();

    // Draw the poem text (left side)
    p.push();
    p.textSize(letterSize);
    p.fill(0);
    const lines = POEM.split('\n');
    let y = p.height * 0.3; // Exact positioning
    for (let line of lines) {
      p.text(line, 114, y);
      y += letterSize * 1.4;
    }
    p.pop();

    // Draw the etymology text (right side) - starting off-screen
    p.push();
    p.textSize(letterSize);
    p.fill(0, 149, 218); // Match title color
    const etymLines = ETYMOLOGY.split('\n');
    y = -5; // off-screen

    for (let line of etymLines) {
      p.text(line, p.width - 280, Math.floor(y) + 0.5);
      y += letterSize * 1.21;
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

    // Get the next word from the poem
    if (poemWords.length === 0) return;

    const word = poemWords[currentWordIndex];
    currentWordIndex = (currentWordIndex + 1) % poemWords.length;

    // Find nearby t's
    const clickPos = { x: p.mouseX, y: p.mouseY };

    // Find all t positions within the replace radius
    const nearbyPositions = [];
    const [width, height] = [p.width, p.height];

    // Use a deterministic pattern for t letters (same as in draw)
    p.randomSeed(42);

    for (let i = 0; i < letterDensity * 2.2; i++) {
      let baseX, baseY;
      let letterScale = 1.0; // Default scale factor

      // Generate positions based on selected distribution (simplified version of draw code)
      if (distributionMode === 'gamma') {
        const seed1 = i * 10;
        const seed2 = i * 20 + 500;
        const randomOffset = p.noise(seed1, time * 0.1) * 0.4 + 0.8;
        const gammaX = generateGammaRandom(
          gammaShape * randomOffset,
          gammaScale,
        );
        const gammaY = generateGammaRandom(
          gammaShape * randomOffset,
          gammaScale * 1.1,
        );

        const xOffset = p.noise(seed1 * 0.3, time * 0.03) * width * 0.9;
        const yOffset = p.noise(seed2 * 0.3, time * 0.03) * height * 0.9;

        baseX = gammaToScreenX(gammaX, width) + xOffset;
        baseY = gammaToScreenY(gammaY, height) + yOffset;

        // Apply the same environmental factors as in draw
        const envFactor = p.noise(baseX * 0.005, baseY * 0.005, i * 0.0001);
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
      } else if (distributionMode === 'gaussian') {
        const centerX = width / 2;
        const centerY = height / 2;
        baseX = p.randomGaussian(centerX, width * 0.2);
        baseY = p.randomGaussian(centerY, height * 0.2);
      } else {
        baseX = p.random(width);
        baseY = p.random(height);
      }

      // Add wave motion + mouse influence
      const swayX = Math.sin(time + baseY * 0.01) * swayAmount + xOffset;
      const swayY = Math.cos(time + baseX * 0.01) * (swayAmount / 2) + yOffset;

      // Final position of the 't'
      const finalX = baseX + swayX;
      const finalY = baseY + swayY;

      // Check if it's within radius and not already replaced
      const dist = p.dist(clickPos.x, clickPos.y, finalX, finalY);
      const notReplaced = !replacedPositions.some(
        (rp) => p.dist(finalX, finalY, rp.x, rp.y) < 5,
      );

      if (dist < REPLACE_RADIUS && notReplaced) {
        nearbyPositions.push({ x: finalX, y: finalY });
      }
    }

    // Sort positions by distance to click
    nearbyPositions.sort((a, b) => {
      const distA = p.dist(clickPos.x, clickPos.y, a.x, a.y);
      const distB = p.dist(clickPos.x, clickPos.y, b.x, b.y);
      return distA - distB;
    });

    // Replace exactly as many t's as there are letters in the word
    const letterCount = word.length;
    const positionsToReplace = nearbyPositions.slice(0, letterCount);

    if (positionsToReplace.length > 0) {
      // Store the original positions of the t's for animation
      const sourcePositions = positionsToReplace.map((pos) => ({
        x: pos.x,
        y: pos.y,
      }));

      // Add the word at the centroid of the replaced t's
      let avgX = 0;
      let avgY = 0;

      for (const pos of positionsToReplace) {
        avgX += pos.x;
        avgY += pos.y;
        // Add to replaced positions
        replacedPositions.push(pos);
      }

      avgX /= positionsToReplace.length;
      avgY /= positionsToReplace.length;

      // Get the next color and increment the index
      const colorIndex = currentGreenIndex;
      currentGreenIndex = (currentGreenIndex + 1) % FOREST_GREENS.length;

      // Add the replacement word with source positions for animation
      replacedWords.push({
        x: avgX,
        y: avgY,
        word: word,
        animationStart: p.millis(),
        colorIndex: colorIndex,
        sourcePositions: sourcePositions,
      });
    }

    return false; // Prevent default behavior
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
      label: 'Wind Intensity',
      description: 'Controls how much the trees sway, like wind in a forest.',
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
    {
      id: 'distributionMode',
      label: 'Forest Type',
      description: 'Select distribution pattern for different forest types.',
      control: (
        <div className="flex items-center gap-2">
          <select
            value={distributionMode}
            onChange={(e) => setDistributionMode(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
          >
            <option value="random">Random (Scattered)</option>
            <option value="gamma">Natural Forest (Gamma)</option>
            <option value="gaussian">Plantation (Gaussian)</option>
          </select>
        </div>
      ),
    },
    {
      id: 'gammaShape',
      label: 'Age Structure',
      description: 'Controls tree diameter distribution shape (c parameter).',
      control: (
        <div className="flex items-center gap-2">
          <SliderControl
            value={gammaShape}
            onChange={setGammaShape}
            min={0.5}
            max={5}
            step={0.1}
          />
          <button
            onClick={() => setGammaShape(DEFAULT_GAMMA_SHAPE)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      ),
    },
    {
      id: 'gammaScale',
      label: 'Size Variability',
      description:
        'Controls the scale of tree size distribution (b parameter).',
      control: (
        <div className="flex items-center gap-2">
          <SliderControl
            value={gammaScale}
            onChange={setGammaScale}
            min={0.01}
            max={0.1}
            step={0.001}
          />
          <button
            onClick={() => setGammaScale(DEFAULT_GAMMA_SCALE)}
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
