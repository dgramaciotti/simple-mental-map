import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy vendor libraries into their own chunk
          'vendor-d3': ['d3'],
          'vendor-markmap': ['markmap-view', 'markmap-lib'],
        },
      },
    },
    // Increase the chunk size limit slightly to acknowledge our heavy libs
    chunkSizeWarningLimit: 600,
  },
});
