import ProtectedRoute from '@components/ProtectedRoute';
import GenericCanvasPage from '@layouts/GenericCanvasPage';
import { lazy } from 'react';

const LazyAlphabetCanvas = lazy(() => import('./AlphabetCanvas'));

const AlphabetPage = () => (
  <ProtectedRoute title="Someone Else's Alphabet">
    <GenericCanvasPage
      title="Someone Else's Alphabet"
      description="Poem by Paula Cisewski"
      githubLink="routes/alphabet/AlphabetCanvas.tsx"
      CanvasComponent={LazyAlphabetCanvas}
      hideSlides
    />
  </ProtectedRoute>
);

export default AlphabetPage;
