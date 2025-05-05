import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyCollageCanvas = lazy(() => import('./CollageCanvas'));

const CollagePage = () => (
  <GenericCanvasPage
    title="Generative Collage"
    description="An interactive generative collage that creates artistic compositions with varied shapes, patterns, and arrangements. Adjust the settings to explore different collage styles from minimal to complex."
    githubLink="routes/collage/CollageCanvas.tsx"
    CanvasComponent={LazyCollageCanvas}
  />
);

export default CollagePage;
