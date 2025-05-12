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
  crossfadeDuration: 2500, // ms
  displayDuration: 8000, // ms
  preloadImageCount: 20,
  collageImageCountMin: 8,
  collageImageCountMax: 12,
  decorativeElementCount: 4,
  decorativeLetterCountMin: 3,
  decorativeLetterCountMax: 10,
  baseFrameRate: 30,
  wordBounceRestitution: 0.8,
  graphicPadding: 20,
  randomWordsPerLine: {
    min: 3,
    max: 4,
  },
};

enum ShapeType {
  Basic = 'basic',
  Polygon = 'polygon',
  Custom = 'custom',
  Chaotic = 'chaotic',
}

enum BasicShape {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Ellipse = 'ellipse',
}

enum FilterType {
  None = 'none',
  Grayscale = 'grayscale',
  Sepia = 'sepia',
  HighContrast = 'highContrast',
}

enum PatternType {
  Dots = 'dots',
  Lines = 'lines',
  Cross = 'cross',
  Zigzag = 'zigzag',
}

const DECORATIVE_CHARS = 'TOWARDS;!?&[]{}';

type CollageElement = Position2D & {
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  maskPoints: Position2D[];
  imageIndex: number;
  shapeType: ShapeType;
  renderedElement?: Graphics;
  maskSides?: number;
  filterType?: FilterType;
  hasBorder?: boolean;
  borderWidth?: number;
  borderColor?: readonly [number, number, number];
  zIndex?: number;
  hasPattern?: boolean;
  patternType?: PatternType;
};

type DecorativeLetter = Position2D & {
  char: string;
  size: number;
  rotation: number;
  color: readonly [number, number, number, number];
};

type PoemWord = {
  word: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
};

const cleanupRenderedGraphics = (elements: CollageElement[]) => {
  elements.forEach((element) => {
    element.renderedElement?.remove();
    element.renderedElement = undefined;
  });
};

