import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postCssImport from 'postcss-import'
import postCssApply from 'postcss-apply'
import postColorModFunction from 'postcss-color-mod-function'
import postCssPresetEnv from 'postcss-preset-env'
import lostCss from 'lost'
import commonjs from '@rollup/plugin-commonjs' // Importing @rollup/plugin-commonjs to handle CJS to ESM conversion

export default defineConfig({
  build: {
    // Relative to the root
    outDir: 'lib',
    // Do not delete the outdir, TypeScript types might live there, and we don't want to delete them
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'], // Generate both ES Module and CommonJS outputs
      fileName: format => (format === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'styled-components'], // Ensure peer dependencies are not bundled
      output: {
        exports: 'named', // Use named exports for compatibility with styled-components in CJS
        globals: {
          'styled-components': 'styled', // Ensure styled-components maps correctly in UMD builds
        },
        plugins: [
          commonjs({
            include: /node_modules/, // Include node_modules for CommonJS conversion
            transformMixedEsModules: true, // Ensure proper handling of mixed modules
          }),
        ],
      },
    },
    target: 'es2017', // Transpile down to a compatible version for Next.js
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
    global: 'globalThis', // Fix issues with globalThis in some environments
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
