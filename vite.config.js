import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name for GitHub Pages.
// If you rename the repo, change this value.
export default defineConfig({
  plugins: [react()],
  base: '/sie-study/',
})
