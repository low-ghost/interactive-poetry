import ControlPanel from '@components/ControlPanel';
import ResetButton from '@components/ResetButton';
import SliderControl from '@components/SliderControl';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { ControlItem } from '@type/controls';
import { getCanvasSize, improveTextRendering } from '@utils/canvas';
import p5 from 'p5';
import { useState } from 'react';
import { POEM_LINES } from './poem';

type SceneElement = {
  type:
    | 'photo'
    | 'blackboard'
    | 'textured-shape'
    | 'math-notation'
    | 'line'
    | 'circle';
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  rotation: number;
  scale: number;
  data?: any;
  age: number;
};

type Scene = {
  elements: SceneElement[];
  textLines: string[];
  photoElement: SceneElement | null;
  startLineIndex: number;
  complete: boolean;
  age: number;
};

type SketchProps = {
  buildSpeed: number | null;
  mathematicalDensity: number | null;
  textureIntensity: number | null;
  colorAccents: number | null;
  compositionSparsity: number | null;
};

export const sketch = (p: P5CanvasInstance<SketchProps>) => {
  let currentScene: Scene | null = null;
  let scenes: Scene[] = [];
  let currentLineIndex = 0;
  let frameCounter = 0;
  let nextElementTime = 0;

  // Store loaded images
  let photoPaths = [
    'images/moon/young-monk-small.avif',
    'images/moon/homebody-edit.avif',
    'images/moon/42704081100_76443f493c_o.avif',
    'images/moon/14556223424_21da102b8f_b.avif',
  ];
  let loadedPhotos: p5.Image[] = [];

  const state: SketchProps = {
    buildSpeed: 0.5,
    mathematicalDensity: 0.7,
    textureIntensity: 0.8,
    colorAccents: 0.3,
    compositionSparsity: 0.8,
  };

  // Muted Russian Futurist palette
  const palette = {
    background: () => p.color(245, 240, 230),
    black: () => p.color(20, 20, 25),
    chalk: () => p.color(250, 250, 245),
    red: () => p.color(180, 30, 40),
    yellow: () => p.color(220, 200, 120),
    gray: (value: number) => p.color(value, value, value + 5),
    beige: () => p.color(210, 195, 175),
    darkGray: () => p.color(60, 60, 65),
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
      targetOpacity: 0.9,
      rotation: p.random(-p.PI / 12, p.PI / 12),
      scale: p.random(0.8, 1.2),
      data: {
        shapeType: type,
        width: p.random(60, 150),
        height: p.random(80, 180),
        texture: Math.random() > 0.5 ? 'crosshatch' : 'dots',
        color:
          Math.random() > state.colorAccents!
            ? palette.gray(p.random(140, 200))
            : Math.random() > 0.5
            ? palette.red()
            : palette.yellow(),
      },
      age: 0,
    };
  };

  const createBlackboard = (x: number, y: number): SceneElement => {
    return {
      type: 'blackboard',
      x,
      y,
      opacity: 0,
      targetOpacity: 0.85,
      rotation: p.random(-p.PI / 20, p.PI / 20),
      scale: 1,
      data: {
        width: p.random(180, 280),
        height: p.random(150, 220),
        notations: Array.from(
          { length: Math.floor(p.random(2, 4)) },
          () => mathNotations[Math.floor(Math.random() * mathNotations.length)],
        ),
      },
      age: 0,
    };
  };

  const createPhotoElement = (): SceneElement | null => {
    if (loadedPhotos.length === 0) return null;

    const photo = loadedPhotos[Math.floor(Math.random() * loadedPhotos.length)];
    const scale = p.random(0.2, 0.4);

    // Position photo thoughtfully in the composition
    const positions = [
      { x: p.width * 0.25, y: p.height * 0.6 }, // Lower left
      { x: p.width * 0.75, y: p.height * 0.3 }, // Upper right
      { x: p.width * 0.5, y: p.height * 0.5 }, // Center
      { x: p.width * 0.3, y: p.height * 0.35 }, // Upper left
    ];
    const pos = positions[Math.floor(Math.random() * positions.length)];

    return {
      type: 'photo',
      x: pos.x,
      y: pos.y,
      opacity: 0,
      targetOpacity: 0.95,
      rotation: p.random(-p.PI / 16, p.PI / 16),
      scale,
      data: {
        image: photo,
        width: photo.width * scale,
        height: photo.height * scale,
        hasFrame: Math.random() > 0.5,
        frameColor: Math.random() > 0.7 ? palette.red() : palette.black(),
      },
      age: 0,
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

    // Create photo element first (only one per scene)
    const photoElement = createPhotoElement();

    return {
      elements: photoElement ? [photoElement] : [],
      textLines,
      photoElement,
      startLineIndex: currentLineIndex - textLines.length,
      complete: false,
      age: 0,
    };
  };

  const drawTexturedShape = (element: SceneElement) => {
    const data = element.data;
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    p.scale(element.scale);

    const alpha = element.opacity * 255;

    // Draw base shape
    p.fill(
      p.red(data.color),
      p.green(data.color),
      p.blue(data.color),
      alpha * 0.6,
    );
    p.stroke(20, 20, 25, alpha);
    p.strokeWeight(1);

    switch (data.shapeType) {
      case 'rectangle':
        p.rect(-data.width / 2, -data.height / 2, data.width, data.height);
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
      case 'circle':
        p.ellipse(0, 0, data.width, data.height);
        break;
    }

    // Add texture
    if (data.texture === 'crosshatch') {
      p.stroke(20, 20, 25, alpha * 0.3);
      for (let i = -data.width / 2; i < data.width / 2; i += 8) {
        p.line(i, -data.height / 2, i + data.height / 3, data.height / 2);
      }
    } else if (data.texture === 'dots') {
      p.noStroke();
      p.fill(20, 20, 25, alpha * 0.2);
      for (let x = -data.width / 2; x < data.width / 2; x += 12) {
        for (let y = -data.height / 2; y < data.height / 2; y += 12) {
          p.circle(x, y, 3);
        }
      }
    }

    p.pop();
  };

  const drawBlackboard = (element: SceneElement) => {
    const data = element.data;
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);

    const alpha = element.opacity * 255;

    // Draw blackboard
    p.fill(40, 40, 45, alpha);
    p.stroke(20, 20, 25, alpha);
    p.strokeWeight(2);
    p.rect(-data.width / 2, -data.height / 2, data.width, data.height);

    // Draw mathematical notations
    p.fill(250, 250, 245, alpha * 0.9);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);

    data.notations.forEach((notation: string, i: number) => {
      const x = -data.width / 2 + 20 + ((i % 2) * data.width) / 2;
      const y = -data.height / 2 + 30 + Math.floor(i / 2) * 60;
      p.text(notation, x, y);

      // Add some geometric drawings
      if (Math.random() > 0.5) {
        p.stroke(250, 250, 245, alpha * 0.7);
        p.strokeWeight(1);
        p.noFill();
        if (Math.random() > 0.5) {
          p.circle(x + 40, y + 25, 30);
          p.line(x + 40, y + 25, x + 70, y + 25);
        } else {
          p.line(x, y + 40, x + 60, y + 20);
          p.line(x + 60, y + 20, x + 80, y + 50);
        }
      }
    });

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

    // Draw frame if needed
    if (element.data.hasFrame) {
      p.fill(element.data.frameColor);
      p.noStroke();
      const padding = 10;
      p.rect(
        -width / 2 - padding,
        -height / 2 - padding,
        width + padding * 2,
        height + padding * 2,
      );
    }

    // Draw image
    p.tint(255, element.opacity * 255);
    p.imageMode(p.CENTER);
    p.image(img, 0, 0, width, height);

    p.pop();
  };

  const drawMathNotation = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);
    p.scale(element.scale);

    const alpha = element.opacity * 255;

    if (element.data.style === 'handwritten') {
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
    p.text(element.data.text, 0, 0);

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

    p.pop();
  };

  const drawLine = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);
    p.rotate(element.rotation);

    const alpha = element.opacity * 255;
    p.stroke(20, 20, 25, alpha);
    p.strokeWeight(element.data.weight || 2);
    p.line(-element.data.length / 2, 0, element.data.length / 2, 0);

    p.pop();
  };

  const drawCircle = (element: SceneElement) => {
    p.push();
    p.translate(element.x, element.y);

    const alpha = element.opacity * 255;

    if (element.data.filled) {
      p.fill(element.data.color);
      p.noStroke();
    } else {
      p.noFill();
      p.stroke(20, 20, 25, alpha);
      p.strokeWeight(2);
    }

    p.circle(0, 0, element.data.radius * 2);

    p.pop();
  };

  const drawTextLines = (scene: Scene) => {
    const baseY = p.height * 0.12;
    const lineHeight = 35;

    scene.textLines.forEach((line, index) => {
      const opacity = Math.min(scene.age * 3, 255);

      p.push();
      p.fill(20, 20, 25, opacity);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(24);
      p.textFont('Georgia, serif');
      p.text(line, p.width * 0.1, baseY + index * lineHeight);
      p.pop();
    });
  };

  const updateScene = () => {
    if (!currentScene) {
      currentScene = createNewScene();
      return;
    }

    currentScene.age++;

    // Update existing elements
    currentScene.elements.forEach((element) => {
      element.age++;
      element.opacity = p.lerp(element.opacity, element.targetOpacity, 0.03);
    });

    // Add new elements gradually based on sparsity
    const sparsity = state.compositionSparsity || 0.8;
    const maxElements = Math.floor(4 + (1 - sparsity) * 6); // Fewer elements for sparse compositions
    const buildInterval = Math.floor(90 / (state.buildSpeed || 0.5));

    if (frameCounter > nextElementTime && !currentScene.complete) {
      if (currentScene.elements.length < maxElements) {
        // Decide what type of element to add
        const rand = Math.random();
        let newElement: SceneElement | null = null;

        if (rand < 0.3 && (state.mathematicalDensity || 0.7) > 0.5) {
          // Add blackboard
          newElement = createBlackboard(
            p.random(p.width * 0.2, p.width * 0.8),
            p.random(p.height * 0.3, p.height * 0.7),
          );
        } else if (rand < 0.6) {
          // Add textured shape
          const shapes = ['rectangle', 'triangle', 'circle'];
          newElement = createTexturedShape(
            p.random(p.width * 0.1, p.width * 0.9),
            p.random(p.height * 0.2, p.height * 0.8),
            shapes[Math.floor(Math.random() * shapes.length)],
          );
        } else if (rand < 0.8) {
          // Add mathematical notation
          newElement = createMathNotation(
            p.random(p.width * 0.15, p.width * 0.85),
            p.random(p.height * 0.25, p.height * 0.75),
          );
        } else if (rand < 0.9) {
          // Add line
          newElement = {
            type: 'line',
            x: p.random(p.width * 0.2, p.width * 0.8),
            y: p.random(p.height * 0.3, p.height * 0.7),
            opacity: 0,
            targetOpacity: 0.7,
            rotation: p.random(-p.PI / 3, p.PI / 3),
            scale: 1,
            data: {
              length: p.random(50, 150),
              weight: p.random(1, 3),
            },
            age: 0,
          };
        } else {
          // Add circle
          newElement = {
            type: 'circle',
            x: p.random(p.width * 0.2, p.width * 0.8),
            y: p.random(p.height * 0.3, p.height * 0.7),
            opacity: 0,
            targetOpacity: 0.8,
            rotation: 0,
            scale: 1,
            data: {
              radius: p.random(20, 60),
              filled: Math.random() > 0.7,
              color: Math.random() > 0.5 ? palette.red() : palette.black(),
            },
            age: 0,
          };
        }

        if (newElement) {
          currentScene.elements.push(newElement);
        }
        nextElementTime = frameCounter + buildInterval;
      } else {
        currentScene.complete = true;
      }
    }

    // Scene transitions
    if (currentScene.complete && currentScene.age > 400) {
      // Fade out current scene
      currentScene.elements.forEach((element) => {
        element.targetOpacity = 0;
      });

      // Create new scene when old one is faded
      if (currentScene.elements.every((el) => el.opacity < 0.1)) {
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
      // Draw all elements in the scene
      currentScene.elements.forEach((element) => {
        switch (element.type) {
          case 'photo':
            drawPhotoElement(element);
            break;
          case 'blackboard':
            drawBlackboard(element);
            break;
          case 'textured-shape':
            drawTexturedShape(element);
            break;
          case 'math-notation':
            drawMathNotation(element);
            break;
          case 'line':
            drawLine(element);
            break;
          case 'circle':
            drawCircle(element);
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
};

const MoonCanvas = () => {
  const [buildSpeed, setBuildSpeed] = useState<number | null>(0.5);
  const [mathematicalDensity, setMathematicalDensity] = useState<number | null>(
    0.7,
  );
  const [textureIntensity, setTextureIntensity] = useState<number | null>(0.8);
  const [colorAccents, setColorAccents] = useState<number | null>(0.3);
  const [compositionSparsity, setCompositionSparsity] = useState<number | null>(
    0.8,
  );

  const handleReset = () => {
    setBuildSpeed(0.5);
    setMathematicalDensity(0.7);
    setTextureIntensity(0.8);
    setColorAccents(0.3);
    setCompositionSparsity(0.8);
  };

  const controlItems: ControlItem[] = [
    {
      id: 'buildSpeed',
      label: 'Build Speed',
      description: 'Controls how quickly elements appear in each scene.',
      control: (
        <>
          <SliderControl
            value={buildSpeed}
            onChange={setBuildSpeed}
            min={0.1}
            max={2.0}
            step={0.1}
          />
          <ResetButton onClick={() => setBuildSpeed(0.5)} />
        </>
      ),
    },
    {
      id: 'mathematicalDensity',
      label: 'Mathematical Density',
      description:
        'Controls the frequency of mathematical notations and blackboards.',
      control: (
        <>
          <SliderControl
            value={mathematicalDensity}
            onChange={setMathematicalDensity}
            min={0.0}
            max={1.0}
            step={0.1}
          />
          <ResetButton onClick={() => setMathematicalDensity(0.7)} />
        </>
      ),
    },
    {
      id: 'textureIntensity',
      label: 'Texture Intensity',
      description: 'Controls how much texture is applied to geometric shapes.',
      control: (
        <>
          <SliderControl
            value={textureIntensity}
            onChange={setTextureIntensity}
            min={0.0}
            max={1.0}
            step={0.1}
          />
          <ResetButton onClick={() => setTextureIntensity(0.8)} />
        </>
      ),
    },
    {
      id: 'colorAccents',
      label: 'Color Accents',
      description:
        'Controls the frequency of red and yellow accent colors versus grays.',
      control: (
        <>
          <SliderControl
            value={colorAccents}
            onChange={setColorAccents}
            min={0.0}
            max={1.0}
            step={0.1}
          />
          <ResetButton onClick={() => setColorAccents(0.3)} />
        </>
      ),
    },
    {
      id: 'compositionSparsity',
      label: 'Composition Sparsity',
      description: 'Controls how sparse or dense the composition is.',
      control: (
        <>
          <SliderControl
            value={compositionSparsity}
            onChange={setCompositionSparsity}
            min={0.0}
            max={1.0}
            step={0.1}
          />
          <ResetButton onClick={() => setCompositionSparsity(0.8)} />
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="mb-4 w-full">
        <ControlPanel controls={controlItems} onReset={handleReset} />
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        <ReactP5Wrapper
          sketch={sketch}
          buildSpeed={buildSpeed}
          mathematicalDensity={mathematicalDensity}
          textureIntensity={textureIntensity}
          colorAccents={colorAccents}
          compositionSparsity={compositionSparsity}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <p>
          Click to add next element • Press SPACE to skip to next scene • Press
          R to reset
        </p>
      </div>
    </div>
  );
};

export default MoonCanvas;
