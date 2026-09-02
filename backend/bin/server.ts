import { createServer } from 'node:http'
import { Ignitor } from '@adonisjs/core'
import { initSocket } from '../app/services/socket_service.js'

const ignitor = new Ignitor(new URL('../', import.meta.url))

await ignitor.httpServer().start((handler) => {
  const server = createServer(handler)
  initSocket(server)
  return server
})
