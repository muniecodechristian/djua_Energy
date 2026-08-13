import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite' // <-- Ajout du plugin Tailwind v4
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(), // <-- Ajout du plugin Tailwind v4 pour la compilation
  ],
  resolve: {
    alias: {
      // Ce raccourci force Vite à remplacer "@" par le dossier "/src" de ton projet
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ⚡ On force Vite à pré-compiler 'react-is' et 'prop-types' en ESM moderne
  optimizeDeps: {
    include: ['react-is', 'prop-types'],
  },
})