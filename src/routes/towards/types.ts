import { Position2D } from '@utils/math';
import { Graphics } from 'p5';

/** Defines the different types of shapes that can be generated */
export enum ShapeType {
  /** Simple geometric shapes (rectangle, circle, ellipse) */
  Basic = 'basic',
  /** Regular or irregular polygons with n sides */
  Polygon = 'polygon',
  /** User-defined shapes */
  Custom = 'custom',
  /** Shapes with randomized, organic edges */
  Chaotic = 'chaotic',
}

/** Defines the basic geometric shapes that can be used when ShapeType is Basic */
export enum BasicShape {
  /** Rectangular shape with width and height */
  Rectangle = 'rectangle',
  /** Perfect circle with equal width and height */
  Circle = 'circle',
  /** Elliptical shape with different width and height */
  Ellipse = 'ellipse',
}

/** Defines the different image filter effects that can be applied */
export enum FilterType {
  /** No filter applied */
  None = 'none',
  /** Converts image to grayscale */
  Grayscale = 'grayscale',
  /** Applies sepia tone effect */
  Sepia = 'sepia',
  /** Increases image contrast */
  HighContrast = 'highContrast',
}

/** Defines the different pattern types that can be applied to shapes */
export enum PatternType {
  Dots = 'dots',
  Lines = 'lines',
  Cross = 'cross',
  Zigzag = 'zigzag',
}

export type CollageElement = Position2D & {
  url: string;
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

export type DecorativeLetter = Position2D & {
  char: string;
  size: number;
  rotation: number;
  color: readonly [number, number, number, number];
};

export type PoemWord = {
  word: string;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
};
