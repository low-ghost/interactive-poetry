import { P5CanvasInstance } from '@p5-wrapper/react';
import { Position2D } from '@utils/math';
import { BasicShape, ShapeType } from './types';

export const generateCircleOrEllipsePoints = (
  p: P5CanvasInstance,
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

export const subdivideEdge = (
  p: P5CanvasInstance,
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

  if (len < 0.01) return [];

  const noiseVal = p.noise(midX * 0.01, midY * 0.01) * 2 - 1;
  const displacement = roughness * (depth / 3) * noiseVal;

  const midPoint = {
    x: midX + (-dy / len) * displacement,
    y: midY + (dx / len) * displacement,
  };

  const leftSide = subdivideEdge(p, p1, midPoint, depth - 1, roughness * 0.8);
  const rightSide = subdivideEdge(p, midPoint, p2, depth - 1, roughness * 0.8);

  return [...leftSide, midPoint, ...rightSide];
};

export const generateShape = (
  p: P5CanvasInstance,
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

  if (shapeType === ShapeType.Basic) {
    if (basicShapeType === BasicShape.Circle) {
      return generateCircleOrEllipsePoints(p, centerX, centerY, radius, radius);
    } else if (basicShapeType === BasicShape.Ellipse) {
      return generateCircleOrEllipsePoints(
        p,
        centerX,
        centerY,
        width / 2,
        height / 2,
      );
    } else {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      return [
        { x: centerX - halfWidth, y: centerY - halfHeight },
        { x: centerX + halfWidth, y: centerY - halfHeight },
        { x: centerX + halfWidth, y: centerY + halfHeight },
        { x: centerX - halfWidth, y: centerY + halfHeight },
      ];
    }
  } else if (shapeType === ShapeType.Polygon) {
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
    const isHighlyChaotic = shapeType === ShapeType.Chaotic;
    const basePoints: Position2D[] = [];
    const numPoints = Math.floor(p.random(3, 7));

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * p.TWO_PI;
      const noiseVal = p.noise(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3);
      const r = radius * (0.6 + noiseVal * (isHighlyChaotic ? 0.7 : 0.5));

      basePoints.push({
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      });
    }

    const depth = isHighlyChaotic ? 3 : 2;

    for (let i = 0; i < basePoints.length; i++) {
      const p1 = basePoints[i];
      const p2 = basePoints[(i + 1) % basePoints.length];
      points.push(p1);

      if (depth > 0) {
        const subdivided = subdivideEdge(
          p,
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
