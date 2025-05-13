import imageUrls from '@constants/image_urls.json';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize } from '@utils/canvas';
import { KAHU_BLUE, createRandomColorArray } from '@utils/color';
import { Position2D } from '@utils/math';
import { Font, Graphics, Image } from 'p5';
import { CONFIG, FilterType, PatternType, ShapeType } from './config';
import { POEM } from './poem';
import {
  BasicShape,
  CollageElement,
  DecorativeLetter,
  PoemWord,
} from './types';
import { generateShape } from './utils';

const decorativeChars = 'TOWARDS;!?&[]{}';

const cleanupRenderedGraphics = (elements: CollageElement[]) => {
  elements.forEach((element) => {
    element.renderedElement?.remove();
    element.renderedElement = undefined;
  });
};

const selectRandomShapeType = (p: P5CanvasInstance): ShapeType =>
  p.random() < 0.6
    ? p.random() < 0.5
      ? ShapeType.Basic
      : ShapeType.Polygon
    : p.random() < 0.5
    ? ShapeType.Chaotic
    : ShapeType.Custom;

const selectRandomBasicShape = (p: P5CanvasInstance): BasicShape =>
  p.random() < 0.5
    ? BasicShape.Rectangle
    : p.random() < 0.5
    ? BasicShape.Circle
    : BasicShape.Ellipse;

const selectRandomPatternType = (p: P5CanvasInstance): PatternType =>
  p.random(Object.values(PatternType));

