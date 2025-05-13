export const CONFIG = {
  minSize: 40,
  maxSize: 70,
  maxPolygonSides: 7,
  shapeVariety: 5,
  crossfadeDuration: 2500, // 2.5 seconds for crossfade
  displayDuration: 8000, // Total display time per line
};

export enum ShapeType {
  Basic = 'basic',
  Polygon = 'polygon',
  Custom = 'custom',
  Chaotic = 'chaotic',
}

export enum BasicShape {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Ellipse = 'ellipse',
}

export enum FilterType {
  None = 'none',
  Grayscale = 'grayscale',
  Sepia = 'sepia',
  HighContrast = 'highContrast',
}

export enum PatternType {
  Dots = 'dots',
  Lines = 'lines',
  Cross = 'cross',
  Zigzag = 'zigzag',
}
