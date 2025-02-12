import { defineConfig } from 'cypress'

module.exports = defineConfig({
  video: false,
  viewportWidth: 1440,
  viewportHeight: 900,
  e2e: {
    baseUrl: 'http://localhost:5178',
  },
})
