import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyMoonCanvas = lazy(() => import('./MoonCanvas'));

const MoonPage = () => (
  <GenericCanvasPage
    title="Shrine of Footprints"
    description="An animated poem exploring themes of presence, grief, and trespass, visualized through Russian Futurist and Constructivist aesthetics. Click to add architectural elements, press spacebar to advance, or let it auto-play."
    githubLink="routes/moon/MoonCanvas.tsx"
    CanvasComponent={LazyMoonCanvas}
  />
);

export default MoonPage;
