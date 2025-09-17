import fastifyRedis from '@fastify/redis'
import type { FastifyInstance } from 'fastify'

/**
 * Plugin to register Redis client
 */
const redisPlugin = async (fastify: FastifyInstance) => {
  // Build Redis configuration
  const redisConfig = fastify.config.redisUrl
    ? { url: fastify.config.redisUrl }
    : {
        host: fastify.config.redisHost,
        port: fastify.config.redisPort,
        ...(fastify.config.redisPassword && {
          password: fastify.config.redisPassword,
        }),
      }

  // Register Redis plugin
  await fastify.register(fastifyRedis, redisConfig)

  // Log connection info without credentials
  const connectionInfo = fastify.config.redisUrl
    ? `URL connection (${new URL(fastify.config.redisUrl).host})`
    : `${fastify.config.redisHost}:${fastify.config.redisPort}`

  fastify.log.info({ connection: connectionInfo }, 'Redis plugin initialized')
}

// Configuration for autoload
redisPlugin.autoConfig = {
  name: 'redis',
  dependencies: ['env'], // Depends on environment configuration
}

export default redisPlugin
