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
    ssr: 'src/index.ts',
    outDir: 'lib',
    emptyOutDir: false, // Keep the outDir to avoid removing TS types
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'styled-components'], // Avoid bundling dependencies
      output: {
        assetFileNames: '[name].[ext]', // Ensure asset names are kept clean
        entryFileNames: '[name].js', // Ensure only compiled JS is output
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: {
        configFile: true,
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    exclude: ['styled-components'],
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
    'process.env': {
      NODE_ENV: process.env.NODE_ENV,
      OPENTRONS_PROJECT: process.env.OPENTRONS_PROJECT,
    },
    global: 'globalThis', // Ensure compatibility with global variables
  },
  resolve: {
    alias: {
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
    },
  },
})
