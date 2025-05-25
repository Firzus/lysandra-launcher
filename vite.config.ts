import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Empêche Vite de masquer les erreurs Rust
  clearScreen: false,
  server: {
    port: 1420,
    // Tauri attend un port fixe, échoue si ce port n'est pas disponible
    strictPort: true,
    // Si l'hôte que Tauri attend est défini, l'utiliser
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Dire à Vite d'ignorer la surveillance de `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  // Les variables d'environnement commençant par les éléments de `envPrefix` seront exposées dans le code source de Tauri via `import.meta.env`.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri utilise Chromium sur Windows et WebKit sur macOS et Linux
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // Ne pas minifier pour les builds de debug
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // Produire des sourcemaps pour les builds de debug
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
