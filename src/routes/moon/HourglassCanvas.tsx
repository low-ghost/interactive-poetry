import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize, improveTextRendering } from '@utils/canvas';
import { POEM_LINES } from './poem';

type FallingLetter = {
  char: string;
  x: number;
  y: number;
  targetX: number;
  speed: number;
  opacity: number;
  size: number;
  age: number;
  pathIndex: number;
};

type SketchProps = {
  buildSpeed: number | null;
};

export const sketch = (p: P5CanvasInstance<SketchProps>) => {
  let fallingLetters: FallingLetter[] = [];
  let currentLineIndex = 0;
  let currentLinePosition = 0;
  let frameCounter = 0;
  let nextLetterTime = 0;
  let lineChangeTime = 0;

  // Poem cycling variables
  let currentPoemLineIndex = 0; // Which group of lines we're showing (0, 3, 6, etc.)
  let lineTransitionProgress = 0; // 0 to 1, how far through the transition we are
  let nextLineChangeTime = 600; // frames before next line change (10 seconds at 60fps)

  // The 3 specific curved paths from the image
  let curvePaths: { x: number; y: number }[][] = [];
  let targetCurvePaths: { x: number; y: number }[][] = []; // Target positions for smooth morphing
  let curveAnimationProgress = 1.0; // 0 = old position, 1 = target position
  let curveBlendProgress = 1.0; // Additional progress for smooth wavering blend

  // Letter distribution for the curves
  let curveLetters: string[][] = [];
  let nextCurveLetters: string[][] = []; // Letters that will replace current ones

  // Mouse influence variables
  let mouseInfluenceX = 0;
  let mouseInfluenceY = 0;

  const state: SketchProps = {
    buildSpeed: 1,
  };

  // Colors matching the user's image
  const backgroundColor = [45, 47, 51]; // Dark charcoal background
  const textColor = [220, 220, 220]; // Light gray/white for text
  const dotColor = [120, 120, 120]; // Medium gray for dots

  p.updateWithProps = (props: SketchProps) => {
    state.buildSpeed = props.buildSpeed ?? 1;
  };

  p.preload = () => {
    // No images to preload for this canvas
  };

  p.setup = () => {
    const [width, height] = getCanvasSize(p);
    p.createCanvas(width, height);
    improveTextRendering(p);

    // Initialize the 3 curved paths
    initializeCurvePaths();

    // Distribute poem letters across curves
    distributePoemLetters();

    p.textFont('Courier New');
    p.textAlign(p.LEFT, p.TOP);
  };

  p.mouseMoved = () => {
    const [width, height] = getCanvasSize(p);
    // Normalize mouse position to -1 to 1 range for influence
    mouseInfluenceX = (p.mouseX / width - 0.5) * 2;
    mouseInfluenceY = (p.mouseY / height - 0.5) * 2;
  };

  const initializeCurvePaths = () => {
    const [width, height] = getCanvasSize(p);
    generateCurvePaths(width, height, 0); // Initialize with no time offset

    // Set up initial target curves (same as initial curves)
    targetCurvePaths = curvePaths.map((path) => [...path]);
  };

  const generateCurvePaths = (width: number, height: number, time: number) => {
    curvePaths = [];

    // Create exactly 3 specific curves that match the reference image
    const centerX = width * 0.5;

    // Add stronger wavering with different frequencies for each curve
    const waveAmplitude = width * 0.025; // Increased from 0.008 to 0.025
    const leftWave = Math.sin(time * 0.02) * waveAmplitude;
    const centerWave = Math.sin(time * 0.025 + Math.PI / 3) * waveAmplitude;
    const rightWave =
      Math.sin(time * 0.018 + (Math.PI * 2) / 3) * waveAmplitude;

    // Mouse influence factors (subtle)
    const mouseInfluenceStrength = width * 0.015;
    const leftMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 0.7;
    const centerMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 1.0;
    const rightMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 0.8;
    const verticalMouseInfluence =
      mouseInfluenceY * mouseInfluenceStrength * 0.3;

    // Left curve - starts left, bulges right, crosses center, bulges left, ends right
    const leftPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = height * 0.05 + t * height * 0.9;

      let x;
      if (t < 0.2) {
        // Start left, curve inward more gradually
        const localT = t / 0.2;
        x = centerX - width * 0.15 + localT * width * 0.08;
      } else if (t < 0.4) {
        // Bulge right more smoothly
        const localT = (t - 0.2) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5); // Smoother transition
        x = centerX - width * 0.07 + smoothT * width * 0.1;
      } else if (t < 0.6) {
        // Cross through center area with gentler slope
        const localT = (t - 0.4) / 0.2;
        const smoothT = 0.5 + 0.5 * Math.sin((localT - 0.5) * p.PI); // S-curve transition
        x = centerX + width * 0.03 - smoothT * width * 0.1;
      } else if (t < 0.8) {
        // Bulge left more gradually
        const localT = (t - 0.6) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.07 - smoothT * width * 0.08;
      } else {
        // End right with smooth approach
        const localT = (t - 0.8) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.07 + smoothT * width * 0.15;
      }

      // Add wavering effect with varying intensity along the curve + mouse influence
      const waveIntensity = Math.sin(t * Math.PI) * 0.5 + 0.5; // More wavering in the middle
      x += leftWave * waveIntensity;

      // Add mouse influence (subtle and position-dependent)
      const mouseIntensity = Math.sin(t * Math.PI * 0.8) * 0.8 + 0.2; // Varying mouse influence
      x += leftMouseInfluence * mouseIntensity;

      // Add subtle vertical mouse influence
      const adjustedY =
        y + verticalMouseInfluence * Math.sin(t * Math.PI * 2) * 0.5;

      leftPath.push({ x, y: adjustedY });
    }

    // Center curve - starts center, gentle S-curve with crossings
    const centerPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = height * 0.05 + t * height * 0.9;

      let x;
      if (t < 0.2) {
        // Start center, drift right gradually
        const localT = t / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + smoothT * width * 0.06;
      } else if (t < 0.4) {
        // Curve left smoothly
        const localT = (t - 0.2) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.06 - smoothT * width * 0.12;
      } else if (t < 0.6) {
        // Cross center going right with S-curve
        const localT = (t - 0.4) / 0.2;
        const smoothT = 0.5 + 0.5 * Math.sin((localT - 0.5) * p.PI);
        x = centerX - width * 0.06 + smoothT * width * 0.12;
      } else if (t < 0.8) {
        // Curve left again gradually
        const localT = (t - 0.6) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.06 - smoothT * width * 0.09;
      } else {
        // End center-left smoothly
        const localT = (t - 0.8) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.03 - smoothT * width * 0.07;
      }

      // Add wavering effect
      const waveIntensity = Math.sin(t * Math.PI) * 0.7 + 0.3;
      x += centerWave * waveIntensity;

      // Add mouse influence (strongest on center curve)
      const mouseIntensity = Math.sin(t * Math.PI * 1.2) * 0.9 + 0.1;
      x += centerMouseInfluence * mouseIntensity;

      // Add subtle vertical mouse influence
      const adjustedY =
        y + verticalMouseInfluence * Math.sin(t * Math.PI * 1.8) * 0.6;

      centerPath.push({ x, y: adjustedY });
    }

    // Right curve - starts right, crosses left, bulges, ends center
    const rightPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = height * 0.05 + t * height * 0.9;

      let x;
      if (t < 0.25) {
        // Start right, move toward center gradually
        const localT = t / 0.25;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.15 - smoothT * width * 0.1;
      } else if (t < 0.45) {
        // Cross to left side smoothly
        const localT = (t - 0.25) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.05 - smoothT * width * 0.15;
      } else if (t < 0.7) {
        // Bulge left with smooth transition
        const localT = (t - 0.45) / 0.25;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.1 - smoothT * width * 0.08;
      } else {
        // Return to center smoothly
        const localT = (t - 0.7) / 0.3;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.1 + smoothT * width * 0.1;
      }

      // Add wavering effect
      const waveIntensity = Math.sin(t * Math.PI * 1.2) * 0.6 + 0.4;
      x += rightWave * waveIntensity;

      // Add mouse influence
      const mouseIntensity = Math.sin(t * Math.PI * 0.9) * 0.7 + 0.3;
      x += rightMouseInfluence * mouseIntensity;

      // Add subtle vertical mouse influence
      const adjustedY =
        y + verticalMouseInfluence * Math.sin(t * Math.PI * 1.5) * 0.4;

      rightPath.push({ x, y: adjustedY });
    }

    curvePaths = [leftPath, centerPath, rightPath];

    // Redistribute points to ensure uniform spacing and smooth letter movement
    curvePaths = curvePaths.map((path) => redistributePoints(path, 100));
  };

  const redistributePoints = (
    originalPath: { x: number; y: number }[],
    targetCount: number,
  ) => {
    if (originalPath.length < 2) return originalPath;

    // Calculate cumulative distances along the original path
    const distances: number[] = [0];
    let totalDistance = 0;

    for (let i = 1; i < originalPath.length; i++) {
      const dx = originalPath[i].x - originalPath[i - 1].x;
      const dy = originalPath[i].y - originalPath[i - 1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalDistance += distance;
      distances.push(totalDistance);
    }

    // Create new path with uniform spacing
    const newPath: { x: number; y: number }[] = [];
    const segmentLength = totalDistance / (targetCount - 1);

    for (let i = 0; i < targetCount; i++) {
      const targetDistance = i * segmentLength;

      // Find the segment this point should be in
      let segmentIndex = 0;
      for (let j = 0; j < distances.length - 1; j++) {
        if (
          targetDistance >= distances[j] &&
          targetDistance <= distances[j + 1]
        ) {
          segmentIndex = j;
          break;
        }
      }

      if (segmentIndex >= originalPath.length - 1) {
        // Last point
        newPath.push(originalPath[originalPath.length - 1]);
      } else {
        // Interpolate between points
        const segmentStart = distances[segmentIndex];
        const segmentEnd = distances[segmentIndex + 1];
        const segmentProgress =
          (targetDistance - segmentStart) / (segmentEnd - segmentStart);

        const startPoint = originalPath[segmentIndex];
        const endPoint = originalPath[segmentIndex + 1];

        const x = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
        const y = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;

        newPath.push({ x, y });
      }
    }

    return newPath;
  };

  const distributePoemLetters = () => {
    // Get the current group of lines
    const line1 = POEM_LINES[currentPoemLineIndex] || '';
    const line2 = POEM_LINES[currentPoemLineIndex + 1] || '';
    const line3 = POEM_LINES[currentPoemLineIndex + 2] || '';

    // Distribute current lines to curves
    curveLetters = [
      line1.replace(/\s+/g, '').split(''),
      line2.replace(/\s+/g, '').split(''),
      line3.replace(/\s+/g, '').split(''),
    ];

    // Set up next lines for transition
    const nextLineIndex = (currentPoemLineIndex + 3) % POEM_LINES.length;
    const nextLine1 = POEM_LINES[nextLineIndex] || '';
    const nextLine2 = POEM_LINES[nextLineIndex + 1] || '';
    const nextLine3 = POEM_LINES[nextLineIndex + 2] || '';

    nextCurveLetters = [
      nextLine1.replace(/\s+/g, '').split(''),
      nextLine2.replace(/\s+/g, '').split(''),
      nextLine3.replace(/\s+/g, '').split(''),
    ];
  };

  const updatePoemCycle = () => {
    // Check if it's time to advance to next lines
    if (frameCounter >= nextLineChangeTime) {
      if (lineTransitionProgress === 0) {
        // Start of transition - generate dramatic new curve positions
        const [width, height] = getCanvasSize(p);

        // Store current evolved curves as source for morphing (not the original pattern!)
        // curvePaths already contains the current state (either original or previously evolved)
        const currentCurves = curvePaths.map((path) => [...path]);

        // Generate dramatically different target curves
        generateDramaticCurvePaths(width, height, frameCounter);
        targetCurvePaths = curvePaths.map((path) => [...path]);

        // Restore current evolved curves as starting point for interpolation
        curvePaths = currentCurves;
        curveAnimationProgress = 0.0;
      }

      // Progress both letter and curve transitions
      lineTransitionProgress = Math.min(lineTransitionProgress + 0.01, 1.0);
      curveAnimationProgress = Math.min(curveAnimationProgress + 0.005, 1.0); // Slower curve animation (was 0.008)

      if (lineTransitionProgress >= 1.0) {
        // Complete the transition - update baseline curves
        currentPoemLineIndex = (currentPoemLineIndex + 3) % POEM_LINES.length;
        lineTransitionProgress = 0;
        curveAnimationProgress = 1.0;
        curveBlendProgress = 0.0; // Start blending phase

        // The current curvePaths now contains the final morphed state
        // Update targetCurvePaths to this new baseline for future wavering
        targetCurvePaths = curvePaths.map((path) => [...path]);

        nextLineChangeTime = frameCounter + 600; // Reset timer
        distributePoemLetters(); // Update letter distributions
      }
    }

    // Update blend progress when not transitioning
    if (lineTransitionProgress === 0 && curveBlendProgress < 1.0) {
      curveBlendProgress = Math.min(curveBlendProgress + 0.01, 1.0);
    }
  };

  const drawPoemLines = () => {
    const [width, height] = getCanvasSize(p);

    // Draw the current three lines in the top left corner with gradual letter transitions
    p.fill(textColor[0], textColor[1], textColor[2], 255);
    p.textSize(18); // Larger font
    p.textAlign(p.LEFT, p.TOP);

    const currentLine1 = POEM_LINES[currentPoemLineIndex] || '';
    const currentLine2 = POEM_LINES[currentPoemLineIndex + 1] || '';
    const currentLine3 = POEM_LINES[currentPoemLineIndex + 2] || '';

    // Get next lines for transition
    const nextLineIndex = (currentPoemLineIndex + 3) % POEM_LINES.length;
    const nextLine1 = POEM_LINES[nextLineIndex] || '';
    const nextLine2 = POEM_LINES[nextLineIndex + 1] || '';
    const nextLine3 = POEM_LINES[nextLineIndex + 2] || '';

    // Function to gradually replace letters in a line using pushing effect
    const getTransitionText = (
      currentText: string,
      nextText: string,
      lineNumber: number,
    ) => {
      if (lineTransitionProgress === 0) {
        return currentText;
      }

      // Calculate how many characters of the new text to show
      const transitionSpeed = lineTransitionProgress + lineNumber * 0.1; // Slight stagger between lines
      const newCharsToShow = Math.floor(transitionSpeed * nextText.length);

      if (newCharsToShow <= 0) {
        return currentText;
      }

      if (newCharsToShow >= nextText.length) {
        return nextText;
      }

      // Get the portion of new text to insert at the beginning
      const newPortion = nextText.substring(0, newCharsToShow);

      // Calculate how much of the old text can still fit
      const maxDisplayLength = Math.max(currentText.length, nextText.length);
      const oldPortionLength = maxDisplayLength - newCharsToShow;

      if (oldPortionLength <= 0) {
        return newPortion;
      }

      // Get the old text, potentially truncated from the end
      const oldPortion = currentText.substring(0, oldPortionLength);

      return newPortion + oldPortion;
    };

    const displayLine1 = getTransitionText(currentLine1, nextLine1, 0);
    const displayLine2 = getTransitionText(currentLine2, nextLine2, 1);
    const displayLine3 = getTransitionText(currentLine3, nextLine3, 2);

    p.text(displayLine1, 20, 20);
    p.text(displayLine2, 20, 40);
    p.text(displayLine3, 20, 60);
  };

  const drawCurveLetters = () => {
    // Draw all letters moving down the curves together
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16); // Larger font
    p.noStroke();

    const animationOffset = (frameCounter * 0.3) % 100; // Continuous movement, cycles every 100 points

    for (let curveIndex = 0; curveIndex < curvePaths.length; curveIndex++) {
      const path = curvePaths[curveIndex];
      const currentLetters = curveLetters[curveIndex] || [];
      const nextLetters = nextCurveLetters[curveIndex] || [];

      if (currentLetters.length === 0) continue;

      // Draw all letters along the path with movement, evenly spaced
      for (let i = 0; i < path.length; i += 2) {
        // Every 2nd point for closer spacing
        const letterIndex = Math.floor(i / 2); // Which letter position we're at

        // Determine which letter to show based on transition progress using pushing effect
        let letter;
        if (lineTransitionProgress > 0 && nextLetters.length > 0) {
          // Calculate transition progress for this curve with slight stagger
          const curveTransitionSpeed =
            lineTransitionProgress + curveIndex * 0.1;
          const newLettersToShow = Math.floor(
            curveTransitionSpeed * nextLetters.length,
          );

          if (newLettersToShow > letterIndex) {
            // This position should show a new letter
            letter = nextLetters[letterIndex % nextLetters.length];
          } else {
            // This position should show an old letter, potentially shifted
            const shiftedIndex = letterIndex - newLettersToShow;
            if (shiftedIndex >= 0 && shiftedIndex < currentLetters.length) {
              letter = currentLetters[shiftedIndex % currentLetters.length];
            } else {
              // Old letter has been pushed off, cycle new letters
              letter = nextLetters[letterIndex % nextLetters.length];
            }
          }
        } else {
          letter = currentLetters[letterIndex % currentLetters.length]; // Normal state
        }

        // Add animation offset to create movement
        const animatedPosition = (i + animationOffset) % path.length;
        const pathIndex = Math.floor(animatedPosition);

        if (pathIndex < path.length) {
          const point = path[pathIndex];

          // Add interpolation for smooth movement between path points
          const nextPoint = path[Math.min(pathIndex + 1, path.length - 1)];
          const interpolation = animatedPosition - pathIndex;

          const x = p.lerp(point.x, nextPoint.x, interpolation);
          const y = p.lerp(point.y, nextPoint.y, interpolation);

          // Calculate opacity based on position to fade out at bottom and top
          let opacity = 255;
          const normalizedPosition = animatedPosition / path.length;

          if (normalizedPosition > 0.85) {
            // Fade out in bottom 15% of curve
            const fadeProgress = (normalizedPosition - 0.85) / 0.15;
            opacity = 255 * (1 - fadeProgress);
          } else if (normalizedPosition < 0.15) {
            // Fade in during top 15% of curve
            const fadeProgress = normalizedPosition / 0.15;
            opacity = 255 * fadeProgress;
          }

          // Only draw if opacity is significant
          if (opacity > 10) {
            p.fill(textColor[0], textColor[1], textColor[2], opacity);
            p.text(letter, x, y);
          }
        }
      }
    }
  };

  const drawCurveGuides = () => {
    // Draw the 3 curved dotted lines exactly as shown in the image
    p.stroke(dotColor[0], dotColor[1], dotColor[2], 150);
    p.strokeWeight(1);
    p.noFill();

    for (const path of curvePaths) {
      for (let i = 0; i < path.length; i += 3) {
        // Every 3rd point for dense dotted effect
        const point = path[i];
        p.circle(point.x, point.y, 2);
      }
    }
  };

  const generateDramaticCurvePaths = (
    width: number,
    height: number,
    time: number,
  ) => {
    curvePaths = [];

    // Create dramatically different curves for transitions
    const centerX = width * 0.5;

    // Add more extreme variations for dramatic effect
    const waveAmplitude = width * 0.04; // Even more extreme than normal
    const leftWave = Math.sin(time * 0.03) * waveAmplitude;
    const centerWave = Math.sin(time * 0.028 + Math.PI / 2) * waveAmplitude;
    const rightWave = Math.sin(time * 0.025 + Math.PI) * waveAmplitude;

    // More extreme mouse influence during transitions
    const mouseInfluenceStrength = width * 0.03;
    const leftMouseInfluence = mouseInfluenceX * mouseInfluenceStrength;
    const centerMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 1.2;
    const rightMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 0.9;
    const verticalMouseInfluence =
      mouseInfluenceY * mouseInfluenceStrength * 0.5;

    // Generate dramatically shifted curve patterns
    const shift1 = Math.sin(time * 0.02) * width * 0.15;
    const shift2 = Math.cos(time * 0.018) * width * 0.12;
    const shift3 = Math.sin(time * 0.025 + Math.PI) * width * 0.18;

    // Left curve with dramatic variation
    const leftPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = height * 0.05 + t * height * 0.9;

      let x;
      if (t < 0.2) {
        const localT = t / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.2 + shift1 + smoothT * width * 0.12;
      } else if (t < 0.4) {
        const localT = (t - 0.2) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.08 + shift1 + smoothT * width * 0.15;
      } else if (t < 0.6) {
        const localT = (t - 0.4) / 0.2;
        const smoothT = 0.5 + 0.5 * Math.sin((localT - 0.5) * p.PI);
        x = centerX + width * 0.07 + shift1 - smoothT * width * 0.14;
      } else if (t < 0.8) {
        const localT = (t - 0.6) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.07 + shift1 - smoothT * width * 0.12;
      } else {
        const localT = (t - 0.8) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.07 + shift1 + smoothT * width * 0.2;
      }

      const waveIntensity = Math.sin(t * Math.PI * 1.5) * 0.7 + 0.3;
      x += leftWave * waveIntensity;
      const mouseIntensity = Math.sin(t * Math.PI * 1.1) * 0.9 + 0.1;
      x += leftMouseInfluence * mouseIntensity;
      const adjustedY =
        y + verticalMouseInfluence * Math.sin(t * Math.PI * 2.5) * 0.7;

      leftPath.push({ x, y: adjustedY });
    }

    // Center curve with dramatic variation
    const centerPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = height * 0.05 + t * height * 0.9;

      let x;
      if (t < 0.2) {
        const localT = t / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + shift2 + smoothT * width * 0.1;
      } else if (t < 0.4) {
        const localT = (t - 0.2) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.1 + shift2 - smoothT * width * 0.18;
      } else if (t < 0.6) {
        const localT = (t - 0.4) / 0.2;
        const smoothT = 0.5 + 0.5 * Math.sin((localT - 0.5) * p.PI);
        x = centerX - width * 0.08 + shift2 + smoothT * width * 0.16;
      } else if (t < 0.8) {
        const localT = (t - 0.6) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.08 + shift2 - smoothT * width * 0.14;
      } else {
        const localT = (t - 0.8) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.06 + shift2 - smoothT * width * 0.1;
      }

      const waveIntensity = Math.sin(t * Math.PI * 1.3) * 0.8 + 0.2;
      x += centerWave * waveIntensity;
      const mouseIntensity = Math.sin(t * Math.PI * 1.4) * 1.0;
      x += centerMouseInfluence * mouseIntensity;
      const adjustedY =
        y + verticalMouseInfluence * Math.sin(t * Math.PI * 2.2) * 0.8;

      centerPath.push({ x, y: adjustedY });
    }

    // Right curve with dramatic variation
    const rightPath: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const y = height * 0.05 + t * height * 0.9;

      let x;
      if (t < 0.25) {
        const localT = t / 0.25;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.18 + shift3 - smoothT * width * 0.15;
      } else if (t < 0.45) {
        const localT = (t - 0.25) / 0.2;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX + width * 0.03 + shift3 - smoothT * width * 0.2;
      } else if (t < 0.7) {
        const localT = (t - 0.45) / 0.25;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.17 + shift3 - smoothT * width * 0.1;
      } else {
        const localT = (t - 0.7) / 0.3;
        const smoothT = Math.sin(localT * p.PI * 0.5);
        x = centerX - width * 0.17 + shift3 + smoothT * width * 0.15;
      }

      const waveIntensity = Math.sin(t * Math.PI * 1.7) * 0.6 + 0.4;
      x += rightWave * waveIntensity;
      const mouseIntensity = Math.sin(t * Math.PI * 0.8) * 0.8 + 0.2;
      x += rightMouseInfluence * mouseIntensity;
      const adjustedY =
        y + verticalMouseInfluence * Math.sin(t * Math.PI * 1.9) * 0.6;

      rightPath.push({ x, y: adjustedY });
    }

    curvePaths = [leftPath, centerPath, rightPath];
    curvePaths = curvePaths.map((path) => redistributePoints(path, 100));
  };

  p.draw = () => {
    // Background
    p.background(backgroundColor[0], backgroundColor[1], backgroundColor[2]);

    frameCounter++;

    // Update poem cycling system
    updatePoemCycle();

    // Handle curve generation and morphing
    const [width, height] = getCanvasSize(p);

    if (curveAnimationProgress < 1.0) {
      // During transition, interpolate between current evolved curves and target curves
      // curvePaths contains the source state, targetCurvePaths contains the target state
      for (
        let curveIndex = 0;
        curveIndex < Math.min(curvePaths.length, targetCurvePaths.length);
        curveIndex++
      ) {
        const sourceCurve = curvePaths[curveIndex];
        const targetCurve = targetCurvePaths[curveIndex];

        for (
          let pointIndex = 0;
          pointIndex < Math.min(sourceCurve.length, targetCurve.length);
          pointIndex++
        ) {
          const source = sourceCurve[pointIndex];
          const target = targetCurve[pointIndex];

          const progress = curveAnimationProgress;
          const smoothProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Smooth easing

          curvePaths[curveIndex][pointIndex] = {
            x: source.x + (target.x - source.x) * smoothProgress,
            y: source.y + (target.y - source.y) * smoothProgress,
          };
        }
      }
    } else if (curveBlendProgress < 1.0) {
      // Blending phase - smooth transition from morphed state to wavering
      const staticCurves = curvePaths.map((path) => [...path]); // Morphed final state
      applyCurveWavering(width, height, frameCounter); // Apply wavering to baseline
      const wavedCurves = curvePaths.map((path) => [...path]); // Wavering applied

      // Blend between static morphed state and wavering state
      const blendFactor = 0.5 - 0.5 * Math.cos(curveBlendProgress * Math.PI); // Smooth easing

      for (let curveIndex = 0; curveIndex < curvePaths.length; curveIndex++) {
        for (
          let pointIndex = 0;
          pointIndex < curvePaths[curveIndex].length;
          pointIndex++
        ) {
          const staticPoint = staticCurves[curveIndex][pointIndex];
          const wavedPoint = wavedCurves[curveIndex][pointIndex];

          curvePaths[curveIndex][pointIndex] = {
            x: staticPoint.x + (wavedPoint.x - staticPoint.x) * blendFactor,
            y: staticPoint.y + (wavedPoint.y - staticPoint.y) * blendFactor,
          };
        }
      }
    } else {
      // Normal operation - apply wavering to current baseline positions
      applyCurveWavering(width, height, frameCounter);
    }

    // Draw the poem lines in top left
    drawPoemLines();

    // Draw letters along the curves instead of dots
    drawCurveLetters();
  };

  const applyCurveWavering = (width: number, height: number, time: number) => {
    // Apply normal wavering to the current baseline curves (stored in targetCurvePaths)
    const waveAmplitude = width * 0.025;
    const leftWave = Math.sin(time * 0.02) * waveAmplitude;
    const centerWave = Math.sin(time * 0.025 + Math.PI / 3) * waveAmplitude;
    const rightWave =
      Math.sin(time * 0.018 + (Math.PI * 2) / 3) * waveAmplitude;

    const mouseInfluenceStrength = width * 0.015;
    const leftMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 0.7;
    const centerMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 1.0;
    const rightMouseInfluence = mouseInfluenceX * mouseInfluenceStrength * 0.8;
    const verticalMouseInfluence =
      mouseInfluenceY * mouseInfluenceStrength * 0.3;

    // Apply wavering to each curve
    for (
      let curveIndex = 0;
      curveIndex < targetCurvePaths.length;
      curveIndex++
    ) {
      const baseCurve = targetCurvePaths[curveIndex];
      const wavedCurve: { x: number; y: number }[] = [];

      for (let pointIndex = 0; pointIndex < baseCurve.length; pointIndex++) {
        const basePoint = baseCurve[pointIndex];
        const t = pointIndex / (baseCurve.length - 1);

        let waveEffect = 0;
        let mouseEffect = 0;
        let verticalMouseEffect = 0;

        if (curveIndex === 0) {
          // Left curve
          const waveIntensity = Math.sin(t * Math.PI) * 0.5 + 0.5;
          waveEffect = leftWave * waveIntensity;
          const mouseIntensity = Math.sin(t * Math.PI * 0.8) * 0.8 + 0.2;
          mouseEffect = leftMouseInfluence * mouseIntensity;
          verticalMouseEffect =
            verticalMouseInfluence * Math.sin(t * Math.PI * 2) * 0.5;
        } else if (curveIndex === 1) {
          // Center curve
          const waveIntensity = Math.sin(t * Math.PI) * 0.7 + 0.3;
          waveEffect = centerWave * waveIntensity;
          const mouseIntensity = Math.sin(t * Math.PI * 1.2) * 0.9 + 0.1;
          mouseEffect = centerMouseInfluence * mouseIntensity;
          verticalMouseEffect =
            verticalMouseInfluence * Math.sin(t * Math.PI * 1.8) * 0.6;
        } else {
          // Right curve
          const waveIntensity = Math.sin(t * Math.PI * 1.2) * 0.6 + 0.4;
          waveEffect = rightWave * waveIntensity;
          const mouseIntensity = Math.sin(t * Math.PI * 0.9) * 0.7 + 0.3;
          mouseEffect = rightMouseInfluence * mouseIntensity;
          verticalMouseEffect =
            verticalMouseInfluence * Math.sin(t * Math.PI * 1.5) * 0.4;
        }

        wavedCurve.push({
          x: basePoint.x + waveEffect + mouseEffect,
          y: basePoint.y + verticalMouseEffect,
        });
      }

      curvePaths[curveIndex] = wavedCurve;
    }
  };

  p.windowResized = () => {
    const [width, height] = getCanvasSize(p);
    p.resizeCanvas(width, height);
    initializeCurvePaths(); // Recalculate paths for new dimensions
    distributePoemLetters(); // Redistribute letters for new paths
  };
};

const HourglassCanvas = () => <ReactP5Wrapper sketch={sketch} />;

export default HourglassCanvas;
