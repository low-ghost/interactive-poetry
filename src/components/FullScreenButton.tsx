import { Maximize2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type FullScreenButtonProps = {
  /**
   * The ID of the element to make fullscreen
   */
  targetId: string;
  /**
   * Additional class names for the button
   */
  className?: string;
};

/**
 * A button component that toggles fullscreen mode for a specified element
 */
const FullScreenButton = ({
  targetId,
  className = '',
}: FullScreenButtonProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleFullscreen = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (target.requestFullscreen) {
        target
          .requestFullscreen()
          .catch((err) =>
            console.error(
              `Error attempting to enable fullscreen: ${err.message}`,
            ),
          );
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      } else if ((target as any).msRequestFullscreen) {
        (target as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .catch((err) =>
            console.error(
              `Error attempting to exit fullscreen: ${err.message}`,
            ),
          );
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Update fullscreen state when it changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange,
      );
      document.removeEventListener(
        'msfullscreenchange',
        handleFullscreenChange,
      );
    };
  }, []);

  return (
    <button
      className={`inline-flex items-center gap-1 text-sm border rounded px-2 py-1 transition-colors ${
        isFullscreen
          ? 'fullscreen-exit-button'
          : 'text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <X size={16} />
      ) : (
        <>
          <Maximize2 size={16} />
          {!isMobile && <span>Fullscreen</span>}
        </>
      )}
    </button>
  );
};

export default FullScreenButton;
