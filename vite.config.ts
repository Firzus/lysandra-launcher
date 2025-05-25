import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimisation React avec SWC pour de meilleures performances
      jsxRuntime: 'automatic',
    }),
    tsconfigPaths(),
  ],
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
    // Optimisation de la taille des chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Amélioration du bundle splitting
        manualChunks: (id) => {
          // Vendor chunks pour les dépendances externes
          if (id.includes('node_modules')) {
            // React et React DOM dans un chunk séparé
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // HeroUI dans un chunk séparé
            if (id.includes('@heroui')) {
              return 'heroui-vendor'
            }
            // Tauri plugins dans un chunk séparé
            if (id.includes('@tauri-apps')) {
              return 'tauri-vendor'
            }
            // i18n dans un chunk séparé
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor'
            }
            // Framer Motion dans un chunk séparé
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }

            // Autres dépendances
            return 'vendor'
          }

          // Chunks pour les différentes parties de l'application
          if (id.includes('/src/utils/')) {
            return 'utils'
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks'
          }
          if (id.includes('/src/components/')) {
            return 'components'
          }
          if (id.includes('/src/pages/')) {
            return 'pages'
          }
        },
        // Optimisation des noms de fichiers
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimisations supplémentaires
    reportCompressedSize: false,
    // Préchargement des modules critiques
    modulePreload: {
      polyfill: true,
    },
  },
  // Optimisations pour le développement
  optimizeDeps: {
    include: ['react', 'react-dom', '@heroui/system', '@heroui/theme', 'react-i18next', 'i18next'],
    exclude: ['@tauri-apps/api'],
  },
})
