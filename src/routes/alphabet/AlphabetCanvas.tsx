import { P5CanvasInstance, ReactP5Wrapper } from '@p5-wrapper/react';
import { getCanvasSize, improveTextRendering } from '@utils/canvas';
import { POEM_LINES } from './poem';

type SketchProps = {
  buildSpeed: number | null;
};

export const sketch = (p: P5CanvasInstance<SketchProps>) => {
  let frameCounter = 0;
  let currentPoemIndex = 0;
  let transitionProgress = 0;
  let nextChangeTime = 600;
  let lastClickTime = 0;

  let curves: { x: number; y: number }[][] = [];
  let targetCurves: { x: number; y: number }[][] = [];
  let baseCurves: { x: number; y: number }[][] = [];
  let morphProgress = 1.0;
  let blendProgress = 1.0;

  let currentLetters: string[][] = [];
  let nextLetters: string[][] = [];

  let mouseX = 0;
  let mouseY = 0;

  const backgroundColor = [45, 47, 51];
  const textColor = [220, 220, 220];

  p.setup = () => {
    const [width, height] = getCanvasSize(p);
    p.createCanvas(width, height);
    improveTextRendering(p);
    p.textFont('Courier New');

    initCurves();
    updateLetters();
  };

  p.mouseMoved = () => {
    const [width, height] = getCanvasSize(p);
    mouseX = (p.mouseX / width - 0.5) * 2;
    mouseY = (p.mouseY / height - 0.5) * 2;
  };

  p.mousePressed = () => {
    if (frameCounter - lastClickTime > 30) {
      nextChangeTime = frameCounter;
      lastClickTime = frameCounter;
    }
  };

  const initCurves = () => {
    const [width, height] = getCanvasSize(p);
    generateCurves(width, height);
    targetCurves = curves.map((path) => [...path]);
    baseCurves = curves.map((path) => [...path]);
  };

  const generateCurves = (width: number, height: number, dramatic = false) => {
    const centerX = width * 0.5;
    const amp = dramatic ? width * 0.04 : width * 0.025;
    const mouseStr = dramatic ? width * 0.03 : width * 0.015;

    const waves = [
      Math.sin(frameCounter * 0.02) * amp,
      Math.sin(frameCounter * 0.025 + Math.PI / 3) * amp,
      Math.sin(frameCounter * 0.018 + (Math.PI * 2) / 3) * amp,
    ];

    const mouseEffects = [
      mouseX * mouseStr * 0.7,
      mouseX * mouseStr,
      mouseX * mouseStr * 0.8,
    ];
    const vertMouse = mouseY * mouseStr * 0.3;

    const shifts = dramatic
      ? [
          Math.sin(frameCounter * 0.02) * width * 0.15,
          Math.cos(frameCounter * 0.018) * width * 0.12,
          Math.sin(frameCounter * 0.025 + Math.PI) * width * 0.18,
        ]
      : [0, 0, 0];

    const configs = [
      {
        sections: [
          [p.random(-0.15, 0.15), p.random(-0.08, 0.08)],
          [p.random(-0.07, 0.07), p.random(0.1, 0.15)],
          [p.random(0.03, 0.07), p.random(-0.1, -0.15)],
          [p.random(-0.07, 0.07), p.random(-0.08, 0.08)],
          [p.random(-0.07, 0.07), p.random(0.15, 0.2)],
          [p.random(0.03, 0.07), p.random(-0.15, -0.2)],
        ],
        breaks: [
          p.random(0, 0.2),
          p.random(0.2, 0.4),
          p.random(0.6, 0.8),
          p.random(0.6, 0.8),
        ],
      },
      {
        sections: [
          [p.random(-0.1, 0), p.random(-0.06, 0.06)],
          [p.random(0.06, 0.12), p.random(-0.12, -0.18)],
          [p.random(-0.06, 0.06), p.random(0.12, 0.18)],
          [p.random(0.06, 0.12), p.random(-0.09, -0.15)],
          [p.random(-0.03, 0.03), p.random(-0.07, 0.07)],
        ],
        breaks: [
          p.random(0, 0.2),
          p.random(0.2, 0.4),
          p.random(0.6, 0.8),
          p.random(0.6, 0.8),
        ],
      },
      {
        sections: [
          [p.random(0.15, 0.2), p.random(-0.1, -0.15)],
          [p.random(0.05, 0.1), p.random(-0.15, -0.2)],
          [p.random(-0.1, -0.15), p.random(-0.08, -0.12)],
          [p.random(-0.1, -0.15), p.random(0.1, 0.15)],
          [p.random(0.15, 0.2), p.random(0.1, 0.15)],
        ],
        breaks: [
          p.random(0, 0.2),
          p.random(0.2, 0.4),
          p.random(0.6, 0.8),
          p.random(0.8, 1),
        ],
      },
    ];

    curves = configs.map((config, curveIdx) => {
      const path: { x: number; y: number }[] = [];

      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const y = height * (0.05 + t * 0.9);

        let sectionIdx = 0;
        for (let j = 0; j < config.breaks.length; j++) {
          if (t > config.breaks[j]) sectionIdx = j + 1;
        }

        const [start, end] = config.sections[sectionIdx];
        const sectionStart =
          sectionIdx === 0 ? 0 : config.breaks[sectionIdx - 1];
        const sectionEnd = config.breaks[sectionIdx] || 1;
        const localT = (t - sectionStart) / (sectionEnd - sectionStart);
        const smoothT = Math.sin(localT * p.PI * 0.5);

        let x =
          centerX +
          (start + (end - start) * smoothT) * width +
          shifts[curveIdx];

        const waveIntensity = Math.sin(t * Math.PI) * 0.6 + 0.4;
        x += waves[curveIdx] * waveIntensity;

        const mouseIntensity =
          Math.sin(t * Math.PI * (0.8 + curveIdx * 0.2)) * 0.8 + 0.2;
        x += mouseEffects[curveIdx] * mouseIntensity;

        const adjustedY =
          y + vertMouse * Math.sin(t * Math.PI * (1.5 + curveIdx * 0.3)) * 0.5;
        path.push({ x, y: adjustedY });
      }

      return redistributePoints(path, 100);
    });
  };

  const redistributePoints = (
    path: { x: number; y: number }[],
    count: number,
  ) => {
    if (path.length < 2) return path;

    const distances = [0];
    let total = 0;

    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      total += Math.sqrt(dx * dx + dy * dy);
      distances.push(total);
    }

    const newPath: { x: number; y: number }[] = [];
    const segmentLength = total / (count - 1);

    for (let i = 0; i < count; i++) {
      const targetDist = i * segmentLength;
      let segIdx = 0;

      for (let j = 0; j < distances.length - 1; j++) {
        if (targetDist >= distances[j] && targetDist <= distances[j + 1]) {
          segIdx = j;
          break;
        }
      }

      if (segIdx >= path.length - 1) {
        newPath.push(path[path.length - 1]);
      } else {
        const progress =
          (targetDist - distances[segIdx]) /
          (distances[segIdx + 1] - distances[segIdx]);
        const start = path[segIdx];
        const end = path[segIdx + 1];
        newPath.push({
          x: start.x + (end.x - start.x) * progress,
          y: start.y + (end.y - start.y) * progress,
        });
      }
    }

    return newPath;
  };

  const updateLetters = () => {
    const getLineLetters = (idx: number) =>
      (POEM_LINES[idx] || '').replace(/\s+/g, '').split('');

    currentLetters = [
      getLineLetters(currentPoemIndex % POEM_LINES.length),
      getLineLetters((currentPoemIndex + 1) % POEM_LINES.length),
      getLineLetters((currentPoemIndex + 2) % POEM_LINES.length),
    ];

    const nextIdx = (currentPoemIndex + 3) % POEM_LINES.length;
    nextLetters = [
      getLineLetters(nextIdx % POEM_LINES.length),
      getLineLetters((nextIdx + 1) % POEM_LINES.length),
      getLineLetters((nextIdx + 2) % POEM_LINES.length),
    ];
  };

  const updateCycle = () => {
    if (frameCounter >= nextChangeTime) {
      if (transitionProgress === 0) {
        const [width, height] = getCanvasSize(p);
        const current = curves.map((path) => [...path]);
        generateCurves(width, height, true);
        targetCurves = curves.map((path) => [...path]);
        curves = current;
        morphProgress = 0;
      }

      transitionProgress = Math.min(transitionProgress + 0.01, 1.0);
      morphProgress = Math.min(morphProgress + 0.005, 1.0);

      if (transitionProgress >= 1.0) {
        currentPoemIndex = (currentPoemIndex + 3) % POEM_LINES.length;
        transitionProgress = 0;
        morphProgress = 1.0;
        baseCurves = targetCurves.map((path) => [...path]);
        blendProgress = 0;
        nextChangeTime = frameCounter + 600;
        updateLetters();
      }
    }

    if (blendProgress < 1.0) {
      blendProgress = Math.min(blendProgress + 0.02, 1.0);
    }
  };

  const applyWavering = (width: number) => {
    const amp = width * 0.025;
    const waves = [
      Math.sin(frameCounter * 0.02) * amp,
      Math.sin(frameCounter * 0.025 + Math.PI / 3) * amp,
      Math.sin(frameCounter * 0.018 + (Math.PI * 2) / 3) * amp,
    ];

    const mouseStr = width * 0.015;
    const mouseEffects = [
      mouseX * mouseStr * 0.7,
      mouseX * mouseStr,
      mouseX * mouseStr * 0.8,
    ];
    const vertMouse = mouseY * mouseStr * 0.3;

    curves = baseCurves.map((baseline, curveIdx) =>
      baseline.map((point, pointIdx) => {
        const t = pointIdx / (baseline.length - 1);
        const waveIntensity = Math.sin(t * Math.PI) * 0.6 + 0.4;
        const mouseIntensity =
          Math.sin(t * Math.PI * (0.8 + curveIdx * 0.2)) * 0.8 + 0.2;
        const vertEffect =
          vertMouse * Math.sin(t * Math.PI * (1.5 + curveIdx * 0.3)) * 0.5;

        return {
          x:
            point.x +
            waves[curveIdx] * waveIntensity +
            mouseEffects[curveIdx] * mouseIntensity,
          y: point.y + vertEffect,
        };
      }),
    );
  };

  const drawText = () => {
    p.fill(textColor[0], textColor[1], textColor[2], 255);
    p.textSize(18);
    p.textAlign(p.LEFT, p.TOP);

    const getCurrentLine = (idx: number) =>
      POEM_LINES[(currentPoemIndex + idx) % POEM_LINES.length] || '';
    const getNextLine = (idx: number) =>
      POEM_LINES[(currentPoemIndex + 3 + idx) % POEM_LINES.length] || '';

    const getTransition = (current: string, next: string, lineIdx: number) => {
      if (transitionProgress === 0) return current;

      const speed = transitionProgress + lineIdx * 0.1;
      const newChars = Math.floor(speed * next.length);

      if (newChars <= 0) return current;
      if (newChars >= next.length) return next;

      const newPortion = next.substring(0, newChars);
      const maxLen = Math.max(current.length, next.length);
      const oldLen = maxLen - newChars;

      return oldLen <= 0
        ? newPortion
        : newPortion + current.substring(0, oldLen);
    };

    for (let i = 0; i < 3; i++) {
      const line = getTransition(getCurrentLine(i), getNextLine(i), i);
      p.text(line, 20, 20 + i * 20);
    }
  };

  const drawLetters = () => {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.noStroke();

    const offset = (frameCounter * 0.3) % 100;

    curves.forEach((path, curveIdx) => {
      const current = currentLetters[curveIdx] || [];
      const next = nextLetters[curveIdx] || [];
      if (current.length === 0) return;

      for (let i = 0; i < path.length; i += 2) {
        const letterIdx = Math.floor(i / 2);

        let letter;
        if (transitionProgress > 0 && next.length > 0) {
          const speed = transitionProgress + curveIdx * 0.1;
          const newCount = Math.floor(speed * next.length);

          if (newCount > letterIdx) {
            letter = next[letterIdx % next.length];
          } else {
            const shifted = letterIdx - newCount;
            letter =
              shifted >= 0 && shifted < current.length
                ? current[shifted % current.length]
                : next[letterIdx % next.length];
          }
        } else {
          letter = current[letterIdx % current.length];
        }

        const pos = (i + offset) % path.length;
        const pathIdx = Math.floor(pos);

        if (pathIdx < path.length) {
          const point = path[pathIdx];
          const nextPoint = path[Math.min(pathIdx + 1, path.length - 1)];
          const interp = pos - pathIdx;

          const x = p.lerp(point.x, nextPoint.x, interp);
          const y = p.lerp(point.y, nextPoint.y, interp);

          const normalizedPos = pos / path.length;
          let opacity = 255;

          if (normalizedPos > 0.85) {
            opacity = 255 * (1 - (normalizedPos - 0.85) / 0.15);
          } else if (normalizedPos < 0.15) {
            opacity = 255 * (normalizedPos / 0.15);
          }

          if (opacity > 10) {
            p.fill(textColor[0], textColor[1], textColor[2], opacity);
            p.text(letter, x, y);
          }
        }
      }
    });
  };

  p.draw = () => {
    p.background(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    frameCounter++;
    updateCycle();

    const [width, height] = getCanvasSize(p);

    if (morphProgress < 1.0) {
      const smoothProgress = 0.5 - 0.5 * Math.cos(morphProgress * Math.PI);
      for (let i = 0; i < Math.min(curves.length, targetCurves.length); i++) {
        for (
          let j = 0;
          j < Math.min(curves[i].length, targetCurves[i].length);
          j++
        ) {
          const src = curves[i][j];
          const tgt = targetCurves[i][j];
          curves[i][j] = {
            x: src.x + (tgt.x - src.x) * smoothProgress,
            y: src.y + (tgt.y - src.y) * smoothProgress,
          };
        }
      }
    } else if (blendProgress < 1.0) {
      const baseline = baseCurves.map((path) => [...path]);
      applyWavering(width);
      const waved = curves.map((path) => [...path]);

      const blend = 0.5 - 0.5 * Math.cos(blendProgress * Math.PI);

      for (let i = 0; i < curves.length; i++) {
        for (let j = 0; j < curves[i].length; j++) {
          const b = baseline[i][j];
          const w = waved[i][j];
          curves[i][j] = {
            x: b.x + (w.x - b.x) * blend,
            y: b.y + (w.y - b.y) * blend,
          };
        }
      }
    } else {
      applyWavering(width);
    }

    drawText();
    drawLetters();
  };

  p.windowResized = () => {
    const [width, height] = getCanvasSize(p);
    p.resizeCanvas(width, height);
    initCurves();
    updateLetters();
  };
};

const HourglassCanvas = () => <ReactP5Wrapper sketch={sketch} />;

export default HourglassCanvas;
