import ProtectedRoute from '@components/ProtectedRoute';
import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyMoonCanvas = lazy(() => import('./MoonCanvas'));

const MoonPage = () => (
  <ProtectedRoute title="Furcula Borealis">
    <GenericCanvasPage
      title="Furcula Borealis"
      description="Poem by Paula Cisewski"
      githubLink="routes/moon/MoonCanvas.tsx"
      CanvasComponent={LazyMoonCanvas}
    />
  </ProtectedRoute>
);

export default MoonPage;
