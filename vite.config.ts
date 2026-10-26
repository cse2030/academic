import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// BASE_PATH is set by the GitHub Actions workflow to "/<repo-name>/". Locally it is "/".
export default defineConfig({ base: process.env.BASE_PATH ?? '/', plugins: [react()] })
