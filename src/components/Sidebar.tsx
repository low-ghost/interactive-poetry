import { AppRoutes } from '@type/routes';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GalleryIcon,
  HomeIcon,
} from './icons';

const navigationConfig = [
  {
    path: AppRoutes.HOME,
    label: 'Home',
    icon: <HomeIcon />,
  },
  {
    path: AppRoutes.SIMPLE_DEMO,
    label: 'Simple Demo',
    icon: <GalleryIcon />,
  },
  {
    path: AppRoutes.RIPPLE,
    label: 'Ripple Effect',
    icon: <GalleryIcon />,
  },
];

type SidebarProps = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar = ({ sidebarOpen, toggleSidebar }: SidebarProps) => {
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
                <ChevronLeftIcon />
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
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
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
        </div>
      )}
    </>
  );
};

export default Sidebar;
