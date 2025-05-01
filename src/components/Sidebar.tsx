import { AppRoutes } from '@type/routes';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ForestIcon,
  HomeIcon,
  RippleIcon,
  SimpleDemoIcon,
} from './icons';

const navigationConfig = [
  {
    path: AppRoutes.HOME,
    label: 'Home',
    icon: <HomeIcon size={24} />,
  },
  {
    path: AppRoutes.SIMPLE_DEMO,
    label: 'Simple Demo',
    icon: <SimpleDemoIcon size={24} />,
  },
  {
    path: AppRoutes.RIPPLE,
    label: 'Ripple Effect',
    icon: <RippleIcon size={24} />,
  },
  {
    path: AppRoutes.FOREST,
    label: 'Forest',
    icon: <ForestIcon size={24} />,
  },
];

type SidebarProps = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
};

const Sidebar = ({
  sidebarOpen,
  toggleSidebar,
  theme,
  toggleTheme,
}: SidebarProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar - completely separate implementation */}
      {isMobile ? (
        <div
          className={`
            fixed inset-0 z-30 bg-gray-900 
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-end border-b border-gray-700">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-white hover:bg-gray-700"
                aria-label="Close navigation"
              >
                <ChevronLeftIcon size={24} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-4">
                {navigationConfig.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center py-3 px-4 rounded-md hover:bg-gray-700 ${
                        location.pathname === item.path ? 'bg-gray-700' : ''
                      }`}
                      onClick={toggleSidebar}
                    >
                      <span className="text-white">{item.icon}</span>
                      <span className="ml-4 text-white">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Theme toggle for mobile */}
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={toggleTheme}
                className="flex items-center w-full py-3 px-4 rounded-md text-white hover:bg-gray-700"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="ml-4">Light Mode</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    <span className="ml-4">Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop sidebar - original implementation */
        <div
          className={`
            relative z-30 ${sidebarOpen ? 'w-64' : 'w-20'}
            h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col
          `}
        >
          <div className="p-4 flex items-center justify-end border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <ChevronLeftIcon size={24} />
              ) : (
                <ChevronRightIcon size={24} />
              )}
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-4">
              {navigationConfig.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center py-3 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      location.pathname === item.path
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : ''
                    }`}
                  >
                    <span className="text-gray-800 dark:text-gray-200">
                      {item.icon}
                    </span>
                    <span
                      className={`ml-4 text-gray-800 dark:text-gray-200 ${
                        sidebarOpen ? 'block' : 'hidden'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Theme toggle for desktop */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <button
              onClick={toggleTheme}
              className="flex items-center w-full py-3 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800 dark:text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span
                    className={`ml-4 text-gray-800 dark:text-gray-200 ${
                      sidebarOpen ? 'block' : 'hidden'
                    }`}
                  >
                    Light Mode
                  </span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-800 dark:text-gray-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span
                    className={`ml-4 text-gray-800 dark:text-gray-200 ${
                      sidebarOpen ? 'block' : 'hidden'
                    }`}
                  >
                    Dark Mode
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
