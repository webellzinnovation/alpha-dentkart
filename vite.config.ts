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
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          timeout: 60000, // 60 second proxy timeout
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
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }

            // UI components and icons
            if (id.includes('@fortawesome')) {
              return 'ui';
            }

            // AI and chat features
            if (id.includes('google') || id.includes('genai')) {
              return 'ai';
            }

            // Large components
            if (id.includes('AdminDashboard') || id.includes('CustomerManagement') || id.includes('VerificationManager')) {
              return 'admin';
            }

            if (id.includes('ProductDetail') || id.includes('ProductCard') || id.includes('ProductModal')) {
              return 'products';
            }

            if (id.includes('Checkout') || id.includes('CartSidebar')) {
              return 'checkout';
            }

            if (id.includes('Theme')) {
              return 'themes';
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