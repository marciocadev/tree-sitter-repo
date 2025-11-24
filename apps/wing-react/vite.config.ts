import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {fileURLToPath} from "node:url"
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, '..', '..');
const treeSitterWingDir = resolve(workspaceRoot, 'tree-sitter-wing');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      allow: [workspaceRoot, treeSitterWingDir],
    },
  },
  assetsInclude: ["**/*.wasm"],
})
