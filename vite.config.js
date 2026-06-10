import { defineConfig } from 'vite';

// En GitHub Pages el sitio se sirve bajo /castellano-ph/.
// En local y otros hosts queda en la raíz.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/castellano-ph/' : '/',
  server: { host: true, port: 5173 },
});
