import Sidebar from '@components/Sidebar';
import { useDarkMode } from '@hooks/useDarkMode';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [theme, toggleTheme] = useDarkMode();
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Only set initial state on first mount, not on every resize
      if (mobile && window.innerWidth < 640) {
        setSidebarOpen(false);
      }
    };
    // Initial check
    checkMobile();
    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Menu Button - fixed at top */}
        {isMobile && (
          <div className="fixed top-4 left-4 z-40">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
