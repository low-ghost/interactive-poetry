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
};

const GenericCanvasPage = ({
  title,
  description,
  githubLink,
  CanvasComponent,
  fallback = DefaultFallback, // Use the default fallback
}: GenericCanvasPageProps) => (
  <CanvasLayout title={title} description={description} githubLink={githubLink}>
    <Suspense fallback={fallback}>
      <CanvasComponent />
    </Suspense>
  </CanvasLayout>
);

export default GenericCanvasPage;
