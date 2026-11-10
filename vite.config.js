import { defineConfig } from 'vite';
export default defineConfig({ base: '/sample-ai-browser/', build: { outDir: 'docs', emptyOutDir: false, chunkSizeWarningLimit: 2200 } });
