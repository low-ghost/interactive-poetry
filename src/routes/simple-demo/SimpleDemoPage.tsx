import CanvasLayout from '@layouts/CanvasLayout';
import { lazy, Suspense } from 'react';

const SimpleDemoCanvas = lazy(() => import('./SimpleDemoCanvas'));

const SimpleDemoPage = () => (
    <CanvasLayout
      title="P5.js Simple Demo"
      description="Interact with the canvas below by moving your mouse over it."
    >
      <Suspense
        fallback={
          <div className="animate-pulse h-[600px] w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
        }
      >
        <SimpleDemoCanvas />
      </Suspense>
    </CanvasLayout>
  );

export default SimpleDemoPage;
