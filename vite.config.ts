import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    strictPort: false,
    // Vite handles client-side routing automatically
    // All routes are served through index.html
  },
  build: {
    outDir: 'dist',
  },
})
