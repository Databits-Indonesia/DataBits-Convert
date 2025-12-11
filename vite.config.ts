import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          pdfjs: ['pdfjs-dist'],
          vendor: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 2000, // Or increase the limit
  },
});
