import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          heroui: [
            '@heroui/system',
            '@heroui/button',
            '@heroui/card',
            '@heroui/modal',
            '@heroui/tabs',
            '@heroui/toast',
            '@heroui/tooltip',
            '@heroui/image',
            '@heroui/link',
            '@heroui/divider',
            '@heroui/spinner',
            '@heroui/theme',
            '@heroui/scroll-shadow',
            '@heroui/select',
          ],
        },
      },
    },
  },
})
