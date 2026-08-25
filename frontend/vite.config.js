// Vite config: defineConfig is the Vite helper that gives typed, validated
// config; react() enables JSX + fast-refresh for the React app.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// plugin: react — needed to compile .jsx files in dev and build.
// server.port: the dev server runs on 3000.
// server.proxy: forwards every /api/* request to the backend (port 5000),
// which lets the frontend call relative URLs (/api/...) with no CORS config.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
