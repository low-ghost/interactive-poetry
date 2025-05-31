import FullScreenButton from '@components/FullScreenButton';
import { Github, Presentation } from 'lucide-react';
import { ReactNode, useId } from 'react';

const GITHUB_BASE_URL =
  'https://github.com/low-ghost/interactive-poetry/blob/main/src/';
const SLIDES_BASE_URL =
  'https://low-ghost.github.io/interactive-poetry/slides/slides.html';

type CanvasLayoutProps = {
  /** The title of the canvas page */
  title: string;
  /** The description text */
  description: string;
  /** The main content (canvas component) */
  children: ReactNode;
  /** Path to the canvas component source code (without the base GitHub URL) */
  githubLink?: string;
  /** The example number in the slides (1-4) */
  slideExampleNumber?: number;
  /** Whether to hide the slides link */
  hideSlides?: boolean;
};

/**
 * A layout component for canvas pages
 */
const CanvasLayout = ({
  title,
  description,
  children,
  githubLink,
  slideExampleNumber,
  hideSlides = false,
}: CanvasLayoutProps) => {
  // Generate a unique ID for the canvas container
  const canvasContainerId = useId().replace(/:/g, '-') + 'canvas-container';

  // Construct the slides URL with section anchor if provided
  const slidesUrl = slideExampleNumber
    ? slideExampleNumber === 1
      ? `${SLIDES_BASE_URL}#example-1-interactivity-with-p5js--react`
      : `${SLIDES_BASE_URL}#example-${slideExampleNumber}-${title
          .toLowerCase()
          .replace(/\s+/g, '-')}`
    : SLIDES_BASE_URL;

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
          <div className="flex items-center gap-2">
            {githubLink && (
              <a
                href={`${GITHUB_BASE_URL}${githubLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View source code on GitHub"
                onClick={(e) => e.stopPropagation()}
              >
                <Github className="h-4 w-4" />
                <span>Source</span>
              </a>
            )}
            {!hideSlides && (
              <a
                href={slidesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View slides"
                onClick={(e) => e.stopPropagation()}
              >
                <Presentation className="h-4 w-4" />
                <span>Slides</span>
              </a>
            )}
          </div>
        </div>
      </div>
      <div
        id={canvasContainerId}
        className="w-full lg:max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 fullscreen-container"
      >
        {children}
        <div className="flex justify-end mt-4">
          <FullScreenButton targetId={canvasContainerId} />
        </div>
      </div>
    </div>
  );
};

export default CanvasLayout;
