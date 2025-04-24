import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export const useDarkMode = (): [Theme, () => void] => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    // Check system preference
    if (!savedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    return savedTheme || 'light';
  });

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return [theme, toggleTheme];
};

export default useDarkMode;
