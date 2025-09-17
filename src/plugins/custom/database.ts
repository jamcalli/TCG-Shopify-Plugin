import type { Config } from '@root/types/config.types.js'
import { DatabaseService } from '@services/database.service.js'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseService
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    const dbService = await DatabaseService.create(fastify.log, fastify)
    fastify.decorate('db', dbService)
    fastify.addHook('onClose', async () => {
      fastify.log.info('Closing database service...')
      await dbService.close()
    })

    const isSetInEnvironment = (key: string): boolean => {
      return key in process.env
    }

    const initializeConfig = async () => {
      try {
        const dbConfig = await dbService.getConfig()
        const envConfig = { ...fastify.config } as Config

        if (dbConfig) {
          const parsedDbConfig = {
            ...dbConfig,
          }

          const mergedConfig = { ...parsedDbConfig } as Config

          for (const key of Object.keys(envConfig)) {
            if (isSetInEnvironment(key)) {
              const typedKey = key as keyof Config
              // biome-ignore lint/suspicious/noExplicitAny: This is a necessary type assertion for dynamic property access
              ;(mergedConfig as any)[key] = envConfig[typedKey]
              fastify.log.debug(`Using environment value for ${key}`)
            } else {
              fastify.log.debug(`Keeping database value for ${key}`)
            }
          }

          await fastify.updateConfig(mergedConfig)

          if (dbConfig._isReady) {
            fastify.log.debug('DB config was ready, updating ready state')
            await fastify.updateConfig({ _isReady: true })
          } else {
            fastify.log.debug('DB config was not ready')
          }
        } else {
          fastify.log.info('No existing config found, creating initial config')
          const initialConfig = {
            ...envConfig,
            _isReady: false,
          }
          fastify.log.debug('Creating initial config in database')
          await dbService.createConfig(initialConfig)
          await fastify.updateConfig({ _isReady: false })
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        fastify.log.error(err, 'Error initializing config')
        throw error
      }
    }

    try {
      await initializeConfig()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      fastify.log.error(err, 'Failed to initialize config')
      throw error
    }
  },
  {
    name: 'database',
    dependencies: ['config'],
  },
)
