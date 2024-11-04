import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { builtinModules } from 'module'
import pkg from './package.json'

export default defineConfig({
  publicDir: false,
  base: '',
  build: {
    target: 'node16', // Target Node environment
    outDir: 'lib',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.ts'),
        cli: path.resolve(__dirname, 'src/cli.ts'),
      },
      output: {
        // Define naming conventions for the output files
        entryFileNames: '[name].js', // No hashes in entry files
        chunkFileNames: '[name].js', // No hashes in chunk files
        assetFileNames: '[name][extname]', // Keep original asset names
      },
      external: [...builtinModules],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true,
    },
  },
  plugins: [
    react({
      include: '**/*.tsx',
      babel: { configFile: true },
    }),
  ],
  define: {
    _PKG_VERSION_: JSON.stringify(pkg.version),
    _PKG_BUGS_URL_: JSON.stringify(pkg.bugs.url),
    _OPENTRONS_PROJECT_: JSON.stringify(
      process.env.OPENTRONS_PROJECT ?? 'robot-stack'
    ),
  },
  resolve: {
    alias: {
      '@opentrons/components/styles': path.resolve(
        '../components/src/index.module.css'
      ),
      '@opentrons/components': path.resolve('../components/src/index.ts'),
      '@opentrons/shared-data': path.resolve('../shared-data/js/index.ts'),
      '@opentrons/step-generation': path.resolve(
        '../step-generation/src/index.ts'
      ),
      '@opentrons/discovery-client': path.resolve(
        '../discovery-client/src/index.ts'
      ),
      '@opentrons/usb-bridge/node-client': path.resolve(
        '../usb-bridge/node-client/src/index.ts'
      ),
    },
  },
})
