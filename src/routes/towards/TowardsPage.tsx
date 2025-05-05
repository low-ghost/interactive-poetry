import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyTowardsCanvas = lazy(() => import('./TowardsCanvas'));

const TowardsPage = () => (
  <GenericCanvasPage
    title="Towards"
    description="An generative collage that and animated poem. Watch for changes or click to generate a new background."
    githubLink="routes/towards/TowardsCanvas.tsx"
    CanvasComponent={LazyTowardsCanvas}
  />
);

export default TowardsPage;
