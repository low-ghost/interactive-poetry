import CanvasLayout from '@layouts/CanvasLayout';
import { lazy, Suspense } from 'react';

const RippleCanvas = lazy(() => import('./RippleCanvas'));

const RipplePage = () => (
  <CanvasLayout
    title="P5.js Ripple Effect"
    description="Interact with the canvas to create ripple effects. Click to create a color burst."
  >
    <Suspense
      fallback={
        <div className="animate-pulse h-[600px] w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      }
    >
      <RippleCanvas />
    </Suspense>
  </CanvasLayout>
);

export default RipplePage;
