import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyForestCanvas = lazy(() => import('./ForestCanvas'));

const ForestPage = () => (
  <GenericCanvasPage
    title="Forest"
    description="A typographic exploration of the word 'forest' through etymology and poetry, with scattered letters forming a landscape."
    githubLink="routes/forest/ForestCanvas.tsx"
    CanvasComponent={LazyForestCanvas}
    slideExampleNumber={3}
  />
);

export default ForestPage;
