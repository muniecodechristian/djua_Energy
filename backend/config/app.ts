import { defineConfig as defineHttpConfig } from '@adonisjs/core/http'

export default {
  appKey: process.env.APP_KEY || 'change-me-in-production',
  http: defineHttpConfig({ trustProxy: false }),
  logger: { enabled: true },
}
