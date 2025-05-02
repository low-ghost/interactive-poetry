import ControlPanel from '@components/ControlPanel';
import ResetButton from '@components/ResetButton';
import SliderControl from '@components/SliderControl';
import TextAreaControl from '@components/TextAreaControl';
import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { ControlItem } from '@type/controls';
import { getCanvasSize, improveTextRendering } from '@utils/canvas';
import { createRandomColor } from '@utils/color';
import { Color } from 'p5';
import { useState } from 'react';

type Ripple = {
  x: number;
  y: number;
  radius: number;
  strength: number;
  growthRate: number;
  decayRate: number;
  amplitude: number;
  color: Color;
};

const CELL_SIZE = 20;
const DEFAULT_SONNET = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate.
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date.
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimmed;
And every fair from fair sometime declines,
By chance or nature's changing course untrimmed.
But thy eternal summer shall not fade
Nor lose possession of that fair thou ow'st,
Nor shall Death brag thou wand'rest in his shade,
When in eternal lines to time thou grow'st.
So long as men can breathe or eyes can see,
So long lives this, and this gives life to thee.`;

type SketchProps = {
  background: boolean;
  strength: number | null;
  growthRate: number | null;
  decayRate: number | null;
  amplitude: number | null;
  text: string | null;
};

const sketch = (p: P5CanvasInstance<SketchProps>) => {
  let cols: number;
  let rows: number;
  let chars: string[][];
  let ripples: Ripple[] = [];

  const state: SketchProps = {
    background: true,
    strength: null,
    growthRate: null,
    decayRate: null,
    amplitude: null,
    text: DEFAULT_SONNET,
  };

  const createRipple = (
    x: number,
    y: number,
    isMousePress = false,
  ): Ripple => ({
    x,
    y,
    radius: 5,
    strength:
      state.strength !== null
        ? state.strength * (isMousePress ? 2 : 1) // Apply multiplier for mouse press
        : isMousePress
        ? p.random(0.8, 2.5)
        : p.random(0, 1.2),
    growthRate:
      state.growthRate !== null
        ? state.growthRate * (isMousePress ? 1.5 : 1)
        : isMousePress
        ? p.random(5, 12)
        : p.random(0, 7),
    decayRate:
      state.decayRate !== null
        ? state.decayRate
        : isMousePress
        ? p.random(0.92, 0.98)
        : p.random(0, 1),
    amplitude:
      state.amplitude !== null
        ? state.amplitude * (isMousePress ? 1.5 : 1)
        : isMousePress
        ? p.random(15, 25)
        : p.random(0, 12),
    color: isMousePress ? createRandomColor(p) : p.color(0),
  });

  const createCharacterGrid = (rows: number, cols: number): string[][] => {
    const text = state.text || DEFAULT_SONNET;
    return Array.from({ length: rows }, (_, y) =>
      Array.from(
        { length: cols },
        (_, x) => text[(y * cols + x) % text.length],
      ),
    );
  };

  const calculateRippleEffect = (
    posX: number,
    posY: number,
    ripples: Ripple[],
  ): { offsetX: number; offsetY: number; totalStrength: number } =>
    ripples.reduce(
      (acc, ripple) => {
        const distance = p.dist(posX, posY, ripple.x, ripple.y);
        const amplitude = ripple.amplitude * ripple.strength;
        const displacement = p.sin(distance * 0.1 - ripple.radius) * amplitude;

        if (distance < ripple.radius + 150 && distance > ripple.radius - 10) {
          const angle = p.atan2(posY - ripple.y, posX - ripple.x);
          return {
            offsetX: acc.offsetX + p.cos(angle) * displacement,
            offsetY: acc.offsetY + p.sin(angle) * displacement,
            totalStrength: acc.totalStrength + ripple.strength,
          };
        }
        return acc;
      },
      { offsetX: 0, offsetY: 0, totalStrength: 0 },
    );

  const findStrongestRipple = (posX: number, posY: number, ripples: Ripple[]) =>
    ripples.reduce(
      (max, ripple) => {
        const distance = p.dist(posX, posY, ripple.x, ripple.y);
        return distance < ripple.radius + 100 &&
          distance > ripple.radius - 10 &&
          ripple.strength > max.strength
          ? ripple
          : max;
      },
      { strength: 0, color: p.color(0) },
    );

  const drawCharacter = (
    char: string,
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
    textColor: Color,
  ) => {
    p.push();
    p.translate(x + offsetX, y + offsetY);
    p.fill(textColor);
    p.text(char, 0, 0);
    p.pop();
  };

  const updateRipples = (ripples: Ripple[]) =>
    ripples
      .map((ripple) => ({
        ...ripple,
        radius: ripple.radius + ripple.growthRate,
        strength: ripple.strength * ripple.decayRate,
      }))
      .filter((ripple) => ripple.strength >= 0.01);

  const generateCharacterGrid = (canvasWidth: number, canvasHeight: number) => {
    cols = p.floor(canvasWidth / CELL_SIZE);
    rows = p.floor(canvasHeight / CELL_SIZE);
    chars = createCharacterGrid(rows, cols);
  };

  p.updateWithProps = (props: SketchProps) => {
    if (
      props.background !== undefined &&
      props.background !== state.background
    ) {
      state.background = props.background;
    }
    if (props.strength !== undefined) {
      state.strength = props.strength;
    }
    if (props.growthRate !== undefined) {
      state.growthRate = props.growthRate;
    }
    if (props.decayRate !== undefined) {
      state.decayRate = props.decayRate;
    }
    if (props.amplitude !== undefined) {
      state.amplitude = props.amplitude;
    }
    if (props.text !== undefined && props.text !== state.text) {
      state.text = props.text;
      // Regenerate character grid when text changes
      const [canvasWidth, canvasHeight] = getCanvasSize(p);
      generateCharacterGrid(canvasWidth, canvasHeight);
    }
  };

  p.setup = () => {
    const [canvasWidth, canvasHeight] = getCanvasSize(p);
    p.createCanvas(canvasWidth, canvasHeight);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    improveTextRendering(p);
    generateCharacterGrid(canvasWidth, canvasHeight);
  };

  p.mousePressed = () => {
    ripples.push(createRipple(p.mouseX, p.mouseY, true));
  };

  p.draw = () => {
    if (state.background) {
      p.background(255);
    }

    const mouseMoved = p.mouseX !== p.pmouseX || p.mouseY !== p.pmouseY;
    if (mouseMoved) {
      ripples = [...ripples, createRipple(p.mouseX, p.mouseY)];
    }

    chars.forEach((row: string[], y: number) => {
      row.forEach((char: string, x: number) => {
        const halfCell = CELL_SIZE / 2;
        const posX = x * CELL_SIZE + halfCell;
        const posY = y * CELL_SIZE + halfCell;

        const { offsetX, offsetY, totalStrength } = calculateRippleEffect(
          posX,
          posY,
          ripples,
        );

        const textColor =
          totalStrength > 0
            ? findStrongestRipple(posX, posY, ripples).color
            : p.color(0);

        drawCharacter(char, posX, posY, offsetX, offsetY, textColor);
      });
    });

    ripples = updateRipples(ripples);
  };

  p.windowResized = () => {
    const [canvasWidth, canvasHeight] = getCanvasSize(p);
    p.resizeCanvas(canvasWidth, canvasHeight);
    generateCharacterGrid(canvasWidth, canvasHeight);
  };
};

/**
 * RippleCanvas is a component that renders a P5.js ripple effect.
 *
 * @returns A P5.js canvas inside a div.
 */
const RippleCanvas = () => {
  const [background, setBackground] = useState(true);
  const [strength, setStrength] = useState<number | null>(null);
  const [growthRate, setGrowthRate] = useState<number | null>(null);
  const [decayRate, setDecayRate] = useState<number | null>(null);
  const [amplitude, setAmplitude] = useState<number | null>(null);
  const [text, setText] = useState<string | null>(null);
  // Handle reset for all controls
  const handleReset = () => {
    setBackground(true);
    setStrength(null);
    setGrowthRate(null);
    setDecayRate(null);
    setAmplitude(null);
    setText(null);
  };

  // Define control items
  const controlItems: ControlItem[] = [
    {
      id: 'background',
      label: 'Background',
      description:
        'Removing the background allows ripples to persist, creating a vibrant tapestry as colors expand and come to rest.',
      control: (
        <button
          onClick={() => setBackground(!background)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {background ? 'Disable' : 'Enable'}
        </button>
      ),
    },
    {
      id: 'strength',
      label: 'Ripple Strength',
      description:
        'Controls how powerfully ripples affect the text. Higher values create more dramatic displacements.',
      control: (
        <>
          <SliderControl
            value={strength}
            onChange={setStrength}
            min={0.1}
            max={3.0}
            step={0.1}
          />
          <ResetButton onClick={() => setStrength(null)} />
        </>
      ),
    },
    {
      id: 'growthRate',
      label: 'Growth Rate',
      description:
        'Controls how quickly ripples expand. Higher values make ripples spread faster across the canvas.',
      control: (
        <>
          <SliderControl
            value={growthRate}
            onChange={setGrowthRate}
            min={0}
            max={15}
            step={0.5}
          />
          <ResetButton onClick={() => setGrowthRate(null)} />
        </>
      ),
    },
    {
      id: 'decayRate',
      label: 'Decay Rate',
      description:
        'Controls how quickly ripples fade. Higher values make ripples last longer before disappearing.',
      control: (
        <>
          <SliderControl
            value={decayRate}
            onChange={setDecayRate}
            min={0.8}
            max={0.99}
            step={0.01}
          />
          <ResetButton onClick={() => setDecayRate(null)} />
        </>
      ),
    },
    {
      id: 'amplitude',
      label: 'Amplitude',
      description:
        'Controls the height of the ripple waves. Higher values create more dramatic text displacement.',
      control: (
        <>
          <SliderControl
            value={amplitude}
            onChange={setAmplitude}
            min={0}
            max={30}
            step={1}
          />
          <ResetButton onClick={() => setAmplitude(null)} />
        </>
      ),
    },
    {
      id: 'text',
      label: 'Display Text',
      description:
        'The text displayed on the canvas. You can use the default sonnet or enter your own poetry or prose.',
      control: (
        <TextAreaControl
          value={text}
          onChange={setText}
          defaultValue={DEFAULT_SONNET}
        />
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
          background={background}
          strength={strength}
          growthRate={growthRate}
          decayRate={decayRate}
          amplitude={amplitude}
          text={text}
        />
      </div>
    </div>
  );
};

export default RippleCanvas;
