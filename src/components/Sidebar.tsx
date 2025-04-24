import { AppRoutes } from '@type/routes';
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
];

type SidebarProps = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar = ({ sidebarOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();

  return (
    <div
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h1 className={`font-bold text-xl ${sidebarOpen ? 'block' : 'hidden'}`}>
          Interactive Poetry
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigationConfig.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  location.pathname === item.path
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : ''
                }`}
              >
                {item.icon}
                <span className={`ml-4 ${sidebarOpen ? 'block' : 'hidden'}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