export const sketch = (p: P5CanvasInstance) => {
  let loadedImages: Image[] = [];
  let collageElements: CollageElement[] = [];
  let previousCollageElements: CollageElement[] = []; // Store previous collage for crossfade
  let decorativeLetters: DecorativeLetter[] = [];
  let previousDecorativeLetters: DecorativeLetter[] = []; // Store previous decorative letters
  let bodoniFont: Font;
  let isInitialized = false;
  let needsUpdate = true;
  let isCrossfading = false;
  let crossfadeStartTime = 0;
  let currentLineWords: PoemWord[] = [];

  const poemLines = POEM.trim().split('\n');
  let currentLineIndex = 0;
  let lastLineChangeTime = 0;

  p.preload = () => {
    // Load subset of images
    const selectedUrls = [...imageUrls]
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
    loadedImages = selectedUrls.map((url) => p.loadImage(url));
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
    p.frameRate(30); // Lower framerate to reduce resource usage
    generate();
    isInitialized = true;
    needsUpdate = true;

    document.addEventListener('fullscreenchange', () => p.windowResized());
  };

  const startCrossfade = () => {
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

  const createImageGraphic = (
    element: CollageElement,
  ): Graphics | undefined => {
    if (element.imageIndex < 0 || element.imageIndex >= loadedImages.length)
      return undefined;

    const img = loadedImages[element.imageIndex];
    if (!img?.width) return undefined;

    try {
      const gfx = p.createGraphics(element.width, element.height);

      // Set up the graphic context
      gfx.translate(gfx.width / 2, gfx.height / 2);
      gfx.imageMode(p.CENTER);
      gfx.noTint();

      // Draw mask shape
      gfx.noStroke();
      gfx.fill(255);
      gfx.beginShape();
      element.maskPoints.forEach((point: Position2D) => {
        gfx.vertex(point.x - element.x, point.y - element.y);
      });
      gfx.endShape(p.CLOSE);

      // Apply mask
      gfx.drawingContext.globalCompositeOperation = 'source-in';

      // Apply filter if specified
      if (element.filterType) {
        switch (element.filterType) {
          case FilterType.Grayscale:
            gfx.filter(p.GRAY);
            break;
          case FilterType.Sepia:
            gfx.tint(220, 180, 120);
            break;
          case FilterType.HighContrast:
            gfx.filter(p.GRAY);
            gfx.filter(p.THRESHOLD, 0.6);
            break;
        }
      }

      // Draw image
      gfx.image(img, 0, 0, element.width, element.height);

      // Draw border if specified
      if (element.hasBorder && element.borderWidth && element.borderColor) {
        gfx.drawingContext.globalCompositeOperation = 'source-over';
        gfx.noFill();
        gfx.stroke(
          element.borderColor[0],
          element.borderColor[1],
          element.borderColor[2],
          255,
        );
        gfx.strokeWeight(element.borderWidth);
        gfx.beginShape();
        element.maskPoints.forEach((point: Position2D) => {
          gfx.vertex(point.x - element.x, point.y - element.y);
        });
        gfx.endShape(p.CLOSE);
      }

      return gfx;
    } catch (e) {
      console.error('Error creating image graphic', e);
      return undefined;
    }
  };

  // Create a pre-rendered graphic for a pattern element
  const createPatternGraphic = (
    element: CollageElement,
  ): Graphics | undefined => {
    if (!element.hasPattern || !element.patternType) return undefined;

    try {
      // Create graphic with padding
      const gfx = p.createGraphics(element.width * 1.5, element.height * 1.5);

      // Set up the graphic context
      gfx.translate(gfx.width / 2, gfx.height / 2);
      gfx.noFill();
      gfx.stroke(
        element.borderColor?.[0] || 0,
        element.borderColor?.[1] || 0,
        element.borderColor?.[2] || 0,
        element.opacity * 0.7,
      );
      gfx.strokeWeight(1);

      const size = Math.min(element.width, element.height);
      const halfSize = size / 2;
      const spacing = size / 8;

      const patterns: Record<PatternType, () => void> = {
        [PatternType.Dots]: () => {
          for (let x = -halfSize; x <= halfSize; x += spacing) {
            for (let y = -halfSize; y <= halfSize; y += spacing) {
              gfx.point(x, y);
            }
          }
        },
        [PatternType.Lines]: () => {
          for (let i = -halfSize; i <= halfSize; i += spacing) {
            gfx.line(-halfSize, i, halfSize, i);
            gfx.line(i, -halfSize, i, halfSize);
          }
        },
        [PatternType.Cross]: () => {
          for (let i = -size; i <= size; i += spacing) {
            gfx.line(i, -size, i + size, size);
            gfx.line(i, size, i + size, -size);
          }
        },
        [PatternType.Zigzag]: () => {
          gfx.beginShape();
          for (let x = -halfSize; x <= halfSize; x += spacing) {
            gfx.vertex(
              x,
              (x / spacing) % 2 === 0 ? halfSize / 4 : -halfSize / 4,
            );
          }
          gfx.endShape();
        },
      };

      if (element.patternType && element.patternType in patterns) {
        patterns[element.patternType as keyof typeof patterns]();
      }

      return gfx;
    } catch (e) {
      console.error('Error creating pattern graphic', e);
      return undefined;
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
      if (bgImg?.width) {
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
            p,
            width / 2,
            height / 2,
            bgWidth,
            bgHeight,
            ShapeType.Basic,
            BasicShape.Rectangle,
          ),
          imageIndex: loadedImages.indexOf(bgImg),
          shapeType: ShapeType.Basic,
          filterType: FilterType.None,
          zIndex: -1,
        });
      }
    }

    for (let i = 1; i < selectedImages.length; i++) {
      const img = selectedImages[i];
      if (!img?.width) continue;

      const aspectRatio = img.width / img.height;
      const sizeVariance = CONFIG.shapeVariety * 5;
      const minSizeAdjusted = CONFIG.minSize - sizeVariance;
      const maxSizeAdjusted = CONFIG.maxSize + sizeVariance;

      const imgWidth =
        (width *
          (minSizeAdjusted +
            Math.random() * (maxSizeAdjusted - minSizeAdjusted))) /
        100;
      const imgHeight = imgWidth / aspectRatio;

      const x = p.random(imgWidth / 2, width - imgWidth / 2);
      const y = p.random(imgHeight / 2, height - imgHeight / 2);
      const opacity = (p.random(30, 90) / 100) * 255;
      const rotation = p.random(0, p.TWO_PI);
      const shapeType = selectRandomShapeType(p);
      const maskWidth = Math.max(imgWidth, imgHeight) * 0.6;
      const basicShape =
        shapeType === ShapeType.Basic ? selectRandomBasicShape(p) : undefined;
      const maskPoints = generateShape(
        p,
        x,
        y,
        basicShape === BasicShape.Rectangle ? imgWidth * 0.9 : maskWidth,
        basicShape === BasicShape.Rectangle
          ? imgHeight * 0.9
          : basicShape === BasicShape.Ellipse
          ? imgHeight * 0.8
          : maskWidth,
        shapeType,
        basicShape,
        shapeType === ShapeType.Polygon
          ? Math.floor(p.random(3, CONFIG.maxPolygonSides + 1))
          : undefined,
      );

      const filterType = p.random([
        FilterType.None,
        FilterType.Grayscale,
        FilterType.Sepia,
        FilterType.HighContrast,
      ]);
      const hasBorder = p.random() < 0.3;
      const hasPattern = p.random() < 0.5;

      collageElements.push({
        url: imageUrls[i],
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotation,
        maskPoints,
        imageIndex: loadedImages.indexOf(img),
        shapeType,
        filterType,
        hasBorder,
        borderWidth: hasBorder ? p.random(0.5, 2) : 0,
        borderColor: hasBorder ? createRandomColorArray(p) : [0, 0, 0],
        zIndex: Math.floor(p.random(0, 10)),
        hasPattern,
        patternType: hasPattern ? selectRandomPatternType(p) : undefined,
      });
    }

    const numElements = Math.floor(4);
    for (let i = 0; i < numElements; i++) {
      const x = p.random(width);
      const y = p.random(height);
      const size = p.random(30, 80);
      const rotation = p.random(0, p.TWO_PI);
      const shapeType = p.random() < 0.5 ? ShapeType.Basic : ShapeType.Custom;
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
          p,
          x,
          y,
          size,
          size,
          shapeType,
          shapeType === ShapeType.Basic ? selectRandomBasicShape(p) : undefined,
        ),
        imageIndex: -1,
        shapeType,
        hasBorder: true,
        borderWidth: p.random(1, 3),
        borderColor: createRandomColorArray(p),
        zIndex: Math.floor(p.random(0, 10)),
        hasPattern,
        patternType: hasPattern ? selectRandomPatternType(p) : undefined,
      });
    }

    collageElements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    collageElements.forEach((element) => {
      if (element.imageIndex >= 0) {
        element.renderedElement = createImageGraphic(element);
      } else if (element.hasPattern) {
        element.renderedElement = createPatternGraphic(element);
      }
    });
  };

  const generateDecorativeLetters = () => {
    const [width, height] = getCanvasSize(p);
    decorativeLetters = [];

    const letterCount = Math.floor(p.random(3, 10));

    decorativeLetters.push({
      char: p.random(decorativeChars.split('')),
      x: p.random(width * 0.2, width * 0.8),
      y: p.random(height * 0.2, height * 0.8),
      size: p.random(height * 0.8, height * 1.5),
      rotation: p.random(-p.PI / 6, p.PI / 6),
      color: [p.random(0, 40), p.random(0, 40), p.random(0, 40), 255],
    });

    for (let i = 1; i < letterCount; i++) {
      decorativeLetters.push({
        char: p.random(decorativeChars.split('')),
        x: p.random(0, width),
        y: p.random(0, height),
        size: p.lerp(18, height * 0.25, Math.pow(p.random(), 1.5)),
        rotation: p.random(-p.PI / 4, p.PI / 4),
        color: [p.random(0, 50), p.random(0, 50), p.random(0, 50), 255],
      });
    }
  };

  const generatePoemLineDisplay = () => {
    const [width, height] = getCanvasSize(p);
    currentLineWords = [];

    if (currentLineIndex < poemLines.length) {
      const line = poemLines[currentLineIndex];
      const words = line.trim().split(/\s+/);
      const numWords = words.length;
      const spacing = width / (numWords + 1);
      let currentY = p.random(height * 0.2, height * 0.8);

      words.forEach((word, index) => {
        currentY += p.random(-20, 40);
        currentY = Math.max(50, Math.min(height - 50, currentY));
        const speed = p.random(0.3, 1.2);
        const angle = p.random(0, p.TWO_PI);

        currentLineWords.push({
          word,
          x: spacing * (index + 0.5) + p.random(-spacing * 0.3, spacing * 0.3),
          y: currentY,
          size: p.random(30, 80),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          opacity: 0,
        });
      });
    }
  };

  const drawElementContent = (element: CollageElement) => {
    if (element.renderedElement) {
      p.tint(255, element.opacity);
      p.image(element.renderedElement, 0, 0);
      p.noTint();
    }
  };

  const drawShapeBorder = (element: CollageElement, opacity: number = 255) => {
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
      element.maskPoints.forEach((point: Position2D) => {
        p.vertex(point.x - element.x, point.y - element.y);
      });
      p.endShape(p.CLOSE);
    }
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
    const currentTime = p.millis();
    if (!isCrossfading) return 1;

    const progress =
      (currentTime - crossfadeStartTime) / CONFIG.crossfadeDuration;
    const constrainedProgress = p.constrain(progress, 0, 1);

    // Handle crossfade completion
    if (progress >= 1) {
      isCrossfading = false;
      cleanupRenderedGraphics(previousCollageElements);
      previousCollageElements = [];
      previousDecorativeLetters = [];
    }

    return constrainedProgress;
  };

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
        drawElementContent(element);
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
      drawElementContent(element);
      element.opacity = originalOpacity;
      drawShapeBorder(element, isCrossfading ? crossfadeProgress * 255 : 255);
      p.pop();
    });
  };

  const drawDecorativeLetters = () => {
    if (!bodoniFont) return;

    const crossfadeProgress = getCrossfadeProgress();

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
  };

  const drawBackground = () => {
    p.push();
    p.stroke(200, 200, 200, 15);
    p.strokeWeight(0.5);

    const gridSize = 50;
    for (let x = 0; x < p.width; x += gridSize) p.line(x, 0, x, p.height);
    for (let y = 0; y < p.height; y += gridSize) p.line(0, y, p.width, y);

    p.noFill();
    p.stroke(200, 200, 200, 10);
    p.strokeWeight(1);

    const elementCount = CONFIG.shapeVariety * 1.5;
    for (let i = 0; i < elementCount; i++) {
      const x = p.random(p.width);
      const y = p.random(p.height);
      const size = p.random(50, 200);

      const shapeType = Math.floor(p.random(3));
      if (shapeType === 0) p.ellipse(x, y, size, size);
      else p.line(x, y, p.random(p.width), p.random(p.height));
    }
    p.pop();
  };

  p.draw = () => {
    if (!needsUpdate) return;
    needsUpdate = false;

    const [width, height] = getCanvasSize(p);
    const currentTime = p.millis();

    p.background(245);

    drawBackground();
    drawCollageElements();
    drawDecorativeLetters();

    if (bodoniFont) {
      p.push();
      p.textFont(bodoniFont);
      p.textAlign(p.CENTER, p.CENTER);
      p.noStroke();

      let wordOpacityFactor = 1;

      // When crossfading, words should fade with the same timing
      if (isCrossfading) {
        const progress = getCrossfadeProgress();
        wordOpacityFactor = progress;
      }

      // Update positions and opacity based on velocity vectors
      currentLineWords.forEach((word) => {
        // Calculate next position
        const nextX = word.x + word.vx;
        const nextY = word.y + word.vy;

        // Check and handle horizontal bounds
        if (nextX < word.size / 2) {
          word.x = word.size / 2;
          word.vx = Math.abs(word.vx);
        } else if (nextX > width - word.size / 2) {
          word.x = width - word.size / 2;
          word.vx = -Math.abs(word.vx);
        } else {
          word.x = nextX;
        }

        // Check and handle vertical bounds
        if (nextY < word.size / 2) {
          word.y = word.size / 2;
          word.vy = Math.abs(word.vy);
        } else if (nextY > height - word.size / 2) {
          word.y = height - word.size / 2;
          word.vy = -Math.abs(word.vy);
        } else {
          word.y = nextY;
        }

        // Apply opacity factor to color when crossfading
        word.opacity = wordOpacityFactor * 220;
        p.fill(KAHU_BLUE[0], KAHU_BLUE[1], KAHU_BLUE[2], word.opacity);
        p.textSize(word.size);
        p.text(word.word, word.x, word.y);
      });

      p.pop();
    }

    // Check if it's time to update the line
    if (
      !isCrossfading &&
      currentTime - lastLineChangeTime > CONFIG.displayDuration
    ) {
      currentLineIndex = (currentLineIndex + 1) % poemLines.length;
      startCrossfade();
    } else {
      // Always need to update during crossfading or for word movement
      needsUpdate = isCrossfading || currentLineWords.length > 0;
    }
  };

  p.windowResized = () => {
    let [width, height] = getCanvasSize(p);

    if (document.fullscreenElement) {
      height = window.innerHeight;
      width = height;
    }

    p.resizeCanvas(width, height);

    if (isInitialized) {
      startCrossfade();
    }
  };

  p.mouseClicked = () => {
    startCrossfade();
  };
};

const TowardsCanvas = () => <ReactP5Wrapper sketch={sketch} />;

export default TowardsCanvas;
