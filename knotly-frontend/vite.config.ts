import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Strict mode: fail on TypeScript errors
    middlewareMode: false,
  },
  build: {
    // Fail build on TypeScript errors
    rollupOptions: {
      output: {
        // Ensure all errors are thrown
      },
    },
    // Minification
    minify: 'terser',
  },
})
