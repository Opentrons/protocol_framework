import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'lib',
    // do not delete the outdir, typescript types might live there and we dont want to delete them
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'], // Generate both ES Module and CommonJS outputs
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'styled-components'], // Ensure peer dependencies are not bundled
    },
    target: 'es2017', // Transpile down to a compatible version for Next.js (for Protocol Library)
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: {
        // Use babel.config.js files
        configFile: true,
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    exclude: ['styled-components'], // Avoid pre-bundling styled-components
  },
  css: {
    postcss: {
      plugins: [
        postCssImport({ root: 'src/' }),
        postCssApply(),
        postColorModFunction(),
        postCssPresetEnv({ stage: 0 }),
        lostCss(),
      ],
    },
  },
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
    },
    dedupe: ['styled-components'], // Prevent duplicate styled-components instances
  },
})
