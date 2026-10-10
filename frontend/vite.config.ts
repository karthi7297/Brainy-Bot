import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // REST API -> backend
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Live game WebSocket -> backend
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
    },
  },
})
