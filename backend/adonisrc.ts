import { defineConfig } from '@adonisjs/core/app'
export default defineConfig({
  commands: [],
  providers: [() => import('@adonisjs/core/providers/app_provider')],
  preloads: [() => import('./start/kernel.js'), () => import('./start/mqtt.js'), () => import('./start/routes.js')],
})
