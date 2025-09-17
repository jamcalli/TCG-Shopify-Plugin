import {
  ConfigErrorSchema,
  ConfigResponseSchema,
  ConfigSchema,
} from '@root/schemas/config/config.schema.js'
import { logRouteError } from '@utils/route-errors.js'
import type { FastifyPluginAsync } from 'fastify'
import type { z } from 'zod'

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply:
      | z.infer<typeof ConfigResponseSchema>
      | z.infer<typeof ConfigErrorSchema>
  }>(
    '/config',
    {
      schema: {
        summary: 'Get configuration',
        operationId: 'getConfig',
        description: 'Retrieve the current application configuration settings',
        response: {
          200: ConfigResponseSchema,
          400: ConfigErrorSchema,
          404: ConfigErrorSchema,
          500: ConfigErrorSchema,
        },
        tags: ['Config'],
      },
    },
    async (request, reply) => {
      try {
        const config = await fastify.db.getConfig()
        if (!config) {
          return reply.notFound('Config not found in database')
        }

        const mergedConfig = config

        const response: z.infer<typeof ConfigResponseSchema> = {
          success: true,
          config: mergedConfig,
        }

        reply.status(200)
        return response
      } catch (err) {
        if (err instanceof Error && 'statusCode' in err) {
          // Use proper error format to match the schema
          reply.status(err.statusCode as number)
          return { error: err.message || 'Error fetching configuration' }
        }

        logRouteError(fastify.log, request, err, {
          message: 'Failed to fetch configuration',
        })
        reply.status(500)
        return { error: 'Unable to fetch configuration' }
      }
    },
  )

  // Updated PUT handler for /config route to avoid race conditions
  fastify.put<{
    Body: z.infer<typeof ConfigSchema>
    Reply:
      | z.infer<typeof ConfigResponseSchema>
      | z.infer<typeof ConfigErrorSchema>
  }>(
    '/config',
    {
      schema: {
        summary: 'Update configuration',
        operationId: 'updateConfig',
        description: 'Update the application configuration settings',
        body: ConfigSchema,
        response: {
          200: ConfigResponseSchema,
          400: ConfigErrorSchema,
          404: ConfigErrorSchema,
          500: ConfigErrorSchema,
        },
        tags: ['Config'],
      },
    },
    async (request, reply) => {
      try {
        const safeConfigUpdate = request.body

        // Store current runtime values for revert if needed
        const originalRuntimeValues = { ...safeConfigUpdate }
        for (const key of Object.keys(originalRuntimeValues)) {
          // biome-ignore lint/suspicious/noExplicitAny: This is a necessary type assertion for dynamic property access
          ;(originalRuntimeValues as any)[key] = (fastify.config as any)[key]
        }

        // First update the runtime config
        try {
          await fastify.updateConfig(safeConfigUpdate)
        } catch (configUpdateError) {
          logRouteError(fastify.log, request, configUpdateError, {
            message: 'Failed to update runtime configuration',
          })
          reply.status(400)
          return { error: 'Failed to update runtime configuration' }
        }

        // Now update the database
        const dbUpdated = await fastify.db.updateConfig(safeConfigUpdate)
        if (!dbUpdated) {
          // Revert runtime config using stored values
          try {
            await fastify.updateConfig(originalRuntimeValues)
          } catch (revertError) {
            logRouteError(fastify.log, request, revertError, {
              message: 'Failed to revert runtime configuration',
            })
          }
          reply.status(400)
          return { error: 'Failed to update configuration in database' }
        }

        const savedConfig = await fastify.db.getConfig()
        if (!savedConfig) {
          reply.status(404)
          return { error: 'No configuration found after update' }
        }

        // Apply runtime log level now that DB is authoritative
        if (
          'logLevel' in safeConfigUpdate &&
          savedConfig.logLevel &&
          fastify.log.level !== savedConfig.logLevel
        ) {
          fastify.log.info(
            `Updating runtime log level to: ${savedConfig.logLevel}`,
          )
          fastify.log.level = savedConfig.logLevel
        }

        const mergedConfig = savedConfig

        const response: z.infer<typeof ConfigResponseSchema> = {
          success: true,
          config: mergedConfig,
        }

        reply.status(200)
        return response
      } catch (err) {
        if (err instanceof Error && 'statusCode' in err) {
          // Use proper error format to match the schema
          reply.status(err.statusCode as number)
          return { error: err.message || 'Error updating configuration' }
        }
        logRouteError(fastify.log, request, err, {
          message: 'Failed to update configuration',
        })
        reply.status(500)
        return { error: 'Unable to update configuration' }
      }
    },
  )
}

export default plugin
