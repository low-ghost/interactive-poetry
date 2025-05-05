import imageUrls from '@constants/image_urls.json';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize } from '@utils/canvas';
import { KAHU_BLUE, createRandomColor } from '@utils/color';
import { Position2D } from '@utils/math';
import { Font, Graphics, Image } from 'p5';
import { POEM } from './poem';

const CONFIG = {
  minSize: 40,
  maxSize: 70,
  maxPolygonSides: 7,
  shapeVariety: 5,
};

type ShapeType = 'basic' | 'polygon' | 'custom' | 'chaotic';

type CollageImage = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  maskPoints: Position2D[];
  imageIndex: number;
  shapeType: ShapeType;
  // Optional properties
  maskSides?: number;
  filterType?: string;
  hasBorder?: boolean;
  borderWidth?: number;
  borderColor?: number[];
  zIndex?: number;
  hasPattern?: boolean;
  patternType?: string;
};

const sketch = (p: P5CanvasInstance) => {
  let loadedImages: Image[] = [];
  let collageElements: CollageImage[] = [];
  let previousCollageElements: CollageImage[] = []; // Store previous collage for crossfade
  let decorativeLetters: {
    char: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: number[];
  }[] = [];
  let previousDecorativeLetters: {
    char: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: number[];
  }[] = []; // Store previous decorative letters
  let bodoniFont: Font;
  let isInitialized = false;
  let sharedMaskGraphic: Graphics;
  let needsUpdate = true;
  let lastRenderTime = 0;
  let isCrossfading = false;
  let crossfadeStartTime = 0;
  const CROSSFADE_DURATION = 6000; // 6 seconds for crossfade
  const DISPLAY_DURATION = 10000; // Total display time per line

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

  const decorativeChars = [
    'A',
    'B',
    'F',
    'O',
    'R',
    'S',
    'T',
    '.',
    ',',
    ';',
    '!',
    '?',
    '&',
    '[',
    ']',
    '{',
    '}',
  ];

  p.preload = () => {
    // Load subset of images
    const selectedUrls = [...imageUrls]
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    loadedImages = selectedUrls.map((url) => p.loadImage(url));
    bodoniFont = p.loadFont('/interactive-poetry/fonts/bodoni-72-book.ttf');
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

    generateCollage();
    generateDecorativeLetters();
    generatePoemLineDisplay();
    isInitialized = true;
    needsUpdate = true;
  };

  // Helper function to get random color as RGB array
  const getRandomColorArray = (): number[] => {
    const c = createRandomColor(p);
    return [
      Math.floor(p.red(c)),
      Math.floor(p.green(c)),
      Math.floor(p.blue(c)),
    ];
  };

  // Generate a new collage
  const generateCollage = () => {
    const [width, height] = getCanvasSize(p);

    // Store current collage elements for crossfade if we have any
    if (collageElements.length > 0) {
      previousCollageElements = [...collageElements];
      // Note: We now set crossfadeStartTime and isCrossfading in the line change code
      // to ensure synchronization with text changes
    }

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
      const minSizeAdjusted = Math.max(10, CONFIG.minSize - sizeVariance);
      const maxSizeAdjusted = Math.min(95, CONFIG.maxSize + sizeVariance);

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
      const rotation = p.random(
        0,
        p.TWO_PI * Math.min(1, CONFIG.shapeVariety / 5),
      );

      // Select shape type
      const shapeType: ShapeType =
        p.random() < 0.6
          ? p.random() < 0.5
            ? 'basic'
            : 'polygon'
          : p.random() < 0.5
          ? 'chaotic'
          : 'custom';

      // Generate shape
      const maskWidth = Math.max(imgWidth, imgHeight) * 0.6;
      let maskPoints: Position2D[] = [];
      let maskSides = 0;
      let basicShape = '';

      // Generate shape points based on type
      if (shapeType === 'basic') {
        basicShape =
          p.random() < 0.5
            ? 'rectangle'
            : p.random() < 0.5
            ? 'circle'
            : 'ellipse';

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
      const hasPattern = CONFIG.shapeVariety > 2 && p.random() < 0.5;

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
        borderWidth: hasBorder ? p.random(1, 5) : 0,
        borderColor: hasBorder ? getRandomColorArray() : [0, 0, 0],
        zIndex: Math.floor(p.random(0, 10)),
        hasPattern,
        patternType: hasPattern
          ? ['dots', 'lines', 'cross', 'zigzag'][Math.floor(p.random(0, 4))]
          : '',
      });
    }

    // Add decorative elements conditionally
    if (CONFIG.shapeVariety >= 4) {
      // Add decorative elements
      const numElements = Math.floor(CONFIG.shapeVariety * 0.8);

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
            shapeType === 'basic'
              ? p.random() < 0.5
                ? 'circle'
                : 'ellipse'
              : undefined,
          ),
          imageIndex: -1,
          shapeType,
          hasBorder: true,
          borderWidth: p.random(1, 3),
          borderColor: getRandomColorArray(),
          zIndex: Math.floor(p.random(0, 10)),
          hasPattern,
          patternType: hasPattern
            ? ['dots', 'lines', 'cross', 'zigzag'][Math.floor(p.random(0, 4))]
            : '',
        });
      }
    }

    // Sort by z-index
    collageElements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
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
      if (basicShapeType === 'circle' || basicShapeType === 'ellipse') {
        // Generate circle/ellipse points
        const numPoints = 24;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * p.TWO_PI;
          points.push({
            x:
              centerX +
              (basicShapeType === 'circle' ? radius : width / 2) *
                Math.cos(angle),
            y:
              centerY +
              (basicShapeType === 'circle' ? radius : height / 2) *
                Math.sin(angle),
          });
        }
      } else {
        // Rectangle
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        points.push({ x: centerX - halfWidth, y: centerY - halfHeight });
        points.push({ x: centerX + halfWidth, y: centerY - halfHeight });
        points.push({ x: centerX + halfWidth, y: centerY + halfHeight });
        points.push({ x: centerX - halfWidth, y: centerY + halfHeight });
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

  // Generate random decorative letters
  const generateDecorativeLetters = () => {
    const [width, height] = getCanvasSize(p);

    // Store current decorative letters for crossfade
    if (decorativeLetters.length > 0) {
      previousDecorativeLetters = [...decorativeLetters];
    }

    decorativeLetters = [];

    // Adjust letter count based on shape variety
    const letterCount = Math.floor(p.random(3, 5 + CONFIG.shapeVariety));

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
        // Calculate random position with horizontal order maintained
        const x =
          spacing * (index + 0.5) + p.random(-spacing * 0.3, spacing * 0.3);

        // Add some vertical variation but maintain general top-to-bottom order
        currentY += p.random(-20, 40);
        currentY = Math.max(50, Math.min(height - 50, currentY));

        // Random size between 30px and 80px (slightly larger than before)
        const size = p.random(30, 80);

        // Add random velocity (speed & direction)
        const speed = p.random(0.3, 1.2);
        const angle = p.random(0, p.TWO_PI);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        currentLineWords.push({
          word,
          x,
          y: currentY,
          size,
          vx,
          vy,
          opacity: 0, // Start with 0 opacity for fade-in
        });
      });
    }
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
      const size = Math.min(element.width, element.height);
      const halfSize = size / 2;
      const spacing = size / 8;

      p.push();
      p.noFill();
      p.stroke(
        element.borderColor?.[0] || 0,
        element.borderColor?.[1] || 0,
        element.borderColor?.[2] || 0,
        element.opacity * 0.7,
      );
      p.strokeWeight(1);

      switch (element.patternType) {
        case 'dots':
          for (let x = -halfSize; x <= halfSize; x += spacing) {
            for (let y = -halfSize; y <= halfSize; y += spacing) {
              p.point(x, y);
            }
          }
          break;
        case 'lines':
          for (let i = -halfSize; i <= halfSize; i += spacing) {
            p.line(-halfSize, i, halfSize, i);
            p.line(i, -halfSize, i, halfSize);
          }
          break;
        case 'cross':
          for (let i = -size; i <= size; i += spacing) {
            p.line(i, -size, i + size, size);
            p.line(i, size, i + size, -size);
          }
          break;
        case 'zigzag':
          p.beginShape();
          for (let x = -halfSize; x <= halfSize; x += spacing) {
            p.vertex(x, (x / spacing) % 2 === 0 ? halfSize / 4 : -halfSize / 4);
          }
          p.endShape();
          break;
      }
      p.pop();
    }
  };

  // Draw collage elements with crossfade
  const drawCollageElements = () => {
    const currentTime = p.millis();
    let crossfadeProgress = 0;

    if (isCrossfading) {
      // Calculate crossfade progress
      crossfadeProgress =
        (currentTime - crossfadeStartTime) / CROSSFADE_DURATION;
      if (crossfadeProgress >= 1) {
        // Crossfade complete
        isCrossfading = false;
        previousCollageElements = [];
        crossfadeProgress = 1;
      }
    }

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

        // Draw border if specified with reduced opacity
        if (element.hasBorder && element.borderWidth && element.borderColor) {
          p.noFill();
          p.stroke(
            element.borderColor[0],
            element.borderColor[1],
            element.borderColor[2],
            fadeOutOpacity * 255,
          );
          p.strokeWeight(element.borderWidth);
          p.beginShape();
          element.maskPoints.forEach((point) => {
            p.vertex(point.x - element.x, point.y - element.y);
          });
          p.endShape(p.CLOSE);
        }

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

      // Draw border if specified
      if (element.hasBorder && element.borderWidth && element.borderColor) {
        p.noFill();
        const borderOpacity = isCrossfading ? crossfadeProgress * 255 : 255;
        p.stroke(
          element.borderColor[0],
          element.borderColor[1],
          element.borderColor[2],
          borderOpacity,
        );
        p.strokeWeight(element.borderWidth);
        p.beginShape();
        element.maskPoints.forEach((point) => {
          p.vertex(point.x - element.x, point.y - element.y);
        });
        p.endShape(p.CLOSE);
      }

      p.pop();
    });
  };

  // Draw decorative letters with crossfade
  const drawDecorativeLetters = () => {
    if (!bodoniFont) return;

    const currentTime = p.millis();
    let crossfadeProgress = 0;

    if (isCrossfading) {
      // Calculate crossfade progress
      crossfadeProgress =
        (currentTime - crossfadeStartTime) / CROSSFADE_DURATION;
      crossfadeProgress = p.constrain(crossfadeProgress, 0, 1);
    }

    p.push();
    p.textFont(bodoniFont);
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // Draw previous decorative letters with fading opacity
    if (isCrossfading && previousDecorativeLetters.length > 0) {
      const fadeOutOpacity = 1 - crossfadeProgress;

      previousDecorativeLetters.forEach((letter) => {
        p.push();
        p.translate(letter.x, letter.y);
        p.rotate(letter.rotation);
        // Apply fade out to color
        p.fill(
          letter.color[0],
          letter.color[1],
          letter.color[2],
          letter.color[3] * fadeOutOpacity,
        );
        p.textSize(letter.size);
        p.text(letter.char, 0, 0);
        p.pop();
      });
    }

    // Draw current decorative letters with fading in opacity
    decorativeLetters.forEach((letter) => {
      p.push();
      p.translate(letter.x, letter.y);
      p.rotate(letter.rotation);
      // Apply fade in if crossfading
      const opacity = isCrossfading
        ? letter.color[3] * crossfadeProgress
        : letter.color[3];
      p.fill(letter.color[0], letter.color[1], letter.color[2], opacity);
      p.textSize(letter.size);
      p.text(letter.char, 0, 0);
      p.pop();
    });

    p.pop();
  };

  // Unified crossfade progress calculation
  const getCrossfadeProgress = () => {
    const currentTime = p.millis();
    if (!isCrossfading) return 1;

    const progress = (currentTime - crossfadeStartTime) / CROSSFADE_DURATION;
    return p.constrain(progress, 0, 1);
  };

  // Draw the canvas - changed to only redraw when needed
  p.draw = () => {
    // Only redraw if needed (reduces WebGL context usage)
    if (!needsUpdate && p.millis() - lastRenderTime < 1000) {
      return;
    }

    lastRenderTime = p.millis();
    needsUpdate = false;

    p.background(245);

    // Draw background grid
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
      const size = p.random(50, CONFIG.shapeVariety >= 4 ? 200 : 100);

      // Draw random shape
      const shapeType = Math.floor(p.random(3));
      if (shapeType === 0) p.ellipse(x, y, size, size);
      else if (shapeType === 1 && CONFIG.shapeVariety >= 4)
        p.rect(x - size / 2, y - size / 2, size, size);
      else p.line(x, y, p.random(p.width), p.random(p.height));
    }
    p.pop();

    // Draw collage elements with crossfade
    drawCollageElements();

    // Draw decorative letters with crossfade
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
          DISPLAY_DURATION - (currentTime - lastLineChangeTime);
        if (timeRemaining < CROSSFADE_DURATION * 0.2) {
          // Fade out during last part of display time
          wordOpacityFactor = timeRemaining / (CROSSFADE_DURATION * 0.2);
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

        // Set opacity based on the unified crossfade progress
        word.opacity = 220 * wordOpacityFactor;

        // Draw the word with calculated opacity
        p.fill(KAHU_BLUE[0], KAHU_BLUE[1], KAHU_BLUE[2], word.opacity);
        p.textSize(word.size);
        p.text(word.word, word.x, word.y);
      });

      p.pop();
    }

    // Check if it's time to update the line
    const currentTime = p.millis();
    if (currentTime - lastLineChangeTime > DISPLAY_DURATION) {
      currentLineIndex = (currentLineIndex + 1) % poemLines.length;
      // Set crossfade start time to match the line change time
      crossfadeStartTime = currentTime;
      isCrossfading = true;
      // Regenerate collage and decorative elements when text changes
      generateCollage();
      generateDecorativeLetters();
      generatePoemLineDisplay();
      lastLineChangeTime = currentTime;
      needsUpdate = true;
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
      generateCollage();
      generateDecorativeLetters();
      generatePoemLineDisplay();
      needsUpdate = true;
    }
  };

  // Regenerate collage when clicked
  p.mouseClicked = () => {
    generateCollage();
    generateDecorativeLetters();
    generatePoemLineDisplay();
    needsUpdate = true;
  };
};

// React component for the collage canvas with proper resource management
const CollageCanvas = () => <ReactP5Wrapper sketch={sketch} />;

export default CollageCanvas;
