import CanvasLayout from '@layouts/CanvasLayout';
import { LazyExoticComponent, ReactNode, Suspense } from 'react';

// Define the standard fallback here once
const DefaultFallback = (
  <div className="animate-pulse h-[600px] w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
);

type GenericCanvasPageProps = {
  title: string;
  description: string;
  githubLink?: string;
  CanvasComponent: LazyExoticComponent<() => JSX.Element>;
  fallback?: ReactNode; // Allow overriding the default fallback if needed
  slideExampleNumber?: number; // The example number in the slides (1-4)
};

const GenericCanvasPage = ({
  title,
  description,
  githubLink,
  CanvasComponent,
  fallback = DefaultFallback, // Use the default fallback
  slideExampleNumber,
}: GenericCanvasPageProps) => (
  <CanvasLayout
    title={title}
    description={description}
    githubLink={githubLink}
    slideExampleNumber={slideExampleNumber}
  >
    <Suspense fallback={fallback}>
      <CanvasComponent />
    </Suspense>
  </CanvasLayout>
);

export default GenericCanvasPage;
