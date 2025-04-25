import { ReactNode } from 'react';

type CanvasLayoutProps = {
  /** The title of the canvas page */
  title: string;
  /** The description text */
  description: string;
  /** The main content (canvas component) */
  children: ReactNode;
};

/**
 * A layout component for canvas pages
 */
const CanvasLayout = ({ title, description, children }: CanvasLayoutProps) => (
    <div className="space-y-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 inline-block">
        {children}
      </div>
    </div>
  );

export default CanvasLayout;
