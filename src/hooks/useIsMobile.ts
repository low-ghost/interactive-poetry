import { useEffect, useState } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint The width in pixels below which is considered mobile (default: 768)
 * @returns boolean indicating if the current viewport is mobile-sized
 */
export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};
