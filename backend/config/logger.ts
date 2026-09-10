import { defineConfig } from '@adonisjs/logger'

export default defineConfig({
  default: 'app',
  loggers: {
    app: {
      enabled: true,
      level: 'info',
      destination: process.stdout,
    },
  },
})
