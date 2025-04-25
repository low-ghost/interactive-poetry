import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/interactive-poetry/',
  plugins: [react()],
  resolve: {
    alias: {
      '@hooks': '/src/hooks',
      '@components': '/src/components',
      '@layouts': '/src/layouts',
      '@type': '/src/type',
      '@routes': '/src/routes',
    },
  },
});
