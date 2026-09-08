import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    secure: false,
    // Allow up to 2 minutes for rasterio/GeoJSON processing on first village load
    proxyTimeout: 120000,
    timeout: 120000,
    configure: (proxy: any, _options: any) => {
      proxy.on('error', (err: any, _req: any, res: any) => {
        console.warn('[Vite Proxy Error] Could not connect to backend at 127.0.0.1:8000:', err.message);
        if (res && 'writeHead' in res && !res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Backend server is temporarily starting up or unavailable', detail: err.message }));
        }
      });
      proxy.on('proxyReq', (_proxyReq: any, req: any) => {
        console.debug('[Vite Proxy]', req.method, req.url);
      });
    },
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    proxy: apiProxy,
  },
})
