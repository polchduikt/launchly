import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@xyflow/')) {
            return 'vendor-xyflow';
          }
          if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/@tanstack/react-virtual')) {
            return 'vendor-query';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@icons-pack/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/@stomp/') || id.includes('node_modules/sockjs-client/')) {
            return 'vendor-socket';
          }
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform/')) {
            return 'vendor-forms';
          }
        },
      },
    },
  },
})
