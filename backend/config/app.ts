import { configProvider } from '@adonisjs/core'

export default configProvider.create(() => ({
  appKey: process.env.APP_KEY || 'change-me-in-production',
  http: { trustProxy: false },
  logger: { enabled: true },
}))
