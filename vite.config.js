import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// En GitHub Pages el sitio se sirve bajo /castellano-ph/.
// En local y otros hosts queda en la raíz.
// Multi-página: index.html (experiencia 3D) + casting.html (herramienta).
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/castellano-ph/' : '/',
  server: { host: true, port: 5173 },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        casting: fileURLToPath(new URL('./casting.html', import.meta.url)),
      },
    },
  },
});
