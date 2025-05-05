import imageUrls from '@constants/image_urls.json';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize } from '@utils/canvas';
import { KAHU_BLUE, createRandomColorArray } from '@utils/color';
import { Position2D } from '@utils/math';
import { Font, Graphics, Image } from 'p5';
import { POEM } from './poem';

const CONFIG = {
  minSize: 40,
  maxSize: 70,
  maxPolygonSides: 7,
  shapeVariety: 5,
  crossfadeDuration: 6000, // 6 seconds for crossfade
  displayDuration: 10000, // Total display time per line
};

type ShapeType = 'basic' | 'polygon' | 'custom' | 'chaotic';

type CollageImage = Position2D & {
  url: string;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  maskPoints: Position2D[];
  imageIndex: number;
  shapeType: ShapeType;

  maskSides?: number;
  filterType?: string;
  hasBorder?: boolean;
  borderWidth?: number;
  borderColor?: readonly [number, number, number];
  zIndex?: number;
  hasPattern?: boolean;
  patternType?: string;
};

type DecorativeLetter = Position2D & {
  char: string;
  size: number;
  rotation: number;
  color: readonly [number, number, number, number];
};

const sketch = (p: P5CanvasInstance) => {
  let loadedImages: Image[] = [];
  let collageElements: CollageImage[] = [];
  let previousCollageElements: CollageImage[] = []; // Store previous collage for crossfade
  let decorativeLetters: DecorativeLetter[] = [];
  let previousDecorativeLetters: DecorativeLetter[] = []; // Store previous decorative letters
  let bodoniFont: Font;
  let isInitialized = false;
  let sharedMaskGraphic: Graphics;
  let needsUpdate = true;
  let lastRenderTime = 0;
  let isCrossfading = false;
  let crossfadeStartTime = 0;

  // Poem display variables
  const poemLines = POEM.trim().split('\n');
  let currentLineIndex = 0;
  let lastLineChangeTime = 0;
  let currentLineWords: Array<{
    word: string;
    x: number;
    y: number;
    size: number;
    vx: number; // x velocity
    vy: number; // y velocity
    opacity: number; // opacity for fading
  }> = [];

  const decorativeChars = 'TOWARDS;!?&[]{}';

  p.preload = () => {
    // Load subset of images
    const selectedUrls = [...imageUrls]
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    loadedImages = selectedUrls.map((url) => p.loadImage(url));
    bodoniFont = p.loadFont('/interactive-poetry/fonts/bodoni-72-book.ttf');
  };

  // Regenerate all elements
  const generate = () => {
    generateCollage();
    generateDecorativeLetters();
    generatePoemLineDisplay();
  };

  p.setup = () => {
    const [width, height] = getCanvasSize(p);
    p.createCanvas(width, height);
    p.angleMode(p.RADIANS);
    p.imageMode(p.CENTER);
    p.colorMode(p.RGB);
    p.textFont(bodoniFont);
    p.frameRate(30); // Lower framerate to reduce resource usage
    // Create shared maskGraphic once
    sharedMaskGraphic = p.createGraphics(width, height);
    generate();
    isInitialized = true;
    needsUpdate = true;
  };

  const startCrossfade = () => {
    // Set crossfade start time
    crossfadeStartTime = p.millis();
    isCrossfading = true;

    // Store current elements for crossfade
    previousCollageElements = [...collageElements];
    previousDecorativeLetters = [...decorativeLetters];
    generate();
    // Update timing
    lastLineChangeTime = crossfadeStartTime;
    needsUpdate = true;
  };

  const selectRandomShapeType = (): ShapeType =>
    p.random() < 0.6
      ? p.random() < 0.5
        ? 'basic'
        : 'polygon'
      : p.random() < 0.5
      ? 'chaotic'
      : 'custom';

  const selectRandomBasicShape = (): string =>
    p.random() < 0.5 ? 'rectangle' : p.random() < 0.5 ? 'circle' : 'ellipse';

  // Helper to select a random pattern type
  const selectRandomPatternType = (): string => {
    const patternTypes = ['dots', 'lines', 'cross', 'zigzag'];
    return patternTypes[Math.floor(p.random(0, patternTypes.length))];
  };

  // Helper to generate circle or ellipse points
  const generateCircleOrEllipsePoints = (
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    numPoints: number = 24,
  ): Position2D[] => {
    const points: Position2D[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * p.TWO_PI;
      points.push({
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      });
    }
    return points;
  };

  // Simple edge subdivision to create natural, shoreline-like shapes
  const subdivideEdge = (
    p1: Position2D,
    p2: Position2D,
    depth: number,
    roughness: number,
  ): Position2D[] => {
    if (depth <= 0) return [];

    // Create midpoint with perlin noise displacement
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Calculate perpendicular vector for displacement
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.01) return []; // Avoid division by zero or tiny edges

    // Use perlin noise for natural displacement
    const noiseVal = p.noise(midX * 0.01, midY * 0.01) * 2 - 1;
    const displacement = roughness * (depth / 3) * noiseVal;

    const midPoint = {
      x: midX + (-dy / len) * displacement,
      y: midY + (dx / len) * displacement,
    };

    // Recursively subdivide the segments
    const leftSide = subdivideEdge(p1, midPoint, depth - 1, roughness * 0.8);
    const rightSide = subdivideEdge(midPoint, p2, depth - 1, roughness * 0.8);

    return [...leftSide, midPoint, ...rightSide];
  };

  // Unified shape generation function
  const generateShape = (
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    shapeType: ShapeType,
    basicShapeType?: string,
    sides: number = 5,
  ): Position2D[] => {
    const points: Position2D[] = [];
    const radius = Math.min(width, height) / 2;

    if (shapeType === 'basic') {
      if (basicShapeType === 'circle') {
        return generateCircleOrEllipsePoints(centerX, centerY, radius, radius);
      } else if (basicShapeType === 'ellipse') {
        return generateCircleOrEllipsePoints(
          centerX,
          centerY,
          width / 2,
          height / 2,
        );
      } else {
        // Rectangle
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        points.push({ x: centerX - halfWidth, y: centerY - halfHeight });
        points.push({ x: centerX + halfWidth, y: centerY - halfHeight });
        points.push({ x: centerX + halfWidth, y: centerY + halfHeight });
        points.push({ x: centerX - halfWidth, y: centerY + halfHeight });
        return points;
      }
    } else if (shapeType === 'polygon') {
      // Generate polygon
      const angleStep = p.TWO_PI / sides;
      for (let i = 0; i < sides; i++) {
        const angle = i * angleStep;
        const r = radius * (0.8 + p.random(0, 0.4));
        points.push({
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle),
        });
      }
      return points;
    } else {
      // Organic or chaotic shape with perlin noise
      const isHighlyChaotic = shapeType === 'chaotic';
      const basePoints: Position2D[] = [];
      const numPoints = Math.floor(p.random(3, 7));

      // Generate base points with perlin noise variation
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * p.TWO_PI;
        const noiseVal = p.noise(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3);
        const r = radius * (0.6 + noiseVal * (isHighlyChaotic ? 0.7 : 0.5));

        basePoints.push({
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle),
        });
      }

      // Apply recursive subdivision for shoreline effect
      const depth = isHighlyChaotic ? 3 : 2;

      for (let i = 0; i < basePoints.length; i++) {
        const p1 = basePoints[i];
        const p2 = basePoints[(i + 1) % basePoints.length];

        // Add current point
        points.push(p1);

        // Add subdivided points between this point and next
        if (depth > 0) {
          const subdivided = subdivideEdge(
            p1,
            p2,
            depth,
            radius * (isHighlyChaotic ? 0.4 : 0.25),
          );
          points.push(...subdivided);
        }
      }
      return points;
    }
  };

  // Generate collage elements
  const generateCollage = () => {
    const [width, height] = getCanvasSize(p);
    collageElements = [];

    // Set image count and select images
    const imageCount = Math.floor(p.random(8, 12));
    const selectedImages = [...loadedImages]
      .sort(() => Math.random() - 0.5)
      .slice(0, imageCount + 1);

    // Add background image
    if (selectedImages.length > 0) {
      const bgImg = selectedImages[0];
      if (bgImg && bgImg.width) {
        // Size to cover canvas
        const bgAspectRatio = bgImg.width / bgImg.height;
        const bgWidth =
          width / height > bgAspectRatio ? height * bgAspectRatio : width;
        const bgHeight =
          width / height > bgAspectRatio ? height : width / bgAspectRatio;

        // Add background element
        collageElements.push({
          url: imageUrls[0],
          x: width / 2,
          y: height / 2,
          width: bgWidth,
          height: bgHeight,
          opacity: 255,
          rotation: 0,
          maskPoints: generateShape(
            width / 2,
            height / 2,
            bgWidth,
            bgHeight,
            'basic',
            'rectangle',
          ),
          imageIndex: loadedImages.indexOf(bgImg),
          shapeType: 'basic',
          filterType: 'none',
          zIndex: -1,
        });
      }
    }

    // Create collage elements
    for (let i = 1; i < selectedImages.length; i++) {
      const img = selectedImages[i];
      if (!img || !img.width) continue;

      // Calculate size and position
      const aspectRatio = img.width / img.height;
      const sizeVariance = CONFIG.shapeVariety * 5;
      const minSizeAdjusted = CONFIG.minSize - sizeVariance; // 40 - 25 = 15
      const maxSizeAdjusted = CONFIG.maxSize + sizeVariance; // 70 + 25 = 95

      const imgWidth =
        (width *
          (minSizeAdjusted +
            Math.random() * (maxSizeAdjusted - minSizeAdjusted))) /
        100;
      const imgHeight = imgWidth / aspectRatio;

      const x = p.random(imgWidth / 2, width - imgWidth / 2);
      const y = p.random(imgHeight / 2, height - imgHeight / 2);

      // Randomize appearance
      const opacity = (p.random(30, 90) / 100) * 255;
      const rotation = p.random(0, p.TWO_PI);

      // Select shape type
      const shapeType: ShapeType = selectRandomShapeType();

      // Generate shape
      const maskWidth = Math.max(imgWidth, imgHeight) * 0.6;
      let maskPoints: Position2D[] = [];
      let maskSides = 0;
      let basicShape = '';

      // Generate shape points based on type
      if (shapeType === 'basic') {
        basicShape = selectRandomBasicShape();

        maskPoints = generateShape(
          x,
          y,
          basicShape === 'rectangle' ? imgWidth * 0.9 : maskWidth,
          basicShape === 'rectangle'
            ? imgHeight * 0.9
            : basicShape === 'ellipse'
            ? imgHeight * 0.8
            : maskWidth,
          'basic',
          basicShape,
        );
      } else if (shapeType === 'polygon') {
        maskSides = Math.floor(p.random(3, CONFIG.maxPolygonSides + 1));
        maskPoints = generateShape(
          x,
          y,
          maskWidth,
          maskWidth,
          'polygon',
          undefined,
          maskSides,
        );
      } else {
        // Custom or chaotic shape
        maskPoints = generateShape(x, y, maskWidth, maskWidth, shapeType);
      }

      // Additional properties
      const filterTypes = ['none', 'grayscale', 'sepia', 'highContrast'];
      const filterType =
        filterTypes[Math.floor(p.random(0, filterTypes.length))];

      const hasBorder = p.random() < 0.3;
      const hasPattern = p.random() < 0.5;

      // Add to collage elements
      collageElements.push({
        url: imageUrls[i],
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotation,
        maskPoints,
        maskSides,
        imageIndex: loadedImages.indexOf(img),
        shapeType,
        filterType,
        hasBorder,
        borderWidth: hasBorder ? p.random(0.5, 2) : 0,
        borderColor: hasBorder ? createRandomColorArray(p) : [0, 0, 0],
        zIndex: Math.floor(p.random(0, 10)),
        hasPattern,
        patternType: hasPattern ? selectRandomPatternType() : '',
      });
    }

    // Add decorative elements
    const numElements = Math.floor(4);

    for (let i = 0; i < numElements; i++) {
      const x = p.random(width);
      const y = p.random(height);
      const size = p.random(30, 80);
      const rotation = p.random(0, p.TWO_PI);
      const shapeType: ShapeType = p.random() < 0.5 ? 'basic' : 'custom';
      const hasPattern = p.random() < 0.9;

      collageElements.push({
        url: '',
        x,
        y,
        width: size,
        height: size,
        opacity: (p.random(40, 100) / 100) * 255,
        rotation,
        maskPoints: generateShape(
          x,
          y,
          size,
          size,
          shapeType,
          shapeType === 'basic' ? selectRandomBasicShape() : undefined,
        ),
        imageIndex: -1,
        shapeType,
        hasBorder: true,
        borderWidth: p.random(1, 3),
        borderColor: createRandomColorArray(p),
        zIndex: Math.floor(p.random(0, 10)),
        hasPattern,
        patternType: hasPattern ? selectRandomPatternType() : '',
      });
    }

    // Sort by z-index
    collageElements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  // Generate random decorative letters
  const generateDecorativeLetters = () => {
    const [width, height] = getCanvasSize(p);
    decorativeLetters = [];

    const letterCount = Math.floor(p.random(3, 10));

    // One large letter
    decorativeLetters.push({
      char: decorativeChars[Math.floor(p.random(decorativeChars.length))],
      x: p.random(width * 0.2, width * 0.8),
      y: p.random(height * 0.2, height * 0.8),
      size: p.random(height * 0.8, height * 1.5),
      rotation: p.random(-p.PI / 6, p.PI / 6),
      color: [p.random(0, 40), p.random(0, 40), p.random(0, 40), 255],
    });

    // Smaller letters
    for (let i = 1; i < letterCount; i++) {
      decorativeLetters.push({
        char: decorativeChars[Math.floor(p.random(decorativeChars.length))],
        x: p.random(0, width),
        y: p.random(0, height),
        size: p.lerp(18, height * 0.25, Math.pow(p.random(), 1.5)),
        rotation: p.random(-p.PI / 4, p.PI / 4),
        color: [p.random(0, 50), p.random(0, 50), p.random(0, 50), 255],
      });
    }
  };

  // Generate the display for the current poem line
  const generatePoemLineDisplay = () => {
    const [width, height] = getCanvasSize(p);
    currentLineWords = [];

    if (currentLineIndex < poemLines.length) {
      const line = poemLines[currentLineIndex];
      const words = line.trim().split(/\s+/);

      // Setup variables for positioning
      const numWords = words.length;
      const spacing = width / (numWords + 1);
      let currentY = p.random(height * 0.2, height * 0.8);

      words.forEach((word, index) => {
        // Add some vertical variation but maintain general top-to-bottom order
        currentY += p.random(-20, 40);
        currentY = Math.max(50, Math.min(height - 50, currentY));
        // Add random velocity (speed & direction)
        const speed = p.random(0.3, 1.2);
        const angle = p.random(0, p.TWO_PI);

        currentLineWords.push({
          word,
          // Calculate random position with horizontal order maintained
          x: spacing * (index + 0.5) + p.random(-spacing * 0.3, spacing * 0.3),
          y: currentY,
          size: p.random(30, 80), // Random size between 30px and 80px
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          opacity: 0, // Start with 0 opacity for fade-in
        });
      });
    }
  };

  // Helper to draw a pattern
  const drawPattern = (element: CollageImage, patternType: string) => {
    p.push();
    p.noFill();
    p.stroke(
      element.borderColor?.[0] || 0,
      element.borderColor?.[1] || 0,
      element.borderColor?.[2] || 0,
      element.opacity * 0.7,
    );
    p.strokeWeight(1);

    const size = Math.min(element.width, element.height);
    const halfSize = size / 2;
    const spacing = size / 8;

    const patterns: Record<string, () => void> = {
      dots: () => {
        for (let x = -halfSize; x <= halfSize; x += spacing) {
          for (let y = -halfSize; y <= halfSize; y += spacing) {
            p.point(x, y);
          }
        }
      },
      lines: () => {
        for (let i = -halfSize; i <= halfSize; i += spacing) {
          p.line(-halfSize, i, halfSize, i);
          p.line(i, -halfSize, i, halfSize);
        }
      },
      cross: () => {
        for (let i = -size; i <= size; i += spacing) {
          p.line(i, -size, i + size, size);
          p.line(i, size, i + size, -size);
        }
      },
      zigzag: () => {
        p.beginShape();
        for (let x = -halfSize; x <= halfSize; x += spacing) {
          p.vertex(x, (x / spacing) % 2 === 0 ? halfSize / 4 : -halfSize / 4);
        }
        p.endShape();
      },
    };

    patterns[patternType]?.();

    p.pop();
  };

  // Draw patterns and apply filters - combined function
  const drawElementContent = (element: CollageImage) => {
    // Draw image if available
    if (element.imageIndex >= 0 && element.imageIndex < loadedImages.length) {
      const img = loadedImages[element.imageIndex];
      if (img && img.width) {
        try {
          // Use the shared maskGraphic and resize if needed
          if (
            element.width * 1.5 > sharedMaskGraphic.width ||
            element.height * 1.5 > sharedMaskGraphic.height
          ) {
            sharedMaskGraphic.resizeCanvas(
              Math.max(sharedMaskGraphic.width, element.width * 1.5),
              Math.max(sharedMaskGraphic.height, element.height * 1.5),
            );
          }

          // Clear the graphic and reset settings
          sharedMaskGraphic.clear();
          sharedMaskGraphic.resetMatrix();
          sharedMaskGraphic.noTint();

          // Set up the mask
          sharedMaskGraphic.translate(
            sharedMaskGraphic.width / 2,
            sharedMaskGraphic.height / 2,
          );

          // Draw mask shape
          sharedMaskGraphic.noStroke();
          sharedMaskGraphic.fill(255);
          sharedMaskGraphic.beginShape();
          element.maskPoints.forEach((point) => {
            sharedMaskGraphic.vertex(point.x - element.x, point.y - element.y);
          });
          sharedMaskGraphic.endShape(p.CLOSE);

          // Apply mask
          sharedMaskGraphic.drawingContext.globalCompositeOperation =
            'source-in';
          sharedMaskGraphic.imageMode(p.CENTER);

          // Apply filter if specified
          if (element.filterType) {
            switch (element.filterType) {
              case 'grayscale':
                sharedMaskGraphic.filter(p.GRAY);
                break;
              case 'sepia':
                sharedMaskGraphic.tint(220, 180, 120);
                break;
              case 'highContrast':
                sharedMaskGraphic.filter(p.GRAY);
                sharedMaskGraphic.filter(p.THRESHOLD, 0.6);
                break;
            }
          }

          sharedMaskGraphic.image(img, 0, 0, element.width, element.height);
          p.tint(255, element.opacity);

          // Draw at the correct position
          p.image(sharedMaskGraphic, 0, 0);

          // Reset globalCompositeOperation between uses
          sharedMaskGraphic.drawingContext.globalCompositeOperation =
            'source-over';
        } catch (e) {
          console.error('Error drawing element', e);
        }
      }
    }
    // Draw pattern if specified
    else if (element.hasPattern && element.patternType) {
      drawPattern(element, element.patternType);
    }
  };

  // Draw border for a shape
  const drawShapeBorder = (element: CollageImage, opacity: number = 255) => {
    if (element.hasBorder && element.borderWidth && element.borderColor) {
      p.noFill();
      p.stroke(
        element.borderColor[0],
        element.borderColor[1],
        element.borderColor[2],
        opacity,
      );
      p.strokeWeight(element.borderWidth);
      p.beginShape();
      element.maskPoints.forEach((point) => {
        p.vertex(point.x - element.x, point.y - element.y);
      });
      p.endShape(p.CLOSE);
    }
  };

  // Helper to draw a single decorative letter
  const drawDecorativeLetter = (
    letter: DecorativeLetter,
    opacityFactor: number = 1,
  ) => {
    p.push();
    p.translate(letter.x, letter.y);
    p.rotate(letter.rotation);
    // Apply opacity factor to color
    p.fill(
      letter.color[0],
      letter.color[1],
      letter.color[2],
      letter.color[3] * opacityFactor,
    );
    p.textSize(letter.size);
    p.text(letter.char, 0, 0);
    p.pop();
  };

  // Calculate crossfade progress
  const getCrossfadeProgress = () => {
    const currentTime = p.millis();
    if (!isCrossfading) return 1;

    const progress =
      (currentTime - crossfadeStartTime) / CONFIG.crossfadeDuration;
    const constrainedProgress = p.constrain(progress, 0, 1);

    // Handle crossfade completion
    if (progress >= 1) {
      isCrossfading = false;
      previousCollageElements = [];
      previousDecorativeLetters = [];
    }

    return constrainedProgress;
  };

  // Draw collage elements with crossfade
  const drawCollageElements = () => {
    const crossfadeProgress = getCrossfadeProgress();

    // Draw previous collage elements with fading opacity
    if (isCrossfading && previousCollageElements.length > 0) {
      const fadeOutOpacity = 1 - crossfadeProgress;

      previousCollageElements.forEach((element) => {
        p.push();
        p.translate(element.x, element.y);
        p.rotate(element.rotation);
        // Adjust opacity for fade out
        if (element.opacity !== undefined) {
          element.opacity = element.opacity * fadeOutOpacity;
        }
        // Draw content
        drawElementContent(element);
        // Draw border with reduced opacity
        drawShapeBorder(element, fadeOutOpacity * 255);

        p.pop();
      });
    }

    // Draw current collage elements with fading in opacity
    collageElements.forEach((element) => {
      p.push();
      p.translate(element.x, element.y);
      p.rotate(element.rotation);

      // Adjust opacity for fade in if crossfading
      const originalOpacity = element.opacity;
      if (isCrossfading) {
        element.opacity = originalOpacity * crossfadeProgress;
      }
      // Draw content
      drawElementContent(element);
      // Restore original opacity
      element.opacity = originalOpacity;
      // Draw border
      const borderOpacity = isCrossfading ? crossfadeProgress * 255 : 255;
      drawShapeBorder(element, borderOpacity);

      p.pop();
    });
  };

  // Draw decorative letters with crossfade
  const drawDecorativeLetters = () => {
    if (!bodoniFont) return;

    const crossfadeProgress = getCrossfadeProgress();

    p.push();
    p.textFont(bodoniFont);
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // Draw previous decorative letters with fading opacity
    if (isCrossfading && previousDecorativeLetters.length > 0) {
      const fadeOutOpacity = 1 - crossfadeProgress;
      previousDecorativeLetters.forEach((letter) =>
        drawDecorativeLetter(letter, fadeOutOpacity),
      );
    }

    // Draw current decorative letters with fading in opacity
    decorativeLetters.forEach((letter) =>
      drawDecorativeLetter(letter, isCrossfading ? crossfadeProgress : 1),
    );

    p.pop();
  };

  // Draw background grid and decorative elements
  const drawBackground = () => {
    p.push();
    p.stroke(200, 200, 200, 15);
    p.strokeWeight(0.5);

    // Draw grid
    const gridSize = 50;
    for (let x = 0; x < p.width; x += gridSize) p.line(x, 0, x, p.height);
    for (let y = 0; y < p.height; y += gridSize) p.line(0, y, p.width, y);

    // Additional background elements for higher variety
    p.noFill();
    p.stroke(200, 200, 200, 10);
    p.strokeWeight(1);

    const elementCount = CONFIG.shapeVariety * 1.5;
    for (let i = 0; i < elementCount; i++) {
      const x = p.random(p.width);
      const y = p.random(p.height);
      const size = p.random(50, 200);

      // Draw random shape
      const shapeType = Math.floor(p.random(3));
      if (shapeType === 0) p.ellipse(x, y, size, size);
      else if (shapeType === 1) p.rect(x - size / 2, y - size / 2, size, size);
      // No need to check shapeVariety >= 4
      else p.line(x, y, p.random(p.width), p.random(p.height));
    }
    p.pop();
  };

  p.draw = () => {
    // Only redraw if needed (reduces WebGL context usage)
    if (!needsUpdate && p.millis() - lastRenderTime < 1000) {
      return;
    }

    lastRenderTime = p.millis();
    needsUpdate = false;

    p.background(245);

    drawBackground();
    drawCollageElements();
    drawDecorativeLetters();

    // Update and draw poem line words
    if (bodoniFont) {
      p.push();
      p.textFont(bodoniFont);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();

      // Calculate fade timing - use crossfadeStartTime for synchronization
      const currentTime = p.millis();
      let wordOpacityFactor = 1;

      // When crossfading, words should fade with the same timing
      if (isCrossfading) {
        const progress = getCrossfadeProgress();
        // First half of crossfade - fade in
        if (progress < 0.3) {
          wordOpacityFactor = progress * (1 / 0.3); // 0 to 1 during first 30%
        } else {
          wordOpacityFactor = 1; // stay at full opacity
        }
      } else {
        // When not crossfading, check if we're near the end of display time
        // Delay fade out until very close to the end - only fade during the last 20% of the remaining time
        const timeRemaining =
          CONFIG.displayDuration - (currentTime - lastLineChangeTime);
        if (timeRemaining < CONFIG.crossfadeDuration * 0.2) {
          // Fade out during last part of display time
          wordOpacityFactor = timeRemaining / (CONFIG.crossfadeDuration * 0.2);
          wordOpacityFactor = p.constrain(wordOpacityFactor, 0, 1);
        }
      }

      // Update positions and opacity based on velocity vectors
      const [width, height] = getCanvasSize(p);
      currentLineWords.forEach((word) => {
        // Update position
        word.x += word.vx;
        word.y += word.vy;

        // Bounce off canvas edges
        if (word.x < word.size / 2) {
          word.x = word.size / 2;
          word.vx = Math.abs(word.vx);
        } else if (word.x > width - word.size / 2) {
          word.x = width - word.size / 2;
          word.vx = -Math.abs(word.vx);
        }

        if (word.y < word.size / 2) {
          word.y = word.size / 2;
          word.vy = Math.abs(word.vy);
        } else if (word.y > height - word.size / 2) {
          word.y = height - word.size / 2;
          word.vy = -Math.abs(word.vy);
        }

        p.fill(...KAHU_BLUE);
        p.textSize(word.size);
        p.text(word.word, word.x, word.y);
      });

      p.pop();
    }

    // Check if it's time to update the line
    const currentTime = p.millis();
    if (currentTime - lastLineChangeTime > CONFIG.displayDuration) {
      currentLineIndex = (currentLineIndex + 1) % poemLines.length;
      startCrossfade();
    } else {
      // Always need to update during crossfading or for word movement
      needsUpdate = isCrossfading || currentLineWords.length > 0;
    }
  };

  // Handle window resize
  p.windowResized = () => {
    const [width, height] = getCanvasSize(p);
    p.resizeCanvas(width, height);

    try {
      // Resize shared mask graphic
      sharedMaskGraphic.resizeCanvas(width, height);
    } catch (e) {
      console.error('Error resizing shared graphic', e);
      // Create a new graphic if resizing fails
      sharedMaskGraphic = p.createGraphics(width, height);
    }

    if (isInitialized) {
      startCrossfade();
    }
  };

  // Regenerate collage when clicked
  p.mouseClicked = () => {
    startCrossfade();
  };
};

const TowardsCanvas = () => <ReactP5Wrapper sketch={sketch} />;

export default TowardsCanvas;
