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
      envName: 'BASE_URL',
    },
    port: {
      type: 'number',
      default: 3003,
      envName: 'PORT',
    },
    logLevel: {
      type: 'string',
      enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      envName: 'LOG_LEVEL',
    },
    closeGraceDelay: {
      type: 'number',
      default: 10000,
      envName: 'CLOSE_GRACE_DELAY',
    },
    rateLimitMax: {
      type: 'number',
      default: 500,
      envName: 'RATE_LIMIT_MAX',
    },

    // Database Configuration
    dbType: {
      type: 'string',
      enum: ['sqlite', 'postgres'],
      default: 'postgres',
      envName: 'DB_TYPE',
    },
    dbHost: {
      type: 'string',
      default: 'localhost',
      envName: 'DB_HOST',
    },
    dbPort: {
      type: 'number',
      default: 5432,
      envName: 'DB_PORT',
    },
    dbName: {
      type: 'string',
      default: 'tcg_shopify',
      envName: 'DB_NAME',
    },
    dbUser: {
      type: 'string',
      default: 'postgres',
      envName: 'DB_USER',
    },
    dbPassword: {
      type: 'string',
      default: '',
      envName: 'DB_PASSWORD',
    },
    dbConnectionString: {
      type: 'string',
      default: '',
      envName: 'DB_CONNECTION_STRING',
    },

    // Session Configuration
    cookieSecret: {
      type: 'string',
      default: generateSecret(),
      envName: 'COOKIE_SECRET',
    },
    cookieName: {
      type: 'string',
      default: 'tcg_session',
      envName: 'COOKIE_NAME',
    },
    cookieSecured: {
      type: 'boolean',
      default: false,
      envName: 'COOKIE_SECURED',
    },

    // Shopify Configuration
    shopifyApiKey: {
      type: 'string',
      default: '',
      envName: 'SHOPIFY_API_KEY',
    },
    shopifyClientSecret: {
      type: 'string',
      default: '',
      envName: 'SHOPIFY_CLIENT_SECRET',
    },
    shopifyHostName: {
      type: 'string',
      default: '',
      envName: 'SHOPIFY_HOST_NAME',
    },

    // Redis Configuration
    redisUrl: {
      type: 'string',
      default: '',
      envName: 'REDIS_URL',
    },
    redisHost: {
      type: 'string',
      default: 'localhost',
      envName: 'REDIS_HOST',
    },
    redisPort: {
      type: 'number',
      default: 6379,
      envName: 'REDIS_PORT',
    },
    redisPassword: {
      type: 'string',
      default: '',
      envName: 'REDIS_PASSWORD',
    },

    // Application Settings
    allowIframes: {
      type: 'boolean',
      default: true, // Enable for Shopify embedded apps
      envName: 'ALLOW_IFRAMES',
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

    // Validate Redis configuration for security and consistency
    const isUsingRedisUrl =
      parsedConfig.redisUrl && parsedConfig.redisUrl.trim() !== ''

    if (isUsingRedisUrl) {
      // Basic validation of Redis URL format
      const redisUrl = parsedConfig.redisUrl.trim()
      if (
        !redisUrl.startsWith('redis://') &&
        !redisUrl.startsWith('rediss://')
      ) {
        throw new Error(
          'Invalid Redis URL format. Must start with redis:// or rediss://',
        )
      }

      // Warn if individual Redis fields are also set (potential conflict)
      const hasIndividualFields =
        (parsedConfig.redisHost && parsedConfig.redisHost !== 'localhost') ||
        (parsedConfig.redisPort && parsedConfig.redisPort !== 6379) ||
        (parsedConfig.redisPassword && parsedConfig.redisPassword.trim() !== '')

      if (hasIndividualFields) {
        fastify.log.warn(
          'Both REDIS_URL and individual Redis connection fields are set. REDIS_URL will take precedence.',
        )
      }
    } else {
      // Using individual fields - validate host is set
      if (!parsedConfig.redisHost || parsedConfig.redisHost.trim() === '') {
        throw new Error('redisHost is required when not using REDIS_URL.')
      }

      if (parsedConfig.redisPort <= 0 || parsedConfig.redisPort > 65535) {
        throw new Error('redisPort must be a valid port number (1-65535).')
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
