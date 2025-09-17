import type { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    const publicPaths = ['/api/docs', '/favicon.ico']

    // Skip authentication for public paths
    if (publicPaths.some((path) => request.url.startsWith(path))) {
      return
    }

    // Check for API key authentication first
    const apiKey = request.headers['x-api-key'] as string
    if (apiKey) {
      try {
        await new Promise<void>((resolve, reject) => {
          fastify.verifyApiKey(request, reply, (err) => {
            if (err) reject(err)
            else resolve()
          })
        })
        // Valid API key, allow access
        return
      } catch (_err) {
        // Invalid API key
        return reply.unauthorized('Invalid API key')
      }
    }

    // Regular session authentication check
    if (!request.session.user) {
      return reply.unauthorized(
        'You must be authenticated to access this route.',
      )
    }
  })
}
