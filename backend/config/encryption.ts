import { configProvider } from '@adonisjs/core'
import { chacha20poly1305 } from '@boringnode/encryption/drivers/chacha20_poly1305'

export default configProvider.create(() => ({
  driver: chacha20poly1305,
  keys: [process.env.APP_KEY || 'change-me-in-production-key-32-chars'],
}))
