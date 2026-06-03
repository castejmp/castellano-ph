import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // En GitHub Pages el sitio se sirve bajo /castellano-ph/.
  // En local y otros hosts (Netlify/Vercel) queda en la raíz.
  base: process.env.GITHUB_PAGES ? '/castellano-ph/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
