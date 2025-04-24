import Sidebar from '@components/Sidebar';
import useDarkMode from '@hooks/useDarkMode';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, toggleTheme] = useDarkMode();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Interactive Poetry Experiments
          </h2>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
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
            ) : (
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
            )}
          </button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
