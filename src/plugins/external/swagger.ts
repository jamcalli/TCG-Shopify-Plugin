import fastifySwagger from '@fastify/swagger'
import apiReference from '@scalar/fastify-api-reference'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

const createOpenapiConfig = (fastify: FastifyInstance) => {
  const urlObject = new URL(fastify.config.baseUrl)

  fastify.log.debug(
    { baseUrl: fastify.config.baseUrl, origin: urlObject.origin },
    'Configuring Swagger',
  )

  return {
    openapi: {
      info: {
        title: 'Pulsarr API',
        description:
          'API documentation for Pulsarr - a Plex watchlist integration for Sonarr and Radarr',
        version: 'V1',
      },
      servers: [
        {
          url: '{protocol}://{host}:{port}',
          description: 'Custom Server',
          variables: {
            protocol: {
              enum: ['http', 'https'],
              default: 'http',
              description: 'The protocol used to communicate with the server',
            },
            host: {
              default: 'localhost',
              description: 'The hostname or IP address of the Pulsarr server',
            },
            port: {
              default: fastify.config.port.toString(),
              description: 'The port on which Pulsarr is running',
            },
          },
        },
        {
          url: fastify.config.baseUrl,
          description: 'Primary Server',
        },
        {
          url: `${urlObject.protocol}//${urlObject.hostname}:${fastify.config.port}`,
          description: 'Direct Server Access (with port)',
        },
        {
          url: `http://localhost:${fastify.config.port}`,
          description: 'Localhost Access (with port)',
        },
      ],
      tags: [
        {
          name: 'API Keys',
          description: 'API key management endpoints',
        },
        {
          name: 'Approval',
          description: 'Content approval system endpoints',
        },
        {
          name: 'Authentication',
          description: 'Authentication and authorization endpoints',
        },
        {
          name: 'Config',
          description: 'Configuration management endpoints',
        },
        {
          name: 'Content Router',
          description: 'Content routing and rule management endpoints',
        },
        {
          name: 'Labels',
          description: 'Plex label synchronization and management endpoints',
        },
        {
          name: 'Logs',
          description: 'Log streaming and monitoring endpoints',
        },
        {
          name: 'Metadata',
          description: 'Metadata refresh and management endpoints',
        },
        {
          name: 'Models',
          description: 'Data models and schema definitions',
        },
        {
          name: 'Notifications',
          description: 'Notification system endpoints',
        },
        {
          name: 'Plex',
          description: 'Plex server integration endpoints',
        },
        {
          name: 'Progress',
          description: 'Operation progress tracking endpoints',
        },
        {
          name: 'Quota',
          description: 'User quota management endpoints',
        },
        {
          name: 'Radarr',
          description: 'Radarr integration endpoints',
        },
        {
          name: 'Scheduler',
          description: 'Job scheduling and management endpoints',
        },
        {
          name: 'Session Monitoring',
          description:
            'Plex session monitoring and rolling show management endpoints',
        },
        {
          name: 'Sonarr',
          description: 'Sonarr integration endpoints',
        },
        {
          name: 'Statistics',
          description: 'Analytics and statistics endpoints',
        },
        {
          name: 'Sync',
          description: 'Synchronization control endpoints',
        },
        {
          name: 'Tags',
          description: 'Tag management endpoints',
        },
        {
          name: 'Tautulli',
          description: 'Tautulli integration endpoints',
        },
        {
          name: 'TMDB',
          description: 'The Movie Database (TMDB) integration endpoints',
        },
        {
          name: 'Users',
          description: 'User management endpoints',
        },
        {
          name: 'Watchlist Workflow',
          description: 'Watchlist processing workflow endpoints',
        },
      ],
      components: {
        securitySchemes: {
          apiKeyAuth: {
            type: 'apiKey' as const,
            in: 'header' as const,
            name: 'X-API-Key',
            description: 'API key authentication using X-API-Key header',
          },
          sessionAuth: {
            type: 'apiKey' as const,
            in: 'cookie' as const,
            name: fastify.config.cookieName,
            description: 'Session-based authentication using cookies',
          },
        },
      },
      security: [
        { apiKeyAuth: [] as string[] },
        { sessionAuth: [] as string[] },
      ] as Array<Record<string, string[]>>,
    },
    hideUntagged: true,
    exposeRoute: true,
    transform: jsonSchemaTransform,
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    // Set up Zod validators
    fastify.setValidatorCompiler(validatorCompiler)
    fastify.setSerializerCompiler(serializerCompiler)

    /**
     * Register Swagger with combined config
     * @see {@link https://github.com/fastify/fastify-swagger}
     */
    await fastify.register(fastifySwagger, createOpenapiConfig(fastify))

    /**
     * Register Swagger UI
     * @see {@link https://github.com/fastify/fastify-swagger-ui}
     */
    await fastify.register(apiReference, {
      routePrefix: '/api/docs',
    })
  },
  {
    dependencies: ['config'],
  },
)
