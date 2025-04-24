declare module 'p5js-wrapper' {
  import type * as P5 from 'p5';
  // Define a constructor interface that matches how p5 is used
  export const p5: {
    new (sketch: (p: P5) => void, node: HTMLElement | null): P5;
  };
  export * as p5 from 'p5';
}
