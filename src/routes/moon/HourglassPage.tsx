import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyHourglassCanvas = lazy(() => import('./HourglassCanvas'));

const HourglassPage = () => (
  <GenericCanvasPage
    title="Hourglass Typography"
    description="Letters from the moon poem flow down the page in hourglass patterns, recreating the typographic art from the poetry book. Watch as text streams through dotted paths in synchronized waves."
    githubLink="routes/moon/HourglassCanvas.tsx"
    CanvasComponent={LazyHourglassCanvas}
  />
);

export default HourglassPage;
