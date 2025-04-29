import CanvasLayout from '@layouts/CanvasLayout';
import { lazy, Suspense } from 'react';

const ForestCanvas = lazy(() => import('@routes/forest/ForestCanvas'));

const ForestPage = () => (
  <CanvasLayout
    title="Forest"
    description="A typographic exploration of the word 'forest' through etymology and poetry, with scattered letters forming a landscape."
  >
    <Suspense
      fallback={
        <div className="animate-pulse h-[600px] w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      }
    >
      <ForestCanvas />
    </Suspense>
  </CanvasLayout>
);

export default ForestPage;
