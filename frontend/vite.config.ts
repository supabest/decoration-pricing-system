import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/decoration-pricing-system/',
  server: {
    port: 5173,
  },
})