const sketch = (p: P5CanvasInstance<any>) => {
  let loadedImages: Image[] = [];
  let collageElements: CollageElement[] = [];
  let previousCollageElements: CollageElement[] = [];
  let decorativeLetters: DecorativeLetter[] = [];
  let previousDecorativeLetters: DecorativeLetter[] = [];
  let bodoniFont: Font;
  let isInitialized = false;
  let needsUpdate = true;
  let isCrossfading = false;
  let crossfadeStartTime = 0;
  let currentLineWords: PoemWord[] = [];
  let previousLineWords: PoemWord[] = [];
  let stillAnimatingWords = false;
  let hasCompletedFirstIteration = false;
  let remixedWords: string[] = [];

  // Test variable to force remixed behavior from start
  const TEST_FORCE_REMIX = false;

  const poemLines = POEM.trim().split('\n');
  let currentLineIndex = 0;
  let lastLineChangeTime = 0;

  const generateRemixedLine = () => {
    if (remixedWords.length === 0) {
      const allWords = poemLines
        .join(' ')
        .split(/\s+/)
        .filter((word) => word.length > 0);

      remixedWords = [...allWords].sort(() => Math.random() - 0.5);
    }

    const numWords = Math.floor(
      p.random(
        CONFIG.randomWordsPerLine.min,
        CONFIG.randomWordsPerLine.max + 1,
      ),
    );
    const words: string[] = [];

    for (let i = 0; i < numWords && remixedWords.length > 0; i++) {
      const word = remixedWords.shift();
      if (word) words.push(word);
    }

    if (remixedWords.length === 0) {
      const allWords = poemLines
        .join(' ')
        .split(/\s+/)
        .filter((word) => word.length > 0);
      remixedWords = [...allWords].sort(() => Math.random() - 0.5);
    }

    return words.join(' ');
  };

  p.preload = () => {
    const urlsToLoad = [...imageUrls]
      .sort(() => 0.5 - Math.random())
      .slice(0, CONFIG.preloadImageCount);
    loadedImages = urlsToLoad.map((url) => p.loadImage(url));
    bodoniFont = p.loadFont('/interactive-poetry/fonts/bodoni-72-book.ttf');
  };

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
    p.colorMode(p.RGB, 255);
    p.textFont(bodoniFont);
    p.frameRate(CONFIG.baseFrameRate);
    generate();
    isInitialized = true;
    needsUpdate = true;
    lastLineChangeTime = p.millis();
    const handleResize = () => p.windowResized();
    document.addEventListener('fullscreenchange', handleResize);
  };

  const startCrossfade = () => {
    crossfadeStartTime = p.millis();
    isCrossfading = true;
    previousCollageElements = [...collageElements];
    previousDecorativeLetters = [...decorativeLetters];
    previousLineWords = [...currentLineWords];
    generate();
    lastLineChangeTime = crossfadeStartTime;
    needsUpdate = true;
  };

  const selectRandomShapeType = (): ShapeType => {
    const rand = p.random();
    return rand < 0.3
      ? ShapeType.Basic
      : rand < 0.6
      ? ShapeType.Polygon
      : rand < 0.85
      ? ShapeType.Custom
      : ShapeType.Chaotic;
  };

  const selectRandomBasicShape = (): BasicShape => {
    const rand = p.random();
    return rand < 0.4
      ? BasicShape.Rectangle
      : rand < 0.7
      ? BasicShape.Circle
      : BasicShape.Ellipse;
  };

  const selectRandomPatternType = (): PatternType =>
    p.random(Object.values(PatternType));

  const selectRandomFilterType = (): FilterType => {
    const types = Object.values(FilterType);
    return p.random() < 0.4
      ? FilterType.None
      : p.random(types.filter((f) => f !== FilterType.None));
  };

  const generateCircleOrEllipsePoints = (
    radiusX: number,
    radiusY: number,
    numPoints: number = 24,
  ): Position2D[] => {
    const points: Position2D[] = [];
    const angleStep = p.TWO_PI / numPoints;
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      points.push({
        x: radiusX * Math.cos(angle),
        y: radiusY * Math.sin(angle),
      });
    }
    return points;
  };

  const subdivideEdge = (
    p1: Position2D,
    p2: Position2D,
    depth: number,
    roughness: number,
  ): Position2D[] => {
    if (depth <= 0) return [];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return [];
    const noiseVal = p.noise(midX * 0.01, midY * 0.01) * 2 - 1;
    const safeDepthFactor = depth > 0 ? depth / 3 : 0.1;
    const displacement = roughness * safeDepthFactor * noiseVal * len * 0.2;
    const midPoint = {
      x: midX + (-dy / len) * displacement,
      y: midY + (dx / len) * displacement,
    };
    const nextRoughness = roughness * 0.75;
    // Recursively subdivide edge
    const leftSide = subdivideEdge(p1, midPoint, depth - 1, nextRoughness);
    const rightSide = subdivideEdge(midPoint, p2, depth - 1, nextRoughness);
    return [...leftSide, midPoint, ...rightSide];
  };

  const generateShapePoints = (
    width: number,
    height: number,
    shapeType: ShapeType,
    basicShapeType?: BasicShape,
    sides: number = 5,
  ): Position2D[] => {
    let points: Position2D[] = [];
    const radiusX = width / 2;
    const radiusY = height / 2;
    const radius = Math.min(radiusX, radiusY);
    switch (shapeType) {
      case ShapeType.Basic:
        switch (basicShapeType) {
          case BasicShape.Circle:
            return generateCircleOrEllipsePoints(radius, radius);
          case BasicShape.Ellipse:
            return generateCircleOrEllipsePoints(radiusX, radiusY);
          default:
            points.push(
              { x: -radiusX, y: -radiusY },
              { x: radiusX, y: -radiusY },
              { x: radiusX, y: radiusY },
              { x: -radiusX, y: radiusY },
            );
            return points;
        }
      case ShapeType.Polygon:
        const angleStep = p.TWO_PI / sides;
        for (let i = 0; i < sides; i++) {
          const angle = i * angleStep;
          const r = radius * (0.7 + p.random(0.6));
          points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
        }
        return points;
      case ShapeType.Custom:
      case ShapeType.Chaotic:
        const isHighlyChaotic = shapeType === ShapeType.Chaotic;
        const basePoints: Position2D[] = [];
        const numBasePoints = Math.floor(
          p.random(isHighlyChaotic ? 4 : 3, isHighlyChaotic ? 9 : 7),
        );
        const angleStepOrganic = p.TWO_PI / numBasePoints;
        for (let i = 0; i < numBasePoints; i++) {
          const angle = i * angleStepOrganic;
          const noiseFactor = isHighlyChaotic ? 0.8 : 0.5;
          const noiseVal = p.noise(
            Math.cos(angle) * 0.5 + 10,
            Math.sin(angle) * 0.5 + 20,
          );
          const r = radius * (0.5 + noiseVal * noiseFactor);
          basePoints.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
        }
        const subdivisionDepth = isHighlyChaotic ? 3 : 2;
        const roughness = radius * (isHighlyChaotic ? 0.4 : 0.25);
        const finalPoints: Position2D[] = [];
        for (let i = 0; i < basePoints.length; i++) {
          const p1 = basePoints[i];
          const p2 = basePoints[(i + 1) % basePoints.length];
          finalPoints.push(p1);
          if (subdivisionDepth > 0) {
            finalPoints.push(
              ...subdivideEdge(p1, p2, subdivisionDepth, roughness),
            );
          }
        }
        return finalPoints;
      default:
        return generateShapePoints(
          width,
          height,
          ShapeType.Basic,
          BasicShape.Rectangle,
        );
    }
  };

  const drawPatternOnGraphic = (gfx: Graphics, element: CollageElement) => {
    if (!element.patternType) return;
    gfx.push();
    gfx.noFill();
    const strokeColor = element.borderColor || [150, 150, 150];
    gfx.stroke(...strokeColor, element.opacity * 0.6);
    gfx.strokeWeight(element.borderWidth ? element.borderWidth * 0.5 : 0.75);
    const patternWidth = element.width;
    const patternHeight = element.height;
    const halfW = patternWidth / 2;
    const halfH = patternHeight / 2;
    const spacing = Math.max(8, Math.min(patternWidth, patternHeight) / 7);
    switch (element.patternType) {
      case PatternType.Dots:
        gfx.strokeWeight(
          (element.borderWidth ? element.borderWidth * 0.5 : 0.75) * 1.5,
        );
        for (let x = -halfW; x <= halfW; x += spacing) {
          for (let y = -halfH; y <= halfH; y += spacing) gfx.point(x, y);
        }
        break;
      case PatternType.Lines:
        for (let y = -halfH; y <= halfH; y += spacing)
          gfx.line(-halfW, y, halfW, y);
        for (let x = -halfW; x <= halfW; x += spacing)
          gfx.line(x, -halfH, x, halfH);
        break;
      case PatternType.Cross:
        const diagSpacing = spacing * 1.5;
        for (
          let i = -patternWidth - patternHeight;
          i <= patternWidth + patternHeight;
          i += diagSpacing
        ) {
          gfx.line(i - halfW, -halfH, i + halfW, halfH);
          gfx.line(i + halfW, -halfH, i - halfW, halfH);
        }
        break;
      case PatternType.Zigzag:
        gfx.beginShape();
        let zigY = -halfH / 4;
        let count = 0;
        for (let x = -halfW; x <= halfW + spacing; x += spacing) {
          const cX = p.constrain(x, -halfW, halfW);
          gfx.vertex(cX, zigY);
          zigY *= -1;
          count++;
        }
        if (count <= 1) {
          gfx.vertex(halfW, zigY);
        }
        gfx.endShape();
        break;
    }
    gfx.pop();
  };

  const createRenderedGraphic = (
    element: CollageElement,
  ): Graphics | undefined => {
    if (!element.maskPoints || element.maskPoints.length < 3) return undefined;
    const hasImage =
      element.imageIndex >= 0 && element.imageIndex < loadedImages.length;
    const hasRenderablePattern = element.hasPattern && element.patternType;
    if (!hasImage && !hasRenderablePattern) return undefined;
    const graphicWidth = Math.ceil(element.width);
    const graphicHeight = Math.ceil(element.height);
    if (graphicWidth <= 0 || graphicHeight <= 0) return undefined;
    const gfx = p.createGraphics(graphicWidth, graphicHeight);
    try {
      gfx.pixelDensity(p.pixelDensity());
      gfx.angleMode(p.RADIANS);
      gfx.imageMode(p.CENTER);
      gfx.translate(graphicWidth / 2, graphicHeight / 2);
      gfx.beginShape();
      element.maskPoints.forEach((point) => gfx.vertex(point.x, point.y));
      gfx.endShape(p.CLOSE);
      gfx.drawingContext.clip();
      if (hasImage) {
        const img = loadedImages[element.imageIndex];
        if (!img?.width) throw new Error('Image invalid');
        if (element.filterType && element.filterType !== FilterType.None) {
          switch (element.filterType) {
            case FilterType.Grayscale:
              gfx.filter(p.GRAY);
              break;
            case FilterType.Sepia:
              gfx.filter(p.GRAY);
              break;
            case FilterType.HighContrast:
              gfx.filter(p.THRESHOLD, 0.55);
              break;
          }
        }
        gfx.image(img, 0, 0, element.width, element.height);
      } else if (hasRenderablePattern) {
        drawPatternOnGraphic(gfx, element);
      }
      gfx.resetMatrix();
      gfx.translate(graphicWidth / 2, graphicHeight / 2);
      if (element.hasBorder && element.borderWidth && element.borderColor) {
        gfx.push();
        gfx.noFill();
        gfx.stroke(...element.borderColor, 255);
        gfx.strokeWeight(element.borderWidth);
        gfx.beginShape();
        element.maskPoints.forEach((point) => gfx.vertex(point.x, point.y));
        gfx.endShape(p.CLOSE);
        gfx.pop();
      }
    } catch (e) {
      console.error('Error creating rendered graphic:', e, element);
      gfx.remove();
      return undefined;
    }
    return gfx;
  };

  const generateCollage = () => {
    const [width, height] = getCanvasSize(p);
    collageElements = [];
    const imageCount = Math.floor(
      p.random(CONFIG.collageImageCountMin, CONFIG.collageImageCountMax + 1),
    );
    const selectedImages = [...loadedImages]
      .sort(() => 0.5 - Math.random())
      .slice(0, imageCount);
    selectedImages.forEach((img, i) => {
      if (!img?.width) return;
      const isBg = i === 0 && p.random() < 0.5;
      const aspect = img.width / img.height;
      let imgW: number,
        imgH: number,
        x: number,
        y: number,
        z: number,
        op: number,
        rot: number;
      if (isBg) {
        const canvasAspect = width / height;
        imgH = height * 1.05;
        imgW = imgH * aspect;
        if (imgW < width) {
          imgW = width * 1.05;
          imgH = imgW / aspect;
        }
        x = width / 2;
        y = height / 2;
        z = -1;
        op = 255;
        rot = p.random(-p.PI / 60, p.PI / 60);
      } else {
        const sizeVar = CONFIG.shapeVariety * 4;
        const minSz = CONFIG.minSize - sizeVar;
        const maxSz = CONFIG.maxSize + sizeVar;
        const targetW = p.random(minSz, maxSz);
        imgW = (width * targetW) / 100;
        imgH = imgW / aspect;
        const mX = imgW * 0.5;
        const mY = imgH * 0.5;
        x = p.random(mX, width - mX);
        y = p.random(mY, height - mY);
        z = p.random(0, 15);
        op = p.random(80, 230);
        rot = p.random(p.TWO_PI);
      }
      const shapeType: ShapeType = isBg
        ? ShapeType.Basic
        : selectRandomShapeType();
      let basicShape: BasicShape | undefined;
      let maskSides: number | undefined;
      const maskScale = isBg ? 1.0 : p.random(0.75, 0.95);
      const maskW = imgW * maskScale;
      const maskH = imgH * maskScale;
      if (shapeType === ShapeType.Basic) {
        basicShape = isBg ? BasicShape.Rectangle : selectRandomBasicShape();
      } else if (shapeType === ShapeType.Polygon) {
        maskSides = Math.floor(p.random(3, CONFIG.maxPolygonSides + 1));
      }
      const relMaskPts = generateShapePoints(
        maskW,
        maskH,
        shapeType,
        basicShape,
        maskSides,
      );
      const filterType = isBg ? FilterType.None : selectRandomFilterType();
      const hasBorder = !isBg && p.random() < 0.4;
      const imgIdx = loadedImages.indexOf(img);
      if (imgIdx !== -1) {
        const el: CollageElement = {
          x,
          y,
          width: imgW,
          height: imgH,
          opacity: op,
          rotation: rot,
          maskPoints: relMaskPts,
          maskSides,
          imageIndex: imgIdx,
          shapeType,
          filterType,
          hasBorder,
          borderWidth: hasBorder ? p.random(1, 4) : 0,
          borderColor: hasBorder ? createRandomColorArray(p) : [0, 0, 0],
          zIndex: z,
          hasPattern: false,
          renderedElement: undefined,
        };
        el.renderedElement = createRenderedGraphic(el);
        collageElements.push(el);
      }
    });
    for (let i = 0; i < CONFIG.decorativeElementCount; i++) {
      const x = p.random(width);
      const y = p.random(height);
      const size = p.random(width * 0.05, width * 0.18);
      const rot = p.random(p.TWO_PI);
      const shapeType = p.random() < 0.4 ? ShapeType.Basic : ShapeType.Custom;
      const hasPat = p.random() < 0.8;
      let basicShape: BasicShape | undefined;
      if (shapeType === ShapeType.Basic) {
        basicShape = selectRandomBasicShape();
      }
      const relMaskPts = generateShapePoints(size, size, shapeType, basicShape);
      const patType = hasPat ? selectRandomPatternType() : undefined;
      const el: CollageElement = {
        x,
        y,
        width: size,
        height: size,
        opacity: p.random(100, 255),
        rotation: rot,
        maskPoints: relMaskPts,
        imageIndex: -1,
        shapeType,
        hasBorder: true,
        borderWidth: p.random(1.5, 5),
        borderColor: createRandomColorArray(p),
        zIndex: p.random(1, 12),
        hasPattern: hasPat,
        patternType: patType,
        renderedElement: undefined,
      };
      if (el.hasPattern) {
        el.renderedElement = createRenderedGraphic(el);
      }
      if (el.renderedElement || el.hasBorder) {
        collageElements.push(el);
      }
    }
    collageElements.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  };
  const generateDecorativeLetters = () => {
    const [width, height] = getCanvasSize(p);
    decorativeLetters = [];
    const letterCount = Math.floor(
      p.random(
        CONFIG.decorativeLetterCountMin,
        CONFIG.decorativeLetterCountMax + 1,
      ),
    );

    // Main large letter
    decorativeLetters.push({
      char: p.random(DECORATIVE_CHARS.split('')),
      x: p.random(width * 0.1, width * 0.9),
      y: p.random(height * 0.1, height * 0.9),
      size: p.random(height * 0.6, height * 1.2),
      rotation: p.random(-p.PI / 8, p.PI / 8),
      color: [p.random(0, 40), p.random(0, 40), p.random(0, 40), 200],
    });

    // Smaller letters
    for (let i = 1; i < letterCount; i++) {
      decorativeLetters.push({
        char: p.random(DECORATIVE_CHARS.split('')),
        x: p.random(width),
        y: p.random(height),
        size: p.lerp(16, height * 0.2, p.random() ** 1.8),
        rotation: p.random(-p.PI / 5, p.PI / 5),
        color: [p.random(0, 50), p.random(0, 50), p.random(0, 50), 255],
      });
    }
  };
  const generatePoemLineDisplay = () => {
    const [width, height] = getCanvasSize(p);
    currentLineWords = [];

    let line: string;
    if (TEST_FORCE_REMIX || hasCompletedFirstIteration) {
      line = generateRemixedLine();
    } else {
      if (currentLineIndex < poemLines.length) {
        line = poemLines[currentLineIndex];
      } else {
        hasCompletedFirstIteration = true;
        line = generateRemixedLine();
      }
    }

    if (!line) return;
    const words = line.trim().split(/\s+/);
    if (words.length === 0) return;
    const numWords = words.length;
    const availableSpace = width * 0.8;
    const spacing = Math.min(
      width / (numWords + 1),
      availableSpace / Math.max(1, numWords - 1),
    );
    const startX = (width - (numWords - 1) * spacing) / 2;
    let currentY = p.random(height * 0.3, height * 0.7);
    words.forEach((word, index) => {
      const xPos =
        startX + index * spacing + p.random(-spacing * 0.2, spacing * 0.2);
      currentY += p.random(-height * 0.05, height * 0.05);
      currentY = p.constrain(currentY, height * 0.15, height * 0.85);
      const speed = p.random(0.2, 0.8);
      const angle = p.random(p.TWO_PI);
      currentLineWords.push({
        word,
        x: xPos,
        y: currentY,
        size: p.random(width * 0.03, width * 0.08),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        opacity: 0,
      });
    });
  };

  const drawDecorativeLetter = (
    letter: DecorativeLetter,
    opacityFactor: number = 1,
  ) => {
    p.push();
    p.translate(letter.x, letter.y);
    p.rotate(letter.rotation);
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

  const getCrossfadeProgress = () => {
    if (!isCrossfading) return 1.0;
    const currentTime = p.millis();
    const progress =
      (currentTime - crossfadeStartTime) / CONFIG.crossfadeDuration;
    const constrainedProgress = p.constrain(progress, 0, 1);
    if (progress >= 1) {
      isCrossfading = false;
      cleanupRenderedGraphics(previousCollageElements);
      previousCollageElements = [];
      previousDecorativeLetters = [];
      previousLineWords = [];
      needsUpdate = true;
    } else {
      needsUpdate = true;
    }
    return constrainedProgress;
  };

  const drawSingleCollageElement = (
    element: CollageElement,
    opacityFactor: number,
  ) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    if (element.renderedElement) {
      p.tint(255, element.opacity * opacityFactor);
      p.image(element.renderedElement, 0, 0);
      p.noTint();
    } else if (
      element.hasBorder &&
      element.borderColor &&
      element.borderWidth &&
      element.maskPoints
    ) {
      // Minimal fallback just for border if graphic failed but border defined
      p.noFill();
      p.stroke(...element.borderColor, element.opacity * opacityFactor);
      p.strokeWeight(element.borderWidth);
      p.beginShape();
      element.maskPoints.forEach((point) => p.vertex(point.x, point.y));
      p.endShape(p.CLOSE);
    }
    p.pop();
  };

  const drawCollageElements = () => {
    const crossfadeProgress = getCrossfadeProgress(); // Linear progress
    const fadeOutOpacityFactor = 1.0 - crossfadeProgress;
    const fadeInOpacityFactor = crossfadeProgress; // Draw previous elements fading out

    if (isCrossfading) {
      // Only draw previous if actually fading
      previousCollageElements.forEach((el) =>
        drawSingleCollageElement(el, fadeOutOpacityFactor),
      );
    } // Draw current elements fading in (or fully visible)
    collageElements.forEach((el) =>
      drawSingleCollageElement(el, fadeInOpacityFactor),
    );
  };

  const drawDecorativeLetters = () => {
    if (!bodoniFont) return;
    const crossfadeProgress = getCrossfadeProgress();
    const fadeOutFactor = 1.0 - crossfadeProgress;
    const fadeInFactor = crossfadeProgress;
    p.push();
    p.textFont(bodoniFont);
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();
    if (isCrossfading) {
      previousDecorativeLetters.forEach((l) =>
        drawDecorativeLetter(l, fadeOutFactor),
      );
    }
    decorativeLetters.forEach((l) => drawDecorativeLetter(l, fadeInFactor));
    p.pop();
  };

  const drawBackground = () => {
    const [width, height] = getCanvasSize(p);
    p.push();
    p.stroke(200, 200, 200, 15);
    p.strokeWeight(0.5);
    const gridSize = Math.min(width, height) / 15;
    for (let x = 0; x < width; x += gridSize) p.line(x, 0, x, height);
    for (let y = 0; y < height; y += gridSize) p.line(0, y, width, y);
    p.noFill();
    p.stroke(180, 180, 180, 8);
    p.strokeWeight(1);
    const elCount = Math.max(3, CONFIG.shapeVariety * 1.2);
    for (let i = 0; i < elCount; i++) {
      const x = p.random(width);
      const y = p.random(height);
      const size = p.random(width * 0.1, width * 0.3);
      const shapeRand = p.random(1);
      if (shapeRand < 0.4) p.ellipse(x, y, size, size * p.random(0.7, 1.3));
      else if (shapeRand < 0.7) p.rect(x - size / 2, y - size / 2, size, size);
      else p.line(x, y, x + p.random(-size, size), y + p.random(-size, size));
    }
    p.pop();
  };

  p.draw = () => {
    if (!needsUpdate && !isCrossfading && !stillAnimatingWords) return;
    needsUpdate = false;
    stillAnimatingWords = false;

    p.background(245, 248, 250);
    drawBackground();
    drawCollageElements();
    drawDecorativeLetters();

    if (bodoniFont) {
      const [width, height] = getCanvasSize(p);
      p.push();
      p.textFont(bodoniFont);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();
      const crossfadeProgress = getCrossfadeProgress();
      const fadeInOpacityFactor = crossfadeProgress;
      const fadeOutOpacityFactor = 1.0 - crossfadeProgress;
      const restitution = CONFIG.wordBounceRestitution;

      const processWords = (words: PoemWord[], opacityFactor: number) => {
        words.forEach((word) => {
          // Calculate boundaries before movement
          const wordHalfSize = word.size / 2;
          const minX = wordHalfSize;
          const maxX = width - wordHalfSize;
          const minY = wordHalfSize;
          const maxY = height - wordHalfSize;

          // Update position
          word.x += word.vx;
          word.y += word.vy;

          // Check and handle X boundaries
          if (word.x < minX) {
            word.x = minX;
            word.vx = Math.abs(word.vx) * restitution;
          } else if (word.x > maxX) {
            word.x = maxX;
            word.vx = -Math.abs(word.vx) * restitution;
          }

          // Check and handle Y boundaries
          if (word.y < minY) {
            word.y = minY;
            word.vy = Math.abs(word.vy) * restitution;
          } else if (word.y > maxY) {
            word.y = maxY;
            word.vy = -Math.abs(word.vy) * restitution;
          }

          // Ensure position is within bounds
          word.x = p.constrain(word.x, minX, maxX);
          word.y = p.constrain(word.y, minY, maxY);

          word.opacity = opacityFactor * 220;
          if (word.opacity > 1) {
            p.fill(KAHU_BLUE[0], KAHU_BLUE[1], KAHU_BLUE[2], word.opacity);
            p.textSize(word.size);
            p.text(word.word, word.x, word.y);
            stillAnimatingWords = true;
          } else if (Math.abs(word.vx) > 0.01 || Math.abs(word.vy) > 0.01) {
            stillAnimatingWords = true;
            if (opacityFactor < 0.01) {
              word.vx = 0;
              word.vy = 0;
            }
          }
        });
      };

      if (isCrossfading) processWords(previousLineWords, fadeOutOpacityFactor);
      processWords(currentLineWords, fadeInOpacityFactor);

      p.pop();
    }

    const currentTime = p.millis();
    if (
      !isCrossfading &&
      currentTime - lastLineChangeTime > CONFIG.displayDuration
    ) {
      if (!hasCompletedFirstIteration) {
        currentLineIndex = (currentLineIndex + 1) % poemLines.length;
      }
      startCrossfade();
    } else {
      needsUpdate = isCrossfading || stillAnimatingWords;
    }
  };

  p.windowResized = () => {
    let [width, height] = getCanvasSize(p);
    if (document.fullscreenElement) {
      height = window.innerHeight;
      width = height; // square
    }
    p.resizeCanvas(width, height);
    if (isInitialized) {
      startCrossfade();
    }
    needsUpdate = true;
  };

  p.mouseClicked = () => {
    if (!isCrossfading) startCrossfade();
  };
};

const TowardsCanvas = () => <ReactP5Wrapper sketch={sketch} />;

export default TowardsCanvas;
