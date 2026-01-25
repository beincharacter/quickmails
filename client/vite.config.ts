import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name of the current module (client/)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  // Load .env from root directory (parent of client/)
  const rootEnvPath = path.resolve(__dirname, '../.env')
  
  // Load environment variables from root .env file
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  return {
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
    // Explicitly set envDir to root directory
    envDir: path.resolve(__dirname, '..'),
  }
})
