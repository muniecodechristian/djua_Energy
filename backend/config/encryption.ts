import { configProvider } from '@adonisjs/core'
import { chacha20poly1305 } from '@boringnode/encryption/drivers/chacha20_poly1305'

export default configProvider.create(async () => ({
  default: 'app',
  list: {
    app: chacha20poly1305({
      id: 'app',
      keys: [process.env.APP_KEY || 'change-me-in-production-key-32-chars'],
    }),
  },
}))
