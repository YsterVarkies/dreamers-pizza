import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // pre-bundle everything up front so React is never duplicated between chunks
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'motion/react',
      'gsap',
      'gsap/ScrollTrigger',
      'gsap/ScrollToPlugin',
      'gsap/SplitText',
      'gsap/Flip',
      '@gsap/react',
      'lenis',
      'three',
      'three/examples/jsm/environments/RoomEnvironment.js',
      'three/examples/jsm/utils/BufferGeometryUtils.js',
    ],
  },
  server: {
    port: 5173,
    host: true,
    // native file events occasionally drop rapid saves on Windows — poll instead
    watch: { usePolling: true, interval: 250 },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400, // three.js is most of the bundle
  },
});
