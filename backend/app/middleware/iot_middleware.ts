import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
export async function iotAuth({ request, response }: HttpContext, next: NextFn) {
  // Option recommandée : utilisation du module env d'AdonisJS pour un typage strict
  const isAuthRequired = process.env.IOT_AUTH_REQUIRED !== 'false'
  const apiKey = process.env.IOT_API_KEY

  if (isAuthRequired && apiKey && request.header('x-api-key') !== apiKey) {
    return response.unauthorized({ success: false, message: 'Invalid IoT API key' })
  }

  return next()
}