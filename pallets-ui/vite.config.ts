import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any call to /api will be forwarded to your backend
      '/api': 'http://localhost:4000',
    },
  },
});