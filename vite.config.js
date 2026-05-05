import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('/victory')) return 'charts';
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          if (id.includes('/axios/')) return 'axios';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
