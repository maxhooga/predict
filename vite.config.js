import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/naive': 'http://localhost:3000',
      '/ses': 'http://localhost:3000',
      '/holt': 'http://localhost:3000',
    },
  },
});
