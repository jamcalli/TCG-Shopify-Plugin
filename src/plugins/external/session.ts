import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import type { Auth } from '@schemas/auth/auth.js'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface Session {
    user: Auth
  }
}

/**
 * This plugins enables the use of session.
 *
 * @see {@link https://github.com/fastify/session}
 */
export default fp(
  async (fastify) => {
    fastify.register(fastifyCookie)
    fastify.register(fastifySession, {
      secret: fastify.config.cookieSecret,
      cookieName: fastify.config.cookieName,
      cookie: {
        secure: fastify.config.cookieSecured,
        httpOnly: true,
        maxAge: 604800000,
      },
    })
  },
  {
    name: 'session',
  },
)
