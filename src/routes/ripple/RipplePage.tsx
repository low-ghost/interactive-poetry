import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyRippleCanvas = lazy(() => import('./RippleCanvas'));

const RipplePage = () => (
  <GenericCanvasPage
    title="Ripple"
    description="Interact with the canvas to create ripple effects. Click to create a color burst."
    githubLink="routes/ripple/RippleCanvas.tsx"
    CanvasComponent={LazyRippleCanvas}
    slideExampleNumber={2}
  />
);

export default RipplePage;
