import crypto from 'node:crypto'
import env from '@fastify/env'
import type { Config, RawConfig } from '@root/types/config.types.js'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

const generateSecret = () => crypto.randomBytes(32).toString('hex')

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    updateConfig(config: Partial<Config>): Promise<Config>
    waitForConfig(): Promise<void>
  }
}

const schema = {
  type: 'object',
  required: ['port'],
  properties: {
    // Server Configuration
    baseUrl: {
      type: 'string',
      default: 'http://localhost',
    },
    port: {
      type: 'number',
      default: 3003,
    },
    logLevel: {
      type: 'string',
      enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
    },
    closeGraceDelay: {
      type: 'number',
      default: 10000,
    },
    rateLimitMax: {
      type: 'number',
      default: 500,
    },

    // Database Configuration
    dbType: {
      type: 'string',
      enum: ['sqlite', 'postgres'],
      default: 'postgres',
    },
    dbHost: {
      type: 'string',
      default: 'localhost',
    },
    dbPort: {
      type: 'number',
      default: 5432,
    },
    dbName: {
      type: 'string',
      default: 'tcg_shopify',
    },
    dbUser: {
      type: 'string',
      default: 'postgres',
    },
    dbPassword: {
      type: 'string',
      default: '',
    },
    dbConnectionString: {
      type: 'string',
      default: '',
    },

    // Session Configuration
    cookieSecret: {
      type: 'string',
      default: generateSecret(),
    },
    cookieName: {
      type: 'string',
      default: 'tcg_session',
    },
    cookieSecured: {
      type: 'boolean',
      default: false,
    },

    // Application Settings
    allowIframes: {
      type: 'boolean',
      default: false,
    },
  },
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    updateConfig(config: Partial<Config>): Promise<Config>
    waitForConfig(): Promise<void>
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    let resolveReady: (() => void) | null = null
    const readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve
    })

    await fastify.register(env, {
      confKey: 'config',
      schema,
      dotenv: {
        path: './.env',
        debug: process.env.NODE_ENV === 'development',
      },
      data: process.env,
    })

    const rawConfig = fastify.config as unknown as RawConfig

    const parsedConfig = {
      ...rawConfig,
      _isReady: false,
    }

    // Validate PostgreSQL configuration for security
    if (parsedConfig.dbType === 'postgres') {
      const isUsingConnectionString =
        parsedConfig.dbConnectionString &&
        parsedConfig.dbConnectionString.trim() !== ''

      if (isUsingConnectionString) {
        // Basic validation of connection string format
        const connStr = parsedConfig.dbConnectionString.trim()
        if (
          !connStr.startsWith('postgres://') &&
          !connStr.startsWith('postgresql://')
        ) {
          throw new Error(
            'Invalid PostgreSQL connection string format. Must start with postgres:// or postgresql://',
          )
        }
      }

      if (!isUsingConnectionString) {
        // Validate individual connection parameters
        if (!parsedConfig.dbPassword || parsedConfig.dbPassword.trim() === '') {
          fastify.log.warn(
            'PostgreSQL database selected but no password provided. Consider setting DB_PASSWORD environment variable.',
          )
        }

        if (!parsedConfig.dbHost || parsedConfig.dbHost.trim() === '') {
          throw new Error('dbHost is required when using PostgreSQL.')
        }

        if (!parsedConfig.dbName || parsedConfig.dbName.trim() === '') {
          throw new Error('dbName is required when using PostgreSQL.')
        }

        if (!parsedConfig.dbUser || parsedConfig.dbUser.trim() === '') {
          throw new Error('dbUser is required when using PostgreSQL.')
        }
      }
    }

    fastify.config = parsedConfig as Config

    fastify.decorate('updateConfig', async (newConfig: Partial<Config>) => {
      const updatedConfig = { ...fastify.config, ...newConfig }

      if (newConfig._isReady === true && resolveReady) {
        fastify.log.info('Config is now ready, resolving waitForConfig promise')
        resolveReady()
        resolveReady = null
      }

      fastify.config = updatedConfig

      return updatedConfig
    })

    fastify.decorate('waitForConfig', () => {
      if (fastify.config._isReady) {
        return Promise.resolve()
      }
      return readyPromise
    })
  },
  {
    name: 'config',
  },
)
