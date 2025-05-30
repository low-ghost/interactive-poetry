import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize, improveTextRendering } from '@utils/canvas';
import p5 from 'p5';
import { POEM_LINES } from './poem';

type SceneElement = {
  type:
    | 'photo'
    | 'blackboard'
    | 'textured-shape'
    | 'math-notation'
    | 'line'
    | 'circle'
    | 'thick-ring'
    | 'geometric-framework'
    | 'large-color-plane'
    | 'massive-plane'
    | 'intersecting-plane';
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  rotation: number;
  scale: number;
  data?: any;
  age: number;
  zIndex: number; // Add z-index for layering control
};

type Scene = {
  elements: SceneElement[];
  textLines: string[];
  photoElement: SceneElement | null;
  startLineIndex: number;
  complete: boolean;
  age: number;
  delayBeforeElements: number; // Add delay before elements can appear
  typewriterProgress: number; // Track typing progress (0 to total characters)
  isExiting: boolean; // Track if scene is exiting
  totalCharacters: number; // Total characters in all text lines
};

type SketchProps = {
  buildSpeed: number | null;
};

export const sketch = (p: P5CanvasInstance<SketchProps>) => {
  let currentScene: Scene | null = null;
  let scenes: Scene[] = [];
  let currentLineIndex = 0;
  let frameCounter = 0;
  let nextElementTime = 0;

  // Add delay constant for elements (60 frames = 1 second at 60fps)
  const ELEMENT_DELAY_FRAMES = 60;

  // Store loaded images
  let photoPaths = [
    'images/moon/32608820776_04e7678543_o.jpg',
    'images/moon/32608828106_b93033b4d8_o.jpg',
    'images/moon/32608889646_19473634e7_o.jpg',
    'images/moon/42704081100_76443f493c_o.avif',
    'images/moon/43604217515_71f8b4fcc2_b.jpg',
    'images/moon/44463917582_2e04c76044_b.jpg',
    'images/moon/44513174051_33f271f1c8_b.jpg',
    'images/moon/homebody-edit.avif',
    'images/moon/ma-74529.jpg',
    'images/moon/nov-2020-prints-new-00035.jpg',
  ];
  let loadedPhotos: p5.Image[] = [];

  const state: SketchProps = {
    buildSpeed: 1,
  };

  // Muted Russian Futurist palette
  const palette = {
    background: () => p.color(245, 240, 230),
    black: () => p.color(20, 20, 25),
    chalk: () => p.color(250, 250, 245),
    red: () => p.color(180, 30, 40),
    deepRed: () => p.color(120, 20, 30),
    yellow: () => p.color(220, 200, 120),
    ochre: () => p.color(180, 140, 80),
    blue: () => p.color(60, 80, 120),
    green: () => p.color(80, 100, 70),
    gray: (value: number) => p.color(value, value, value + 5),
    beige: () => p.color(210, 195, 175),
    darkGray: () => p.color(60, 60, 65),
    warmGray: () => p.color(140, 130, 120),
    coolGray: () => p.color(120, 130, 140),
    rust: () => p.color(160, 100, 80),
    sage: () => p.color(140, 150, 130),
  };

  const getRandomColor = (): p5.Color => {
    const colors = [
      palette.gray(p.random(100, 180)),
      palette.beige(),
      palette.warmGray(),
      palette.coolGray(),
      palette.darkGray(),
      palette.red(),
      palette.yellow(),
      palette.ochre(),
      palette.blue(),
      palette.green(),
      palette.rust(),
      palette.sage(),
      palette.deepRed(),
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Mathematical notations to use
  const mathNotations = [
    'sin α',
    'cos β',
    'π/4',
    '∫ƒ(x)dx',
    '∑ⁿ',
    '√x²+y²',
    'θ = 45°',
    'Δx → 0',
    'ƒ(x,y)',
    '∂/∂x',
  ];

  const createTexturedShape = (
    x: number,
    y: number,
    type: string,
  ): SceneElement => {
    return {
      type: 'textured-shape',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0, // Full opacity for hard intersections
      rotation: p.random(-p.PI / 12, p.PI / 12),
      scale: p.random(0.8, 1.2),
      data: {
        shapeType: type,
        width: p.random(60, 150),
        height: p.random(80, 180),
        depth: p.random(30, 80),
        texture: Math.random() > 0.5 ? 'crosshatch' : 'dots',
        color: getRandomColor(),
        perspective: p.random(0.6, 0.9),
      },
      age: 0,
      zIndex: 3,
    };
  };

  const create3DFrame = (x: number, y: number): SceneElement => {
    return {
      type: 'textured-shape',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0, // Full opacity
      rotation: p.random(-p.PI / 20, p.PI / 20),
      scale: 1,
      data: {
        shapeType: 'abstract-3d',
        width: p.random(80, 160),
        height: p.random(100, 200),
        depth: p.random(20, 60),
        perspective: p.random(0.6, 0.9),
        color: getRandomColor(),
      },
      age: 0,
      zIndex: 4,
    };
  };

  const createIntersectingPlanes = (x: number, y: number): SceneElement => {
    return {
      type: 'textured-shape',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0, // Full opacity for hard cuts
      rotation: p.random(-p.PI / 8, p.PI / 8),
      scale: 1,
      data: {
        shapeType: 'intersecting-plane',
        width: p.random(120, 280), // Varied sizes for better intersections
        height: p.random(150, 320),
        color: getRandomColor(),
        planeType: ['vertical', 'horizontal', 'diagonal'][
          Math.floor(Math.random() * 3)
        ],
        cuts: [], // Will store intersection data
      },
      age: 0,
      zIndex: 2,
    };
  };

  const createMassiveColorPlane = (): SceneElement => {
    // Avoid text area - place below it
    const textHeight = p.height * 0.2; // Text takes up top 20%
    return {
      type: 'textured-shape',
      x: p.random(p.width * 0.2, p.width * 0.8),
      y: p.random(textHeight + 50, p.height * 0.8), // Start below text area
      opacity: 0,
      targetOpacity: 1.0, // Full opacity
      rotation: p.random(-p.PI / 12, p.PI / 12),
      scale: 1,
      data: {
        shapeType: 'massive-plane',
        width: p.random(200, 500), // Very large planes
        height: p.random(300, 600),
        color: getRandomColor(),
        hasTexture: Math.random() > 0.5,
      },
      age: 0,
      zIndex: 1,
    };
  };

  const createStructuralLineNetwork = (scene: Scene): SceneElement[] => {
    const lines: SceneElement[] = [];
    const networkSize = Math.floor(p.random(12, 20)); // Much more lines per network

    // Define text-safe area
    const textHeight = p.height * 0.2;
    const safeMinY = textHeight + 30;

    // Create connecting lines between existing elements
    for (let i = 0; i < networkSize; i++) {
      const startX = p.random(p.width * 0.1, p.width * 0.9);
      const startY = p.random(safeMinY, p.height * 0.8); // Avoid text area

      // Sometimes connect to existing elements
      let endX, endY;
      if (scene.elements.length > 0 && Math.random() > 0.3) {
        // Higher chance to connect
        const targetElement =
          scene.elements[Math.floor(Math.random() * scene.elements.length)];
        endX = targetElement.x + p.random(-80, 80);
        endY = targetElement.y + p.random(-60, 60);
        // Ensure end point is also in safe area
        endY = Math.max(safeMinY, Math.min(p.height * 0.9, endY));
      } else {
        endX = startX + p.random(-300, 300); // Longer lines
        endY = startY + p.random(-200, 200);
        // Ensure end point is in safe area
        endY = Math.max(safeMinY, Math.min(p.height * 0.9, endY));
      }

      const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      const angle = Math.atan2(endY - startY, endX - startX);

      // Vary line weights in networks too
      let networkWeight;
      const networkWeightRand = Math.random();
      if (networkWeightRand < 0.4) {
        networkWeight = p.random(0.2, 0.8); // Very thin network lines
      } else if (networkWeightRand < 0.7) {
        networkWeight = p.random(0.8, 2); // Medium network lines
      } else if (networkWeightRand < 0.9) {
        networkWeight = p.random(2, 4); // Thick network lines
      } else {
        networkWeight = p.random(4, 8); // Bold network lines
      }

      lines.push({
        type: 'line',
        x: startX + (endX - startX) / 2,
        y: startY + (endY - startY) / 2,
        opacity: 0,
        targetOpacity: 1.0, // Full opacity for hard intersections
        rotation: angle,
        scale: 1,
        data: {
          length: length,
          weight: networkWeight,
          color: getRandomColor(),
        },
        age: 0,
        zIndex: 1,
      });
    }

    return lines;
  };

  const createStructuralGroup = (x: number, y: number): SceneElement[] => {
    const elements: SceneElement[] = [];
    const groupSize = Math.floor(p.random(4, 8)); // Larger groups

    for (let i = 0; i < groupSize; i++) {
      const offsetX = p.random(-120, 120); // Wider spread
      const offsetY = p.random(-90, 90);
      const elementX = x + offsetX;
      const elementY = y + offsetY;

      const rand = Math.random();
      if (rand < 0.6) {
        // More lines in groups
        // Structural line with varied weight
        let groupWeight;
        const groupWeightRand = Math.random();
        if (groupWeightRand < 0.35) {
          groupWeight = p.random(0.4, 1.2); // Thin group lines
        } else if (groupWeightRand < 0.65) {
          groupWeight = p.random(1.2, 3.5); // Medium group lines
        } else if (groupWeightRand < 0.85) {
          groupWeight = p.random(3.5, 7); // Thick group lines
        } else {
          groupWeight = p.random(7, 15); // Very thick group lines
        }

        elements.push({
          type: 'line',
          x: elementX,
          y: elementY,
          opacity: 0,
          targetOpacity: 1.0,
          rotation: p.random(-p.PI, p.PI),
          scale: 1,
          data: {
            length: p.random(40, 150),
            weight: groupWeight,
            color: getRandomColor(),
          },
          age: 0,
          zIndex: 1,
        });
      } else {
        // Geometric plane
        elements.push({
          type: 'textured-shape',
          x: elementX,
          y: elementY,
          opacity: 0,
          targetOpacity: p.random(0.4, 0.8),
          rotation: p.random(-p.PI / 4, p.PI / 4),
          scale: p.random(0.6, 1.4),
          data: {
            shapeType: ['rectangle', 'triangle'][Math.floor(Math.random() * 2)],
            width: p.random(25, 90),
            height: p.random(35, 120),
            depth: p.random(8, 35),
            color: getRandomColor(),
            perspective: p.random(0.6, 0.95),
          },
          age: 0,
          zIndex: 0,
        });
      }
    }

    return elements;
  };

  const createBlackboard = (x: number, y: number): SceneElement => {
    return {
      type: 'math-notation',
      x,
      y,
      opacity: 0,
      targetOpacity: 0.85,
      rotation: p.random(-p.PI / 20, p.PI / 20),
      scale: 1,
      data: {
        notations: Array.from(
          { length: Math.floor(p.random(2, 4)) },
          () => mathNotations[Math.floor(Math.random() * mathNotations.length)],
        ),
        hasGeometry: true,
        style: 'chalk',
      },
      age: 0,
      zIndex: 4,
    };
  };

  const createPhotoElement = (): SceneElement | null => {
    if (loadedPhotos.length === 0) return null;

    const photo = loadedPhotos[Math.floor(Math.random() * loadedPhotos.length)];
    const scale = p.random(0.4, 0.7); // Larger images

    // Position photo thoughtfully in the composition - avoid text area
    const textHeight = p.height * 0.2;
    const positions = [
      { x: p.width * 0.25, y: p.height * 0.6 }, // Lower left
      { x: p.width * 0.75, y: p.height * 0.5 }, // Right center
      { x: p.width * 0.5, y: p.height * 0.7 }, // Lower center
      { x: p.width * 0.3, y: textHeight + 100 }, // Safe upper left
    ];
    const pos = positions[Math.floor(Math.random() * positions.length)];

    return {
      type: 'photo',
      x: pos.x,
      y: pos.y,
      opacity: 0,
      targetOpacity: 1.0, // Full opacity for hard intersections
      rotation: p.random(-p.PI / 16, p.PI / 16),
      scale,
      data: {
        image: photo,
        width: photo.width * scale,
        height: photo.height * scale,
        maskType: ['triangle', 'circle', 'angular', 'organic', 'diamond'][
          Math.floor(Math.random() * 5)
        ],
      },
      age: 0,
      zIndex: 6, // Photos on top
    };
  };

  const createMathNotation = (x: number, y: number): SceneElement => {
    return {
      type: 'math-notation',
      x,
      y,
      opacity: 0,
      targetOpacity: 0.8,
      rotation: p.random(-p.PI / 20, p.PI / 20),
      scale: p.random(0.8, 1.5),
      data: {
        text: mathNotations[Math.floor(Math.random() * mathNotations.length)],
        style: Math.random() > 0.5 ? 'handwritten' : 'geometric',
      },
      age: 0,
      zIndex: 3,
    };
  };

  const createThickRing = (x: number, y: number): SceneElement => {
    return {
      type: 'thick-ring',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0,
      rotation: p.random(-p.PI / 12, p.PI / 12),
      scale: p.random(0.7, 1.3),
      data: {
        outerRadius: p.random(60, 120),
        innerRadius: p.random(20, 50),
        thickness: p.random(15, 40),
        color: getRandomColor(),
        hasTexture: Math.random() > 0.4,
        textureType: ['crosshatch', 'dots', 'lines', 'grid'][
          Math.floor(Math.random() * 4)
        ],
        segments: 0,
      },
      age: 0,
      zIndex: Math.random() > 0.5 ? 5 : 2, // Random layering for overlap effects
    };
  };

  const createGeometricFramework = (x: number, y: number): SceneElement => {
    const frameType = ['triangular', 'rectangular', 'radial', 'complex'][
      Math.floor(Math.random() * 4)
    ];

    return {
      type: 'geometric-framework',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0,
      rotation: p.random(-p.PI / 6, p.PI / 6),
      scale: p.random(0.8, 1.4),
      data: {
        frameType,
        size: p.random(80, 180),
        complexity: Math.floor(p.random(3, 8)),
        strokeWeight: p.random(1, 6),
        color: getRandomColor(),
        hasInnerGeometry: Math.random() > 0.4,
        hasTexture: Math.random() > 0.5,
        textureType: ['crosshatch', 'parallel', 'radial'][
          Math.floor(Math.random() * 3)
        ],
      },
      age: 0,
      zIndex: Math.floor(Math.random() * 6), // Varied layering
    };
  };

  const createComplexConstellation = (x: number, y: number): SceneElement => {
    return {
      type: 'geometric-framework',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0,
      rotation: p.random(-p.PI / 8, p.PI / 8),
      scale: p.random(0.9, 1.3),
      data: {
        frameType: 'constellation',
        size: p.random(180, 320), // Increased from 120-220 to 180-320
        complexity: Math.floor(p.random(5, 10)),
        strokeWeight: p.random(1, 3),
        color: getRandomColor(),
        nodeCount: Math.floor(p.random(6, 12)),
        connectionDensity: p.random(0.3, 0.7),
      },
      age: 0,
      zIndex: 3,
    };
  };

  const createModularGrid = (x: number, y: number): SceneElement => {
    return {
      type: 'geometric-framework',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0,
      rotation: p.random(-p.PI / 12, p.PI / 12),
      scale: p.random(0.8, 1.2),
      data: {
        frameType: 'modular-grid',
        size: p.random(100, 200),
        complexity: Math.floor(p.random(4, 7)),
        strokeWeight: p.random(1, 4),
        color: getRandomColor(),
        gridType: ['square', 'hexagonal', 'triangular'][
          Math.floor(Math.random() * 3)
        ],
        fillDensity: p.random(0.2, 0.6),
      },
      age: 0,
      zIndex: 2,
    };
  };

  const createOrganicMechanism = (x: number, y: number): SceneElement => {
    return {
      type: 'geometric-framework',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0,
      rotation: p.random(-p.PI / 10, p.PI / 10),
      scale: p.random(0.7, 1.4),
      data: {
        frameType: 'organic-mechanism',
        size: p.random(90, 180),
        complexity: Math.floor(p.random(4, 9)),
        strokeWeight: p.random(1, 5),
        color: getRandomColor(),
        gearCount: Math.floor(p.random(3, 7)),
        organicFlow: p.random(0.3, 0.8),
      },
      age: 0,
      zIndex: 4,
    };
  };

  const createArchitecturalSchematic = (x: number, y: number): SceneElement => {
    return {
      type: 'geometric-framework',
      x,
      y,
      opacity: 0,
      targetOpacity: 1.0,
      rotation: p.random(-p.PI / 16, p.PI / 16),
      scale: p.random(0.9, 1.3),
      data: {
        frameType: 'architectural-schematic',
        size: p.random(110, 190),
        complexity: Math.floor(p.random(3, 6)),
        strokeWeight: p.random(1, 3),
        color: getRandomColor(),
        structureType: ['blueprint', 'elevation', 'section'][
          Math.floor(Math.random() * 3)
        ],
        detailLevel: p.random(0.4, 0.9),
      },
      age: 0,
      zIndex: 2,
    };
  };

  const createNewScene = (): Scene => {
    // Get next 2 lines of the poem
    const textLines: string[] = [];
    for (let i = 0; i < 2 && currentLineIndex < POEM_LINES.length; i++) {
      textLines.push(POEM_LINES[currentLineIndex]);
      currentLineIndex++;
    }

    // If we've reached the end, start over
    if (currentLineIndex >= POEM_LINES.length) {
      currentLineIndex = 0;
    }

    // Calculate total characters for typewriter effect
    const totalCharacters = textLines.join('').length;

    // Don't create photo element immediately - wait for delay
    return {
      elements: [], // Start with no elements
      textLines,
      photoElement: null, // Will be created after delay
      startLineIndex: currentLineIndex - textLines.length,
      complete: false,
      age: 0,
      delayBeforeElements: ELEMENT_DELAY_FRAMES, // Set initial delay
      typewriterProgress: 0, // Start with no characters visible
      isExiting: false,
      totalCharacters,
    };
  };

  const drawTexturedShape = (element: SceneElement) => {
    const data = element.data;
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    p.scale(element.scale);

    const alpha = element.opacity * 255;

    switch (data.shapeType) {
      case 'abstract-3d':
        drawAbstract3DForm(data, alpha);
        break;
      case 'intersecting-plane':
        drawIntersectingPlane(data, alpha, element, currentScene!);
        break;
      case 'large-color-plane':
        drawLargeColorPlane(data, alpha);
        break;
      case 'massive-plane':
        drawMassivePlane(data, alpha);
        break;
      case 'layered-abstract':
        drawLayeredAbstractForm(data, alpha);
        break;
      case 'dynamic-form':
        drawDynamicForm(data, alpha);
        break;
      default:
        drawBasicShape(data, alpha);
    }

    p.pop();
  };

  const drawAbstract3DForm = (data: any, alpha: number) => {
    const perspective = data.perspective;
    const w = data.width;
    const h = data.height;
    const d = data.depth;

    // Calculate perspective offsets
    const offsetX = d * 0.4;
    const offsetY = -d * 0.25;

    // Only create angular forms, remove organic/propeller shapes
    // Create abstract angular form with depth - fully opaque
    p.fill(p.red(data.color), p.green(data.color), p.blue(data.color), 255);
    p.stroke(20, 20, 25, 255);
    p.strokeWeight(1);

    // Front irregular polygon
    p.beginShape();
    p.vertex(-w / 2, -h / 3);
    p.vertex(w / 3, -h / 2);
    p.vertex(w / 2, h / 4);
    p.vertex(-w / 4, h / 2);
    p.vertex(-w / 2, h / 3);
    p.endShape(p.CLOSE);

    // Back form (perspective) - darker but still opaque
    p.fill(
      p.red(data.color) * 0.7,
      p.green(data.color) * 0.7,
      p.blue(data.color) * 0.7,
      255,
    );
    p.beginShape();
    p.vertex(
      (-w / 2) * perspective + offsetX,
      (-h / 3) * perspective + offsetY,
    );
    p.vertex((w / 3) * perspective + offsetX, (-h / 2) * perspective + offsetY);
    p.vertex((w / 2) * perspective + offsetX, (h / 4) * perspective + offsetY);
    p.vertex((-w / 4) * perspective + offsetX, (h / 2) * perspective + offsetY);
    p.vertex((-w / 2) * perspective + offsetX, (h / 3) * perspective + offsetY);
    p.endShape(p.CLOSE);

    // Connecting edges
    p.stroke(20, 20, 25, 200);
    p.line(
      -w / 2,
      -h / 3,
      (-w / 2) * perspective + offsetX,
      (-h / 3) * perspective + offsetY,
    );
    p.line(
      w / 3,
      -h / 2,
      (w / 3) * perspective + offsetX,
      (-h / 2) * perspective + offsetY,
    );
    p.line(
      w / 2,
      h / 4,
      (w / 2) * perspective + offsetX,
      (h / 4) * perspective + offsetY,
    );
  };

  const drawLayeredAbstractForm = (data: any, alpha: number) => {
    // Create overlapping abstract layers
    for (let i = 0; i < data.numLayers; i++) {
      const layerAlpha = alpha * (0.3 + i * 0.3);
      const color = data.colors[i % data.colors.length];
      const offset = i * 15;
      const scale = 1 - i * 0.15;

      p.push();
      p.translate(offset * 0.7, -offset * 0.5);
      p.scale(scale);

      p.fill(p.red(color), p.green(color), p.blue(color), layerAlpha);
      p.stroke(20, 20, 25, alpha * 0.8);
      p.strokeWeight(1);

      // Create abstract layered shapes
      if (i % 2 === 0) {
        // Geometric layer
        p.beginShape();
        p.vertex(-data.width / 3, -data.height / 2);
        p.vertex(data.width / 2, -data.height / 3);
        p.vertex(data.width / 3, data.height / 3);
        p.vertex(-data.width / 2, data.height / 2);
        p.endShape(p.CLOSE);
      } else {
        // Organic layer
        p.beginShape();
        for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 6) {
          const radius = (data.width + data.height) / 4;
          const r = radius * (0.7 + 0.3 * Math.sin(angle * 3));
          p.vertex(r * Math.cos(angle), r * Math.sin(angle));
        }
        p.endShape(p.CLOSE);
      }

      p.pop();
    }
  };

  const drawDynamicForm = (data: any, alpha: number) => {
    const length = data.length;
    const thickness = data.thickness;

    // Create solid dynamic flowing form
    p.fill(p.red(data.color), p.green(data.color), p.blue(data.color), 255);
    p.stroke(20, 20, 25, 255);
    p.strokeWeight(1);

    // Main flowing shape with undulation
    p.beginShape();
    for (let i = 0; i <= length; i += 5) {
      const x = -length / 2 + i;
      const waveOffset = Math.sin((i / length) * p.PI * 2) * thickness * 0.3;
      const topY = -thickness / 2 + waveOffset;

      if (i === 0) {
        p.vertex(x, topY);
      } else {
        p.curveVertex(x, topY);
      }
    }

    for (let i = length; i >= 0; i -= 5) {
      const x = -length / 2 + i;
      const waveOffset = Math.sin((i / length) * p.PI * 2) * thickness * 0.3;
      const bottomY = thickness / 2 + waveOffset;
      p.curveVertex(x, bottomY);
    }
    p.endShape(p.CLOSE);

    // Add depth suggestion - darker but still opaque
    p.fill(
      p.red(data.color) * 0.6,
      p.green(data.color) * 0.6,
      p.blue(data.color) * 0.6,
      255,
    );
    p.beginShape();
    for (let i = 0; i <= length; i += 8) {
      const x = -length / 2 + i + thickness * 0.2;
      const y =
        Math.sin((i / length) * p.PI * 2) * thickness * 0.2 - thickness * 0.3;
      p.curveVertex(x, y);
    }
    p.endShape();
  };

  const drawBasicShape = (data: any, alpha: number) => {
    // Draw base shape with 3D perspective - fully opaque
    p.fill(p.red(data.color), p.green(data.color), p.blue(data.color), 255);
    p.stroke(20, 20, 25, 255);
    p.strokeWeight(1);

    const perspective = data.perspective || 1;
    const depth = data.depth || 0;

    switch (data.shapeType) {
      case 'rectangle':
        // Front face
        p.rect(-data.width / 2, -data.height / 2, data.width, data.height);

        if (depth > 0) {
          // 3D effect
          const offsetX = depth * 0.3;
          const offsetY = -depth * 0.2;
          p.fill(
            p.red(data.color) * 0.8,
            p.green(data.color) * 0.8,
            p.blue(data.color) * 0.8,
            255,
          );
          p.rect(
            -data.width / 2 + offsetX,
            -data.height / 2 + offsetY,
            data.width * perspective,
            data.height * perspective,
          );

          // Connecting lines
          p.stroke(20, 20, 25, 255);
          p.line(
            -data.width / 2,
            -data.height / 2,
            -data.width / 2 + offsetX,
            -data.height / 2 + offsetY,
          );
          p.line(
            data.width / 2,
            -data.height / 2,
            data.width / 2 + offsetX,
            -data.height / 2 + offsetY,
          );
          p.line(
            data.width / 2,
            data.height / 2,
            data.width / 2 + offsetX,
            data.height / 2 + offsetY,
          );
        }
        break;

      case 'triangle':
        p.triangle(
          0,
          -data.height / 2,
          -data.width / 2,
          data.height / 2,
          data.width / 2,
          data.height / 2,
        );
        break;
    }

    // Add texture - keep opaque
    if (data.texture === 'crosshatch') {
      p.stroke(20, 20, 25, 150);
      for (let i = -data.width / 2; i < data.width / 2; i += 8) {
        p.line(i, -data.height / 2, i + data.height / 3, data.height / 2);
      }
    } else if (data.texture === 'dots') {
      p.noStroke();
      p.fill(20, 20, 25, 100);
      for (let x = -data.width / 2; x < data.width / 2; x += 12) {
        for (let y = -data.height / 2; y < data.height / 2; y += 12) {
          p.circle(x, y, 3);
        }
      }
    }
  };

  const drawLargeColorPlane = (data: any, alpha: number) => {
    // Create large, solid color planes - no transparency
    p.fill(p.red(data.color), p.green(data.color), p.blue(data.color), 255);
    p.stroke(20, 20, 25, 200);
    p.strokeWeight(1);

    switch (data.planeType) {
      case 'vertical':
        // Tall vertical plane
        p.rect(-data.width / 2, -data.height / 2, data.width / 3, data.height);
        break;
      case 'horizontal':
        // Wide horizontal plane
        p.rect(-data.width / 2, -data.height / 2, data.width, data.height / 3);
        break;
      case 'diagonal':
        // Angled plane
        p.beginShape();
        p.vertex(-data.width / 2, -data.height / 3);
        p.vertex(data.width / 2, -data.height / 2);
        p.vertex(data.width / 3, data.height / 2);
        p.vertex(-data.width / 3, data.height / 3);
        p.endShape(p.CLOSE);
        break;
    }
  };

  const drawMassivePlane = (data: any, alpha: number) => {
    // Solid massive planes - no transparency
    p.fill(p.red(data.color), p.green(data.color), p.blue(data.color), 255);
    p.noStroke();

    // Simple massive rectangle
    p.rect(-data.width / 2, -data.height / 2, data.width, data.height);

    // Add subtle texture if specified - but keep it opaque
    if (data.hasTexture) {
      p.stroke(20, 20, 25, 100);
      p.strokeWeight(0.5);
      // Add very subtle grid texture
      for (let x = -data.width / 2; x < data.width / 2; x += 30) {
        p.line(x, -data.height / 2, x, data.height / 2);
      }
      for (let y = -data.height / 2; y < data.height / 2; y += 30) {
        p.line(-data.width / 2, y, data.width / 2, y);
      }
    }
  };

  const drawBlackboard = (element: SceneElement) => {
    const data = element.data;
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);

    const alpha = element.opacity * 255;

    // Draw blackboard with slight 3D effect
    p.fill(40, 40, 45, alpha);
    p.stroke(20, 20, 25, alpha);
    p.strokeWeight(2);
    p.rect(-data.width / 2, -data.height / 2, data.width, data.height);

    // Add 3D depth
    const depth = 8;
    p.fill(30, 30, 35, alpha * 0.8);
    p.beginShape();
    p.vertex(data.width / 2, -data.height / 2);
    p.vertex(data.width / 2 + depth, -data.height / 2 - depth);
    p.vertex(data.width / 2 + depth, data.height / 2 - depth);
    p.vertex(data.width / 2, data.height / 2);
    p.endShape(p.CLOSE);

    // Draw mathematical content
    p.fill(250, 250, 245, alpha * 0.9);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.textFont('Georgia, serif');

    // Mathematical notations and constructions
    const centerX = 0;
    const centerY = 0;

    // Draw geometric construction (like compass work)
    p.stroke(250, 250, 245, alpha * 0.8);
    p.strokeWeight(1);
    p.noFill();

    // Main circle construction
    const radius = Math.min(data.width, data.height) * 0.2;
    p.circle(centerX, centerY, radius * 2);

    // Cross lines through center
    p.line(centerX - radius, centerY, centerX + radius, centerY);
    p.line(centerX, centerY - radius, centerX, centerY + radius);

    // Angle construction
    const angleRadius = radius * 1.5;
    p.arc(centerX, centerY, angleRadius * 2, angleRadius * 2, 0, p.PI / 3);
    p.line(
      centerX,
      centerY,
      centerX + angleRadius * Math.cos(0),
      centerY + angleRadius * Math.sin(0),
    );
    p.line(
      centerX,
      centerY,
      centerX + angleRadius * Math.cos(p.PI / 3),
      centerY + angleRadius * Math.sin(p.PI / 3),
    );

    // Add measurement marks
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI;
      const x1 = centerX + radius * 0.9 * Math.cos(angle);
      const y1 = centerY + radius * 0.9 * Math.sin(angle);
      const x2 = centerX + radius * 1.1 * Math.cos(angle);
      const y2 = centerY + radius * 1.1 * Math.sin(angle);
      p.line(x1, y1, x2, y2);
    }

    // Add text annotations
    p.fill(250, 250, 245, alpha * 0.9);
    p.noStroke();
    p.textSize(14);

    // Left side annotations
    data.notations.forEach((notation: string, i: number) => {
      const x = -data.width / 2 + 15;
      const y = -data.height / 2 + 20 + i * 25;
      p.text(notation, x, y);
    });

    // Right side - architectural measurements
    p.textAlign(p.RIGHT, p.TOP);
    p.text('h = 120°', data.width / 2 - 15, -data.height / 2 + 20);
    p.text('r = √2', data.width / 2 - 15, -data.height / 2 + 45);
    p.text('∠ABC', data.width / 2 - 15, -data.height / 2 + 70);

    // Draw construction lines connecting to the main drawing
    p.stroke(250, 250, 245, alpha * 0.6);
    p.strokeWeight(1);
    p.line(
      centerX + radius,
      centerY,
      data.width / 2 - 50,
      -data.height / 2 + 35,
    );
    p.line(
      centerX,
      centerY - radius,
      -data.width / 2 + 80,
      -data.height / 2 + 25,
    );

    // Add small measurement indicators
    p.stroke(250, 250, 245, alpha * 0.8);
    p.strokeWeight(2);
    p.point(
      centerX + radius * Math.cos(p.PI / 6),
      centerY + radius * Math.sin(p.PI / 6),
    );
    p.point(centerX - radius * 0.7, centerY + radius * 0.7);

    p.pop();
  };

  const drawPhotoElement = (element: SceneElement) => {
    if (!element.data) return;

    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);

    const img = element.data.image as p5.Image;
    const width = element.data.width;
    const height = element.data.height;
    const maskType = element.data.maskType;

    // Add rotation animation to the mask based on element age
    const maskRotation = element.age * 0.01; // Slow rotation
    p.rotate(maskRotation);

    // Create clipping mask
    p.drawingContext.save();
    p.drawingContext.beginPath();

    switch (maskType) {
      case 'triangle':
        p.drawingContext.moveTo(0, -height / 2);
        p.drawingContext.lineTo(-width / 2, height / 2);
        p.drawingContext.lineTo(width / 2, height / 2);
        break;

      case 'circle':
        p.drawingContext.arc(0, 0, Math.min(width, height) / 2, 0, 2 * Math.PI);
        break;

      case 'angular':
        p.drawingContext.moveTo(-width * 0.2, -height / 2);
        p.drawingContext.lineTo(width / 2, -height * 0.3);
        p.drawingContext.lineTo(width * 0.3, height / 2);
        p.drawingContext.lineTo(-width / 2, height * 0.2);
        p.drawingContext.lineTo(-width * 0.3, -height * 0.1);
        break;

      case 'organic':
        for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 8) {
          const radius = Math.min(width, height) / 4;
          const r =
            radius * (0.6 + 0.4 * Math.sin(angle * 3 + element.age * 0.02));
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          if (angle === 0) {
            p.drawingContext.moveTo(x, y);
          } else {
            p.drawingContext.lineTo(x, y);
          }
        }
        break;

      case 'diamond':
        p.drawingContext.moveTo(0, -height / 2);
        p.drawingContext.lineTo(width / 2, 0);
        p.drawingContext.lineTo(0, height / 2);
        p.drawingContext.lineTo(-width / 2, 0);
        break;
    }

    p.drawingContext.closePath();
    p.drawingContext.clip();

    // Rotate back for the image so only the mask rotates
    p.rotate(-maskRotation);

    // Draw image within clipping mask
    p.tint(255, element.opacity * 255);
    p.imageMode(p.CENTER);
    p.image(img, 0, 0, width, height);

    p.drawingContext.restore();
    p.pop();
  };

  const drawMathNotation = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    p.scale(element.scale);

    const alpha = element.opacity * 255;

    if (element.data.hasGeometry) {
      // Complex mathematical diagram (like the chalk work in reference)
      drawComplexMathDiagram(element.data, alpha);
    } else {
      // Simple mathematical notation
      drawSimpleMathNotation(element.data, alpha);
    }

    p.pop();
  };

  const drawComplexMathDiagram = (data: any, alpha: number) => {
    // Draw mathematical content with dark colors for visibility
    p.fill(60, 60, 65, alpha * 0.9); // Dark text instead of white
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.textFont('Georgia, serif');

    // Mathematical notations and constructions
    const centerX = 0;
    const centerY = 0;

    // Draw geometric construction (like compass work)
    p.stroke(20, 20, 25, alpha * 0.8); // Dark lines instead of white
    p.strokeWeight(1);
    p.noFill();

    // Main circle construction
    const radius = 60;
    p.circle(centerX, centerY, radius * 2);

    // Cross lines through center
    p.line(centerX - radius, centerY, centerX + radius, centerY);
    p.line(centerX, centerY - radius, centerX, centerY + radius);

    // Angle construction
    const angleRadius = radius * 1.5;
    p.arc(centerX, centerY, angleRadius * 2, angleRadius * 2, 0, p.PI / 3);
    p.line(
      centerX,
      centerY,
      centerX + angleRadius * Math.cos(0),
      centerY + angleRadius * Math.sin(0),
    );
    p.line(
      centerX,
      centerY,
      centerX + angleRadius * Math.cos(p.PI / 3),
      centerY + angleRadius * Math.sin(p.PI / 3),
    );

    // Add measurement marks
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI;
      const x1 = centerX + radius * 0.9 * Math.cos(angle);
      const y1 = centerY + radius * 0.9 * Math.sin(angle);
      const x2 = centerX + radius * 1.1 * Math.cos(angle);
      const y2 = centerY + radius * 1.1 * Math.sin(angle);
      p.line(x1, y1, x2, y2);
    }

    // Add text annotations
    p.fill(60, 60, 65, alpha * 0.9); // Dark text
    p.noStroke();
    p.textSize(14);

    // Left side annotations
    data.notations.forEach((notation: string, i: number) => {
      const x = -120;
      const y = -60 + i * 25;
      p.text(notation, x, y);
    });

    // Right side - architectural measurements
    p.textAlign(p.RIGHT, p.TOP);
    p.text('h = 120°', 120, -60);
    p.text('r = √2', 120, -35);
    p.text('∠ABC', 120, -10);

    // Draw construction lines
    p.stroke(20, 20, 25, alpha * 0.6); // Dark lines
    p.strokeWeight(1);
    p.line(centerX + radius, centerY, 70, -45);
    p.line(centerX, centerY - radius, -40, -55);

    // Add small measurement indicators
    p.stroke(20, 20, 25, alpha * 0.8); // Dark points
    p.strokeWeight(2);
    p.point(
      centerX + radius * Math.cos(p.PI / 6),
      centerY + radius * Math.sin(p.PI / 6),
    );
    p.point(centerX - radius * 0.7, centerY + radius * 0.7);
  };

  const drawSimpleMathNotation = (data: any, alpha: number) => {
    if (data.style === 'handwritten') {
      p.fill(60, 60, 65, alpha);
      p.textFont('Georgia, serif');
      p.textStyle(p.ITALIC);
    } else {
      p.fill(20, 20, 25, alpha);
      p.textFont('Helvetica, Arial, sans-serif');
      p.textStyle(p.NORMAL);
    }

    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(data.text, 0, 0);

    // Add underline or circle occasionally
    if (Math.random() > 0.7) {
      p.stroke(20, 20, 25, alpha * 0.5);
      p.strokeWeight(1);
      if (Math.random() > 0.5) {
        p.line(-30, 10, 30, 10);
      } else {
        p.noFill();
        p.circle(0, 0, 60);
      }
    }
  };

  const drawLine = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);

    // Fully opaque lines with square caps for sharp edges
    const color = element.data.color || palette.black();
    p.stroke(p.red(color), p.green(color), p.blue(color), 255);
    p.strokeWeight(element.data.weight || 2);
    p.strokeCap(p.SQUARE); // Sharp, angular line endings instead of rounded
    p.line(-element.data.length / 2, 0, element.data.length / 2, 0);

    p.pop();
  };

  const drawCircle = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);

    const alpha = element.opacity * 255;
    const color = element.data.color || palette.black();

    if (element.data.filled) {
      p.fill(p.red(color), p.green(color), p.blue(color), alpha);
      p.noStroke();
    } else {
      p.noFill();
      p.stroke(p.red(color), p.green(color), p.blue(color), alpha);
      p.strokeWeight(2);
    }

    p.circle(0, 0, element.data.radius * 2);

    p.pop();
  };

  const drawThickRing = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    p.scale(element.scale);

    const data = element.data;
    const alpha = element.opacity * 255;
    const color = data.color;

    // Draw main ring
    p.fill(p.red(color), p.green(color), p.blue(color), alpha);
    p.stroke(20, 20, 25, alpha);
    p.strokeWeight(2);

    if (data.segments && data.segments > 0) {
      // Segmented ring
      const angleStep = p.TWO_PI / data.segments;
      for (let i = 0; i < data.segments; i++) {
        const startAngle = i * angleStep;
        const endAngle = startAngle + angleStep * 0.8; // Gaps between segments

        p.beginShape();
        for (let angle = startAngle; angle <= endAngle; angle += 0.1) {
          p.vertex(
            data.outerRadius * Math.cos(angle),
            data.outerRadius * Math.sin(angle),
          );
        }
        for (let angle = endAngle; angle >= startAngle; angle -= 0.1) {
          p.vertex(
            data.innerRadius * Math.cos(angle),
            data.innerRadius * Math.sin(angle),
          );
        }
        p.endShape(p.CLOSE);
      }
    } else {
      // Solid ring - use a different approach without HOLES
      p.beginShape();
      // Outer edge
      for (let angle = 0; angle < p.TWO_PI; angle += 0.1) {
        p.vertex(
          data.outerRadius * Math.cos(angle),
          data.outerRadius * Math.sin(angle),
        );
      }
      p.endShape(p.CLOSE);

      // Inner hole - draw as background color
      p.fill(245, 240, 230); // Background color
      p.noStroke();
      p.beginShape();
      for (let angle = 0; angle < p.TWO_PI; angle += 0.1) {
        p.vertex(
          data.innerRadius * Math.cos(angle),
          data.innerRadius * Math.sin(angle),
        );
      }
      p.endShape(p.CLOSE);
    }

    // Add texture if specified
    if (data.hasTexture) {
      drawRingTexture(data, alpha);
    }

    p.pop();
  };

  const drawGeometricFramework = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    p.scale(element.scale);

    const data = element.data;
    const alpha = element.opacity * 255;
    const color = data.color;

    p.stroke(p.red(color), p.green(color), p.blue(color), alpha);
    p.strokeWeight(data.strokeWeight);
    p.strokeCap(p.SQUARE);
    p.noFill();

    switch (data.frameType) {
      case 'triangular':
        drawTriangularFramework(data, alpha);
        break;
      case 'rectangular':
        drawRectangularFramework(data, alpha);
        break;
      case 'radial':
        drawRadialFramework(data, alpha);
        break;
      case 'complex':
        drawComplexFramework(data, alpha);
        break;
      case 'constellation':
        drawConstellation(data, alpha, element);
        break;
      case 'modular-grid':
        drawModularGrid(data, alpha);
        break;
      case 'organic-mechanism':
        drawOrganicMechanism(data, alpha, element);
        break;
      case 'architectural-schematic':
        drawArchitecturalSchematic(data, alpha);
        break;
    }

    // Add texture if specified
    if (data.hasTexture) {
      drawFrameworkTexture(data, alpha);
    }

    p.pop();
  };

  const drawRingTexture = (data: any, alpha: number) => {
    p.stroke(20, 20, 25, alpha * 0.6);
    p.strokeWeight(1);

    switch (data.textureType) {
      case 'crosshatch':
        for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 12) {
          p.line(
            data.innerRadius * Math.cos(angle),
            data.innerRadius * Math.sin(angle),
            data.outerRadius * Math.cos(angle),
            data.outerRadius * Math.sin(angle),
          );
        }
        break;
      case 'dots':
        for (let r = data.innerRadius; r < data.outerRadius; r += 8) {
          for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 8) {
            p.point(r * Math.cos(angle), r * Math.sin(angle));
          }
        }
        break;
      case 'lines':
        for (let r = data.innerRadius; r < data.outerRadius; r += 6) {
          p.noFill();
          p.circle(0, 0, r * 2);
        }
        break;
      case 'grid':
        for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 8) {
          p.line(
            data.innerRadius * Math.cos(angle),
            data.innerRadius * Math.sin(angle),
            data.outerRadius * Math.cos(angle),
            data.outerRadius * Math.sin(angle),
          );
        }
        for (let r = data.innerRadius; r < data.outerRadius; r += 10) {
          p.circle(0, 0, r * 2);
        }
        break;
    }
  };

  const drawTriangularFramework = (data: any, alpha: number) => {
    const size = data.size;
    const complexity = data.complexity;

    // Main triangle
    p.triangle(0, -size / 2, -size / 2, size / 2, size / 2, size / 2);

    // Inner triangular subdivisions
    for (let i = 1; i < complexity; i++) {
      const scale = 1 - i / complexity;
      const s = size * scale;
      p.triangle(0, -s / 2, -s / 2, s / 2, s / 2, s / 2);
    }

    // Cross lines
    p.line(0, -size / 2, 0, size / 2);
    p.line(-size / 2, size / 2, size / 2, size / 2);
  };

  const drawRectangularFramework = (data: any, alpha: number) => {
    const size = data.size;
    const complexity = data.complexity;

    // Main rectangle
    p.rect(-size / 2, -size / 2, size, size);

    // Inner rectangular subdivisions
    for (let i = 1; i < complexity; i++) {
      const scale = 1 - i / complexity;
      const s = size * scale;
      p.rect(-s / 2, -s / 2, s, s);
    }

    // Cross and grid lines
    p.line(-size / 2, 0, size / 2, 0);
    p.line(0, -size / 2, 0, size / 2);

    if (data.hasInnerGeometry) {
      p.line(-size / 2, -size / 2, size / 2, size / 2);
      p.line(-size / 2, size / 2, size / 2, -size / 2);
    }
  };

  const drawRadialFramework = (data: any, alpha: number) => {
    const size = data.size;
    const complexity = data.complexity;

    // Central circle
    p.circle(0, 0, size / 4);

    // Radiating lines
    for (let i = 0; i < complexity * 2; i++) {
      const angle = (i / (complexity * 2)) * p.TWO_PI;
      p.line(0, 0, (size / 2) * Math.cos(angle), (size / 2) * Math.sin(angle));
    }

    // Concentric circles
    for (let i = 1; i <= complexity; i++) {
      const radius = (size / 2) * (i / complexity);
      p.circle(0, 0, radius * 2);
    }
  };

  const drawComplexFramework = (data: any, alpha: number) => {
    const size = data.size;
    const complexity = data.complexity;

    // Combination of geometric elements
    p.rect(-size / 2, -size / 2, size, size);
    p.circle(0, 0, size);

    // Complex internal structure
    for (let i = 0; i < complexity; i++) {
      const angle = (i / complexity) * p.TWO_PI;
      const x = (size / 3) * Math.cos(angle);
      const y = (size / 3) * Math.sin(angle);

      p.line(0, 0, x, y);
      p.circle(x, y, size / 6);

      if (i > 0) {
        const prevAngle = ((i - 1) / complexity) * p.TWO_PI;
        const prevX = (size / 3) * Math.cos(prevAngle);
        const prevY = (size / 3) * Math.sin(prevAngle);
        p.line(x, y, prevX, prevY);
      }
    }
  };

  const drawConstellation = (
    data: any,
    alpha: number,
    element?: SceneElement,
  ) => {
    const size = data.size;
    const nodeCount = data.nodeCount;
    const connectionDensity = data.connectionDensity;

    // Add slow animation using element age
    const slowTime = element ? element.age * 0.025 : 0; // Increased from 0.015 to 0.025

    // Generate constellation nodes with deterministic values plus slow animation
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      // Use deterministic values to prevent flashing
      const baseAngle =
        (i / nodeCount) * p.TWO_PI + (((i * 0.618) % 1) - 0.5) * 0.6; // Deterministic offset using golden ratio
      const baseRadius = size * (0.2 + ((i * 0.382) % 1) * 0.25); // Deterministic radius between 0.2-0.45
      const nodeSize = 4 + ((i * 17) % 8); // Deterministic size between 4-12

      // Add gentle orbital motion
      const orbitOffset = Math.sin(slowTime + i * 0.5) * 0.1; // Small orbital variation
      const radiusOffset = Math.cos(slowTime * 0.8 + i * 0.3) * size * 0.02; // Gentle radius pulsing

      const angle = baseAngle + orbitOffset;
      const radius = baseRadius + radiusOffset;

      nodes.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        size: nodeSize + Math.sin(slowTime * 2 + i) * 1, // Gentle size pulsing
      });
    }

    // Draw connections between nodes
    p.strokeWeight(1);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Use deterministic connection probability
        if (((i * 7 + j * 11) % 100) / 100 < connectionDensity) {
          // Replaces Math.random() < connectionDensity
          const distance = Math.sqrt(
            (nodes[j].x - nodes[i].x) ** 2 + (nodes[j].y - nodes[i].y) ** 2,
          );
          // Vary line weight based on distance
          p.strokeWeight(Math.max(0.5, 3 - distance / 50));
          p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
        }
      }
    }

    // Draw nodes as circles and connection points
    for (const node of nodes) {
      // Main node circle
      p.strokeWeight(2);
      p.circle(node.x, node.y, node.size);

      // Inner detail
      p.strokeWeight(1);
      p.circle(node.x, node.y, node.size * 0.5);

      // Connection rays
      for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 4) {
        const rayLength = node.size * 0.8;
        p.line(
          node.x + node.size * 0.3 * Math.cos(angle),
          node.y + node.size * 0.3 * Math.sin(angle),
          node.x + rayLength * Math.cos(angle),
          node.y + rayLength * Math.sin(angle),
        );
      }
    }
  };

  const drawModularGrid = (data: any, alpha: number) => {
    const size = data.size;
    const complexity = data.complexity;
    const fillDensity = data.fillDensity;
    const gridType = data.gridType;

    switch (gridType) {
      case 'square':
        // Square modular grid
        const cellSize = size / complexity;
        for (let row = 0; row < complexity; row++) {
          for (let col = 0; col < complexity; col++) {
            const x = -size / 2 + col * cellSize + cellSize / 2;
            const y = -size / 2 + row * cellSize + cellSize / 2;

            // Grid structure
            p.strokeWeight(1);
            p.rect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize);

            // Fill some cells with complex patterns
            if (((row * 7 + col * 11) % 100) / 100 < fillDensity) {
              // Deterministic instead of Math.random() < fillDensity
              if ((row + col) % 2 === 0) {
                // Deterministic instead of Math.random() > 0.5
                // Diagonal cross
                p.line(
                  x - cellSize / 3,
                  y - cellSize / 3,
                  x + cellSize / 3,
                  y + cellSize / 3,
                );
                p.line(
                  x - cellSize / 3,
                  y + cellSize / 3,
                  x + cellSize / 3,
                  y - cellSize / 3,
                );
              } else {
                // Concentric shapes
                p.strokeWeight(0.5);
                p.rect(
                  x - cellSize / 4,
                  y - cellSize / 4,
                  cellSize / 2,
                  cellSize / 2,
                );
                p.circle(x, y, cellSize / 3);
              }
            }
          }
        }
        break;

      case 'hexagonal':
        // Hexagonal grid pattern
        const hexRadius = size / (complexity * 2);
        for (let ring = 0; ring < complexity; ring++) {
          const hexCount = ring === 0 ? 1 : ring * 6;
          for (let i = 0; i < hexCount; i++) {
            const angle = (i / hexCount) * p.TWO_PI;
            const distance = ring * hexRadius * 1.8;
            const x = distance * Math.cos(angle);
            const y = distance * Math.sin(angle);

            // Draw hexagon
            p.strokeWeight(1);
            drawHexagon(x, y, hexRadius);

            // Add internal structure
            if (((ring * 13 + i * 17) % 100) / 100 < fillDensity) {
              // Deterministic instead of Math.random() < fillDensity
              p.strokeWeight(0.5);
              drawHexagon(x, y, hexRadius * 0.6);
              p.circle(x, y, hexRadius * 0.4);
            }
          }
        }
        break;

      case 'triangular':
        // Triangular grid
        const triSize = size / complexity;
        for (let row = 0; row < complexity; row++) {
          for (let col = 0; col < complexity - row; col++) {
            const x = -size / 2 + col * triSize + (row * triSize) / 2;
            const y = -size / 2 + row * triSize * 0.866;

            p.strokeWeight(1);
            p.triangle(
              x,
              y - triSize / 2,
              x - triSize / 2,
              y + triSize / 4,
              x + triSize / 2,
              y + triSize / 4,
            );

            if (((row * 19 + col * 23) % 100) / 100 < fillDensity) {
              // Deterministic instead of Math.random() < fillDensity
              p.strokeWeight(0.5);
              p.line(x, y - triSize / 4, x, y + triSize / 4);
              p.circle(x, y, triSize / 6);
            }
          }
        }
        break;
    }
  };

  const drawOrganicMechanism = (
    data: any,
    alpha: number,
    element?: SceneElement,
  ) => {
    const size = data.size;
    const gearCount = data.gearCount;
    const organicFlow = data.organicFlow;

    // Add slow animation using element age
    const slowTime = element ? element.age * 0.02 : 0; // Increase speed to make movement visible

    // Debug logging (remove after testing)
    if (element && element.age % 60 === 0) {
      // Log every 60 frames (1 second)
      console.log(
        'Organic mechanism animation - age:',
        element.age,
        'slowTime:',
        slowTime,
      );
    }

    // Create gear-like mechanical elements with organic connections
    // Use deterministic values based on index instead of random
    const gears = [];
    for (let i = 0; i < gearCount; i++) {
      // Use deterministic values instead of random to prevent flashing
      const angle = (i / gearCount) * p.TWO_PI + ((i * 0.3) % 1) - 0.5; // Deterministic offset
      const radius = size * (0.2 + ((i * 0.7) % 1) * 0.2); // Deterministic radius between 0.2-0.4
      const gearRadius = 15 + ((i * 11) % 15); // Deterministic radius between 15-30
      const teeth = Math.floor(8 + ((i * 7) % 8)); // Deterministic teeth count 8-16

      gears.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        radius: gearRadius,
        teeth: teeth,
        rotation: ((i * 1.618) % p.TWO_PI) + slowTime * (i % 2 === 0 ? 1 : -1), // Slow rotation, alternating direction
      });
    }

    // Draw organic connecting curves between gears
    p.strokeWeight(2);
    for (let i = 0; i < gears.length; i++) {
      for (let j = i + 1; j < gears.length; j++) {
        // Use deterministic connection probability
        if ((i * 7 + j * 11) % 10 < 6) {
          // Replaces Math.random() < 0.6
          const g1 = gears[i];
          const g2 = gears[j];

          // Organic bezier curve connection with deterministic offsets plus slow animation
          const offsetSeed = i * 13 + j * 17; // Deterministic seed
          const baseOffsetX = (((offsetSeed * 31) % 60) - 30) * organicFlow;
          const baseOffsetY = (((offsetSeed * 37) % 60) - 30) * organicFlow;

          // Add gentle breathing motion
          const breathingX = Math.sin(slowTime * 2 + i) * 10; // Increase amplitude from 5 to 10
          const breathingY = Math.cos(slowTime * 1.5 + j) * 10; // Increase amplitude from 5 to 10

          const midX = (g1.x + g2.x) / 2 + baseOffsetX + breathingX;
          const midY = (g1.y + g2.y) / 2 + baseOffsetY + breathingY;

          p.noFill();
          p.strokeWeight(1.5);
          p.bezier(
            g1.x,
            g1.y,
            g1.x + (midX - g1.x) * 0.5,
            g1.y + (midY - g1.y) * 0.3,
            g2.x + (midX - g2.x) * 0.5,
            g2.y + (midY - g2.y) * 0.3,
            g2.x,
            g2.y,
          );
        }
      }
    }

    // Draw mechanical gears
    for (const gear of gears) {
      p.strokeWeight(2);

      // Gear teeth
      const angleStep = p.TWO_PI / gear.teeth;
      for (let i = 0; i < gear.teeth; i++) {
        const angle = i * angleStep + gear.rotation;
        const innerRadius = gear.radius * 0.8;
        const outerRadius = gear.radius * 1.1;

        // Tooth shape
        p.line(
          gear.x + innerRadius * Math.cos(angle),
          gear.y + innerRadius * Math.sin(angle),
          gear.x + outerRadius * Math.cos(angle),
          gear.y + outerRadius * Math.sin(angle),
        );
      }

      // Gear body
      p.circle(gear.x, gear.y, gear.radius * 1.6);
      p.circle(gear.x, gear.y, gear.radius * 0.6);

      // Center hub
      p.strokeWeight(3);
      p.circle(gear.x, gear.y, gear.radius * 0.3);
    }
  };

  const drawArchitecturalSchematic = (data: any, alpha: number) => {
    const size = data.size;
    const detailLevel = data.detailLevel;
    const structureType = data.structureType;

    p.strokeWeight(1);

    switch (structureType) {
      case 'blueprint':
        // Blueprint-style technical drawing
        // Main structure outline
        p.rect(-size / 2, -size / 2, size, size);

        // Internal divisions
        const divisions = Math.floor(3 + detailLevel * 4);
        for (let i = 1; i < divisions; i++) {
          const pos = -size / 2 + (i / divisions) * size;
          p.line(pos, -size / 2, pos, size / 2); // Vertical lines
          p.line(-size / 2, pos, size / 2, pos); // Horizontal lines
        }

        // Technical details
        if (detailLevel > 0.5) {
          // Dimension lines
          p.strokeWeight(0.5);
          p.line(-size / 2 - 20, -size / 2, -size / 2 - 20, size / 2);
          p.line(-size / 2 - 25, -size / 2, -size / 2 - 15, -size / 2);
          p.line(-size / 2 - 25, size / 2, -size / 2 - 15, size / 2);

          // Hatching in some areas
          for (let i = 0; i < 3; i++) {
            const x = p.random(-size / 3, size / 3);
            const y = p.random(-size / 3, size / 3);
            const hatchSize = 20;
            for (let j = 0; j < 5; j++) {
              p.line(
                x - hatchSize / 2 + j * 4,
                y - hatchSize / 2,
                x - hatchSize / 2 + j * 4,
                y + hatchSize / 2,
              );
            }
          }
        }
        break;

      case 'elevation':
        // Architectural elevation view
        // Building outline
        p.beginShape();
        p.vertex(-size / 2, size / 2);
        p.vertex(-size / 2, -size / 3);
        p.vertex(-size / 4, -size / 2);
        p.vertex(size / 4, -size / 2);
        p.vertex(size / 2, -size / 3);
        p.vertex(size / 2, size / 2);
        p.endShape(p.CLOSE);

        // Windows and details
        const windowCount = Math.floor(2 + detailLevel * 3);
        for (let i = 0; i < windowCount; i++) {
          const x = p.map(i, 0, windowCount - 1, -size / 3, size / 3);
          const y = p.random(-size / 4, size / 4);
          p.rect(x - 8, y - 6, 16, 12);
          p.line(x, y - 6, x, y + 6); // Window mullion
        }
        break;

      case 'section':
        // Cross-section view
        // Main structure
        p.rect(-size / 2, -size / 2, size, size);

        // Section cut indication
        p.strokeWeight(3);
        p.line(-size / 2, 0, size / 2, 0);

        // Material indication (hatching)
        p.strokeWeight(1);
        for (let y = -size / 2; y < 0; y += 4) {
          p.line(-size / 2, y, size / 2, y + 2);
        }

        // Structural elements
        if (detailLevel > 0.4) {
          p.strokeWeight(2);
          for (let i = 0; i < 3; i++) {
            const x = p.map(i, 0, 2, -size / 3, size / 3);
            p.line(x, -size / 2, x, size / 2);
          }
        }
        break;
    }
  };

  const drawHexagon = (x: number, y: number, radius: number) => {
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * p.TWO_PI;
      p.vertex(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    }
    p.endShape(p.CLOSE);
  };

  const drawFrameworkTexture = (data: any, alpha: number) => {
    p.stroke(20, 20, 25, alpha * 0.4);
    p.strokeWeight(0.5);

    switch (data.textureType) {
      case 'crosshatch':
        for (let x = -data.size / 2; x < data.size / 2; x += 8) {
          p.line(x, -data.size / 2, x, data.size / 2);
        }
        for (let y = -data.size / 2; y < data.size / 2; y += 8) {
          p.line(-data.size / 2, y, data.size / 2, y);
        }
        break;
      case 'parallel':
        for (let i = -data.size; i < data.size; i += 6) {
          p.line(i, -data.size / 2, i + data.size / 2, data.size / 2);
        }
        break;
      case 'radial':
        for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 16) {
          p.line(
            0,
            0,
            (data.size / 2) * Math.cos(angle),
            (data.size / 2) * Math.sin(angle),
          );
        }
        break;
    }
  };

  const drawTextLines = (scene: Scene) => {
    const baseY = p.height * 0.12;
    const lineHeight = 35;

    // Calculate which characters to show based on typewriter progress
    let charactersShown = 0;
    if (scene.isExiting) {
      // When exiting, show characters from total down to typewriter progress
      charactersShown = scene.typewriterProgress;
    } else {
      // When entering, show characters up to typewriter progress
      charactersShown = scene.typewriterProgress;
    }

    let currentCharIndex = 0;

    scene.textLines.forEach((line, lineIndex) => {
      const y = baseY + lineIndex * lineHeight;

      // Calculate how many characters of this line to show
      const lineStartIndex = currentCharIndex;
      const lineEndIndex = currentCharIndex + line.length;

      let visibleText = '';
      if (charactersShown > lineStartIndex) {
        const endChar = Math.min(charactersShown - lineStartIndex, line.length);
        visibleText = line.substring(0, endChar);
      }

      // Draw the visible portion of text
      if (visibleText.length > 0) {
        p.push();
        p.fill(20, 20, 25, 255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(24);
        p.textFont('Georgia, serif');
        p.text(visibleText, p.width * 0.1, y);

        // Add blinking cursor effect at the end of currently typing line
        if (
          !scene.isExiting &&
          visibleText.length < line.length &&
          charactersShown <= lineEndIndex
        ) {
          const cursorX = p.width * 0.1 + p.textWidth(visibleText);
          // Blink cursor every 30 frames
          if (Math.floor(scene.age / 15) % 2 === 0) {
            p.stroke(20, 20, 25, 255);
            p.strokeWeight(2);
            p.line(cursorX, y, cursorX, y + 24);
          }
        }

        p.pop();
      }

      currentCharIndex += line.length;
    });
  };

  const updateScene = () => {
    if (!currentScene) {
      currentScene = createNewScene();
      return;
    }

    currentScene.age++;

    // Update typewriter effect
    if (!currentScene.isExiting) {
      // Typing in - add characters gradually (about 3 characters per frame for faster typing)
      const typingSpeed = 0.5;
      if (currentScene.typewriterProgress < currentScene.totalCharacters) {
        currentScene.typewriterProgress = Math.min(
          currentScene.typewriterProgress + typingSpeed,
          currentScene.totalCharacters,
        );
      }
    } else {
      // Typing out - remove characters gradually (faster exit)
      const typingSpeed = 1;
      if (currentScene.typewriterProgress > 0) {
        currentScene.typewriterProgress = Math.max(
          currentScene.typewriterProgress - typingSpeed,
          0,
        );
      }
    }

    // Only decrease delay counter after text is fully typed
    if (
      currentScene.typewriterProgress >= currentScene.totalCharacters &&
      currentScene.delayBeforeElements > 0
    ) {
      currentScene.delayBeforeElements--;
    }

    // Update existing elements
    currentScene.elements.forEach((element) => {
      element.age++;
      element.opacity = p.lerp(element.opacity, element.targetOpacity, 0.03);
    });

    // Only start adding elements after the delay has passed AND text is fully typed
    if (
      currentScene.delayBeforeElements <= 0 &&
      currentScene.typewriterProgress >= currentScene.totalCharacters
    ) {
      // Create photo element if we haven't already and it's time
      if (!currentScene.photoElement && loadedPhotos.length > 0) {
        currentScene.photoElement = createPhotoElement();
        if (currentScene.photoElement) {
          currentScene.elements.push(currentScene.photoElement);
        }
      }

      // Add new elements gradually based on sparsity
      const maxElements = 30; // Fixed at 30 elements per scene
      const buildInterval = Math.floor(30 / (state.buildSpeed || 0.5)); // Faster building

      if (frameCounter > nextElementTime && !currentScene.complete) {
        if (currentScene.elements.length < maxElements) {
          // Decide what type of element to add - heavily favor lines and planes
          const rand = Math.random();
          let newElements: SceneElement[] = [];

          // Define text-safe area (avoid top 20% where text is)
          const textHeight = p.height * 0.2;
          const safeMinY = textHeight + 30;
          const safeMaxY = p.height * 0.9;

          if (rand < 0.1) {
            // Add thick ring (reduced frequency from 0.25 to 0.1)
            newElements = [
              createThickRing(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7),
              ),
            ];
          } else if (rand < 0.2) {
            // Add geometric framework
            newElements = [
              createGeometricFramework(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7), // Avoid text area
              ),
            ];
          } else if (rand < 0.25) {
            // Add complex constellation
            newElements = [
              createComplexConstellation(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7),
              ),
            ];
          } else if (rand < 0.29) {
            // Add modular grid
            newElements = [
              createModularGrid(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7),
              ),
            ];
          } else if (rand < 0.33) {
            // Add organic mechanism
            newElements = [
              createOrganicMechanism(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7),
              ),
            ];
          } else if (rand < 0.37) {
            // Add architectural schematic
            newElements = [
              createArchitecturalSchematic(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7),
              ),
            ];
          } else if (rand < 0.67) {
            // Add lines (increased frequency from 0.67-0.52=0.15 to 0.67-0.37=0.30)
            const lineCount = Math.floor(p.random(2, 5));
            for (let i = 0; i < lineCount; i++) {
              // Create dramatically varied line weights - from hairline to very bold
              let weight;
              const weightRand = Math.random();
              if (weightRand < 0.25) {
                weight = p.random(0.2, 0.8); // Very thin lines
              } else if (weightRand < 0.45) {
                weight = p.random(0.8, 2.5); // Thin to medium lines
              } else if (weightRand < 0.65) {
                weight = p.random(2.5, 6); // Medium to thick lines
              } else if (weightRand < 0.8) {
                weight = p.random(6, 12); // Thick lines
              } else if (weightRand < 0.92) {
                weight = p.random(12, 20); // Very thick lines
              } else {
                weight = p.random(20, 35); // Extremely thick lines
              }

              // Make some lines much longer
              let length;
              const lengthRand = Math.random();
              if (lengthRand < 0.3) {
                length = p.random(40, 120); // Short lines
              } else if (lengthRand < 0.6) {
                length = p.random(120, 250); // Medium lines
              } else if (lengthRand < 0.85) {
                length = p.random(250, 400); // Long lines
              } else {
                length = p.random(400, 600); // Very long lines
              }

              newElements.push({
                type: 'line',
                x: p.random(p.width * 0.1, p.width * 0.9),
                y: p.random(safeMinY, safeMaxY), // Avoid text area
                opacity: 0,
                targetOpacity: 1.0, // Full opacity for hard intersections
                rotation: p.random(-p.PI, p.PI),
                scale: 1,
                data: {
                  length: length,
                  weight: weight,
                  color: getRandomColor(),
                },
                age: 0,
                zIndex: 1,
              });
            }
          } else if (rand < 0.55) {
            // Add single intersecting plane (reduced frequency)
            newElements.push(
              createIntersectingPlanes(
                p.random(p.width * 0.1, p.width * 0.9),
                p.random(safeMinY, safeMaxY),
              ),
            );
          } else if (rand < 0.6) {
            // Add massive color plane (much reduced frequency)
            newElements = [createMassiveColorPlane()];
          } else if (rand < 0.65) {
            // Add structural line network
            newElements = createStructuralLineNetwork(currentScene);
          } else if (rand < 0.7) {
            // Add structural group
            newElements = createStructuralGroup(
              p.random(p.width * 0.2, p.width * 0.8),
              p.random(safeMinY, p.height * 0.7), // Avoid text area
            );
          } else if (rand < 0.9) {
            // Add math element (increased frequency, multiple allowed per scene)
            if (Math.random() > 0.3) {
              // 70% chance to add mathematical notation
              newElements.push(
                createMathNotation(
                  p.random(p.width * 0.2, p.width * 0.8),
                  p.random(safeMinY, p.height * 0.7), // Avoid text area
                ),
              );
            }
            if (Math.random() > 0.6) {
              // 40% chance to add blackboard
              newElements.push(
                createBlackboard(
                  p.random(p.width * 0.2, p.width * 0.8),
                  p.random(safeMinY, p.height * 0.7), // Avoid text area
                ),
              );
            }
            // If no math elements were added, add at least one
            if (newElements.length === 0) {
              newElements = [
                createMathNotation(
                  p.random(p.width * 0.2, p.width * 0.8),
                  p.random(safeMinY, p.height * 0.7), // Avoid text area
                ),
              ];
            }
          } else if (rand < 0.95) {
            // Add 3D form
            newElements = [
              create3DFrame(
                p.random(p.width * 0.2, p.width * 0.8),
                p.random(safeMinY, p.height * 0.7), // Avoid text area
              ),
            ];
          } else {
            // Add textured shape - only angular shapes, no circles
            const shapes = ['rectangle', 'triangle'];
            newElements = [
              createTexturedShape(
                p.random(p.width * 0.1, p.width * 0.9),
                p.random(safeMinY, safeMaxY), // Avoid text area
                shapes[Math.floor(Math.random() * shapes.length)],
              ),
            ];
          }

          // Add new elements to scene
          newElements.forEach((element) => {
            if (currentScene!.elements.length < maxElements) {
              currentScene!.elements.push(element);
            }
          });

          nextElementTime = frameCounter + buildInterval;
        } else {
          currentScene.complete = true;
        }
      }
    }

    // Scene transitions
    if (currentScene.complete && currentScene.age > 400) {
      // Start exit animation
      if (!currentScene.isExiting) {
        currentScene.isExiting = true;
        // Reset typewriter progress to start erasing from full text
        currentScene.typewriterProgress = currentScene.totalCharacters;
      }

      // Fade out elements while text is being erased
      currentScene.elements.forEach((element) => {
        element.targetOpacity = 0;
      });

      // Create new scene when text is fully erased and elements are faded
      if (
        currentScene.typewriterProgress <= 0 &&
        currentScene.elements.every((el) => el.opacity < 0.1)
      ) {
        scenes.push(currentScene);
        currentScene = createNewScene();
      }
    }
  };

  p.preload = () => {
    // Load photo assets
    photoPaths.forEach((path) => {
      try {
        const img = p.loadImage(path);
        loadedPhotos.push(img);
      } catch (e) {
        console.log(`Could not load ${path}`);
      }
    });
  };

  p.setup = () => {
    const [canvasWidth, canvasHeight] = getCanvasSize(p);
    p.createCanvas(canvasWidth, canvasHeight);
    improveTextRendering(p);

    // Start with first scene
    currentScene = createNewScene();
  };

  p.updateWithProps = (props: SketchProps) => {
    Object.keys(props).forEach((key) => {
      const propKey = key as keyof SketchProps;
      if (props[propKey] !== undefined) {
        state[propKey] = props[propKey];
      }
    });
  };

  p.draw = () => {
    // Clean paper-like background
    p.background(palette.background());

    // Add subtle paper texture
    for (let i = 0; i < 50; i++) {
      p.stroke(240, 235, 225, 30);
      p.point(p.random(p.width), p.random(p.height));
    }

    if (currentScene) {
      // Sort elements by z-index for proper layering
      const sortedElements = [...currentScene.elements].sort(
        (a, b) => a.zIndex - b.zIndex,
      );

      // Draw all elements in the scene with cutting effects
      sortedElements.forEach((element, index) => {
        p.push();
        p.translate(element.x, element.y);
        p.rotate(element.rotation);
        p.scale(element.scale);

        // Check for intersections with other elements for cutting effects
        const otherElements = currentScene!.elements.filter(
          (el, i) =>
            i !== index &&
            el.opacity > 0.5 &&
            Math.sqrt((el.x - element.x) ** 2 + (el.y - element.y) ** 2) < 150,
        );

        switch (element.type) {
          case 'photo':
            p.pop();
            drawPhotoElement(element);
            break;
          case 'thick-ring':
            p.pop();
            drawThickRing(element);
            break;
          case 'geometric-framework':
            p.pop();
            drawGeometricFramework(element);
            break;
          case 'textured-shape':
            if (element.data.shapeType === 'intersecting-plane') {
              drawIntersectingPlane(
                element.data,
                element.opacity * 255,
                element,
                currentScene!,
              );
            } else {
              drawTexturedShape(element);
            }

            // Add cutting effects for nearby elements
            if (otherElements.length > 0) {
              otherElements.forEach((otherEl) => {
                const dx = otherEl.x - element.x;
                const dy = otherEl.y - element.y;
                // Draw cutting line
                p.noFill();
                p.stroke(245, 240, 230, 255); // Background color to create "cut"
                p.strokeWeight(4);
                p.line(dx / 3, dy / 3, (dx * 2) / 3, (dy * 2) / 3);
              });
            }
            p.pop();
            break;
          case 'math-notation':
            drawMathNotation(element);
            p.pop();
            break;
          case 'line':
            p.pop();
            drawLine(element);
            break;
          default:
            p.pop();
            break;
        }
      });

      // Draw text lines
      drawTextLines(currentScene);

      // Update scene
      updateScene();
    }

    frameCounter++;
  };

  p.mousePressed = () => {
    // Force next element
    if (currentScene && !currentScene.complete) {
      nextElementTime = frameCounter - 1;
    }
  };

  p.keyPressed = () => {
    if (p.key === ' ') {
      // Skip to next scene
      if (currentScene) {
        currentScene.complete = true;
        currentScene.age = 400;
      }
    } else if (p.key === 'r' || p.key === 'R') {
      // Reset
      currentScene = createNewScene();
      scenes = [];
      currentLineIndex = 0;
      frameCounter = 0;
    }
  };

  p.windowResized = () => {
    const [canvasWidth, canvasHeight] = getCanvasSize(p);
    p.resizeCanvas(canvasWidth, canvasHeight);
  };

  const drawIntersectingPlane = (
    data: any,
    alpha: number,
    element: SceneElement,
    scene: Scene,
  ) => {
    // Find other planes in the scene to create cutting effects
    const otherPlanes = scene.elements.filter(
      (el) =>
        el.type === 'textured-shape' &&
        (el.data.shapeType === 'intersecting-plane' ||
          el.data.shapeType === 'massive-plane') &&
        el !== element &&
        el.opacity > 0.5,
    );

    p.fill(p.red(data.color), p.green(data.color), p.blue(data.color), 255);
    p.stroke(20, 20, 25, 200);
    p.strokeWeight(1);
    p.strokeCap(p.SQUARE); // Sharp edges for planes too

    // Draw the main plane shape based on type
    p.beginShape();
    switch (data.planeType) {
      case 'vertical':
        p.vertex(-data.width / 3, -data.height / 2);
        p.vertex(data.width / 3, -data.height / 2);
        p.vertex(data.width / 3, data.height / 2);
        p.vertex(-data.width / 3, data.height / 2);
        break;
      case 'horizontal':
        p.vertex(-data.width / 2, -data.height / 3);
        p.vertex(data.width / 2, -data.height / 3);
        p.vertex(data.width / 2, data.height / 3);
        p.vertex(-data.width / 2, data.height / 3);
        break;
      case 'diagonal':
        p.vertex(-data.width / 2, -data.height / 3);
        p.vertex(data.width / 2, -data.height / 2);
        p.vertex(data.width / 3, data.height / 2);
        p.vertex(-data.width / 3, data.height / 3);
        break;
    }
    p.endShape(p.CLOSE);

    // Add cutting lines where planes intersect
    if (otherPlanes.length > 0) {
      otherPlanes.forEach((otherPlane) => {
        const dx = otherPlane.x - element.x;
        const dy = otherPlane.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          // Only create cuts for nearby planes
          // Draw cutting line with sharp caps
          p.stroke(
            p.red(data.color) * 0.3,
            p.green(data.color) * 0.3,
            p.blue(data.color) * 0.3,
            255,
          );
          p.strokeWeight(3);
          p.strokeCap(p.SQUARE);
          p.line(
            -data.width / 2 + dx / 4,
            -data.height / 2 + dy / 4,
            data.width / 2 + dx / 4,
            data.height / 2 + dy / 4,
          );

          // Create gap/cut effect with sharp caps
          p.noFill();
          p.stroke(245, 240, 230, 255); // Background color to create "cut"
          p.strokeWeight(6);
          p.strokeCap(p.SQUARE);
          p.line(
            -data.width / 3 + dx / 3,
            -data.height / 3 + dy / 3,
            data.width / 3 + dx / 3,
            data.height / 3 + dy / 3,
          );
        }
      });
    }
  };
};

const MoonCanvas = () => {
  return (
    <div className="flex flex-col">
      <div className="bg-white rounded-lg overflow-hidden">
        <ReactP5Wrapper sketch={sketch} />
      </div>
    </div>
  );
};

export default MoonCanvas;
