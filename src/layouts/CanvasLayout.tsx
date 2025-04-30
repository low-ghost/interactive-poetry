import { GitHubIcon } from '@components/icons';
import { ReactNode } from 'react';

const GITHUB_BASE_URL =
  'https://github.com/low-ghost/interactive-poetry/blob/main/src/';

type CanvasLayoutProps = {
  /** The title of the canvas page */
  title: string;
  /** The description text */
  description: string;
  /** The main content (canvas component) */
  children: ReactNode;
  /** Path to the canvas component source code (without the base GitHub URL) */
  githubLink?: string;
};

/**
 * A layout component for canvas pages
 */
const CanvasLayout = ({
  title,
  description,
  children,
  githubLink,
}: CanvasLayoutProps) => (
  <div className="space-y-4 flex flex-col items-center">
    <div className="w-full flex flex-col items-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-3 mt-1">
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
        {githubLink && (
          <a
            href={`${GITHUB_BASE_URL}${githubLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View source code on GitHub"
            onClick={(e) => e.stopPropagation()}
          >
            <GitHubIcon className="h-4 w-4" />
            <span>Source</span>
          </a>
        )}
      </div>
    </div>
    <div className="w-full lg:max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {children}
    </div>
  </div>
);

export default CanvasLayout;
