import { ApiVersion, shopifyApi } from '@shopify/shopify-api'
import { RedisSessionStorage } from '@shopify/shopify-app-session-storage-redis'
import '@shopify/shopify-api/adapters/node'
import type { FastifyInstance } from 'fastify'

/**
 * Plugin to register Shopify API client and session storage
 */
const shopifyPlugin = async (fastify: FastifyInstance) => {
  // Validate required Shopify configuration
  if (
    !fastify.config.shopifyApiKey ||
    fastify.config.shopifyApiKey.trim() === ''
  ) {
    throw new Error('SHOPIFY_API_KEY is required and cannot be empty')
  }
  if (
    !fastify.config.shopifyClientSecret ||
    fastify.config.shopifyClientSecret.trim() === ''
  ) {
    throw new Error('SHOPIFY_CLIENT_SECRET is required and cannot be empty')
  }
  if (
    !fastify.config.shopifyHostName ||
    fastify.config.shopifyHostName.trim() === ''
  ) {
    throw new Error('SHOPIFY_HOST_NAME is required and cannot be empty')
  }

  // Validate API key format (basic check)
  if (fastify.config.shopifyApiKey.length < 10) {
    throw new Error('SHOPIFY_API_KEY appears to be invalid (too short)')
  }
  if (fastify.config.shopifyClientSecret.length < 10) {
    throw new Error('SHOPIFY_CLIENT_SECRET appears to be invalid (too short)')
  }

  // Validate hostname format
  const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
  if (!hostnameRegex.test(fastify.config.shopifyHostName)) {
    throw new Error(
      'SHOPIFY_HOST_NAME must be a valid hostname (e.g., myapp.example.com)',
    )
  }

  // Create Redis session storage using same config as @fastify/redis
  const redisUrl =
    fastify.config.redisUrl ||
    `redis://${fastify.config.redisHost}:${fastify.config.redisPort}`

  const sessionStorage = new RedisSessionStorage(redisUrl)

  // Initialize Shopify API
  const shopify = shopifyApi({
    apiKey: fastify.config.shopifyApiKey,
    apiSecretKey: fastify.config.shopifyClientSecret,
    scopes: [
      'read_products',
      'write_products',
      'read_orders',
      'read_inventory',
    ],
    hostName: fastify.config.shopifyHostName,
    apiVersion: ApiVersion.January24,
    isEmbeddedApp: true,
    sessionStorage,
  })

  // Decorate Fastify instance
  fastify.decorate('shopify', shopify)
  fastify.decorate('shopifySessionStorage', sessionStorage)

  // Log initialization without exposing credentials
  fastify.log.info(
    {
      hostname: fastify.config.shopifyHostName,
      apiVersion: ApiVersion.January24,
      isEmbedded: true,
      scopes: [
        'read_products',
        'write_products',
        'read_orders',
        'read_inventory',
      ],
    },
    'Shopify API plugin initialized',
  )
}

// Configuration for autoload
shopifyPlugin.autoConfig = {
  name: 'shopify',
  dependencies: ['env', 'redis'], // Depends on environment and Redis
}

export default shopifyPlugin

// Type declarations
declare module 'fastify' {
  interface FastifyInstance {
    shopify: ReturnType<typeof shopifyApi>
    shopifySessionStorage: RedisSessionStorage
  }
}
