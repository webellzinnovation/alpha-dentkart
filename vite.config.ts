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
          manualChunks: (id) => {
            // Core React and vendor libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('@fortawesome')) {
                return 'vendor-ui';
              }
              if (id.includes('google') || id.includes('firebase')) {
                return 'vendor-cloud';
              }
              return 'vendor';
            }

            // Application code - group into larger blocks to avoid circularity
            if (id.includes('/components/admin/') || id.includes('AdminDashboard')) {
              return 'app-admin';
            }
            if (id.includes('/components/') && (id.includes('Checkout') || id.includes('Cart') || id.includes('Product'))) {
              return 'app-commerce';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom'
      ]
    }
  };
});