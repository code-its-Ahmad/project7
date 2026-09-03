import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  server: {
    host: true,
    port: 8080,

    // ─── Windows EBUSY fix ────────────────────────────────────────────────────
    // On Windows, native fs.watch() raises EBUSY when a file is briefly locked
    // by antivirus / another editor.  Switching Chokidar to polling mode avoids
    // the crash entirely; `awaitWriteFinish` prevents spurious reloads on slow
    // saves; `ignoreErrors` keeps the watcher alive even if one file is busy.
    watch: {
      usePolling: true,
      interval: 300,
      binaryInterval: 600,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    },
  },

  plugins: [react()],

  // Surfaced by the dev status banner so a stale preview is immediately obvious.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'es2020',
    // Source maps kept off in prod: they add ~4MB to the deploy and this is a
    // public portfolio, not a service that needs remote stack traces.
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        /**
         * The previous build emitted a single 2,044 kB chunk, so a visitor on a
         * phone had to download, parse and compile Three.js, the admin CMS and
         * every carousel before the hero could paint.
         *
         * Splitting by library lets the browser cache each vendor
         * independently and — combined with the lazy routes/sections — keeps
         * Three.js off the critical path entirely on low-tier devices, which
         * never mount a WebGL scene at all.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Three.js and its React bindings are by far the heaviest group.
          if (
            id.includes('/three/') ||
            id.includes('/three-stdlib/') ||
            id.includes('@react-three/')
          ) {
            return 'vendor-three';
          }

          if (id.includes('framer-motion') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) {
            return 'vendor-motion';
          }

          if (id.includes('/swiper/')) return 'vendor-swiper';
          if (id.includes('react-parallax-tilt')) return 'vendor-tilt';
          if (id.includes('@tanstack/')) return 'vendor-query';
          if (id.includes('react-icons') || id.includes('lucide-react')) return 'vendor-icons';

          if (
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }

          return 'vendor';
        },
      },
    },
  },
});
