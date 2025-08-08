import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
});


