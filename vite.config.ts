import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tells TypeScript that `process` exists when Vite runs this file.
declare const process: { env: Record<string, string | undefined> }

// BASE_PATH is set by the GitHub Actions workflow to "/<repo-name>/". Locally it is "/".
export default defineConfig({ base: process.env.BASE_PATH ?? '/', plugins: [react()] })
