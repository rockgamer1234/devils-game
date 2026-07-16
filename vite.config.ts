
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: path.resolve(__dirname, 'src/client'),
  publicDir: path.resolve(__dirname, 'public'), 
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    // THE CSP RESOLUTION: Prevents inlining small assets as Base64 data URIs
    assetsInlineLimit: 0, 
    rollupOptions: {
      input: {
        splash: path.resolve(__dirname, 'src/client/splash.html'),
        game: path.resolve(__dirname, 'src/client/game.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
      }
    }
  }
});