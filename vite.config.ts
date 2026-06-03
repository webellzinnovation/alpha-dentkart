import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          timeout: 120000,
          cookieDomainRewrite: 'localhost',
          cookiePathRewrite: '/',
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          // Manual chunk splitting — keeps vendor code separate from app code
          // so the browser can cache them independently
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-ui': ['sonner'],
          }
        }
      },
      // Increase warning threshold (large product catalog is expected)
      chunkSizeWarningLimit: 1500,
      target: 'es2015',
      minify: 'esbuild',
      // Enable CSS code splitting for faster first paint
      cssCodeSplit: true,
      // Produce source maps only in dev
      sourcemap: false,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query'
      ]
    }
  };
});