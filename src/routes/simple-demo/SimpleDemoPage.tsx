import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazySimpleDemoCanvas = lazy(() => import('./SimpleDemoCanvas'));

const SimpleDemoPage = () => (
  <GenericCanvasPage
    title="P5.js Simple Demo"
    description="Interact with the canvas below by moving your mouse over it."
    githubLink="routes/simple-demo/SimpleDemoCanvas.tsx"
    CanvasComponent={LazySimpleDemoCanvas}
  />
);

export default SimpleDemoPage;
