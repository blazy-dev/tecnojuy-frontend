import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// Usamos adapter de Cloudflare para soporte SSR incremental (rutas dinámicas sin getStaticPaths obligatorio).
export default defineConfig({
  adapter: cloudflare(),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false
    })
  ],
  output: 'hybrid',
  server: {
    port: 4321,
    host: true
  },
  vite: {
    define: {
      // FORZADO: Usar siempre la URL HTTPS en el build para evitar Mixed Content
      __API_URL__: JSON.stringify(process.env.PUBLIC_API_URL || 'https://backend-tecnojuy2-production.up.railway.app')
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Preservar todas las headers importantes
              const headersToPreserve = ['cookie', 'authorization', 'content-type'];
              headersToPreserve.forEach(header => {
                if (req.headers[header]) {
                  proxyReq.setHeader(header, req.headers[header]);
                }
              });
              
              // Log simplificado
              console.log(`� ${req.method} ${req.url}`);
            });
            
            proxy.on('proxyRes', (proxyRes, req, res) => {
              // Solo mostrar errores
              if (proxyRes.statusCode >= 400) {
                console.log(`❌ ${proxyRes.statusCode} for ${req.url}`);
              }
            });
          }
        }
      }
    }
  }
});

