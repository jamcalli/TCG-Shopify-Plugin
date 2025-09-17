import path, { resolve } from 'node:path'
import fastifyAutoload from '@fastify/autoload'
import FastifyFormBody from '@fastify/formbody'
import FastifyVite from '@fastify/vite'
import type { ErrorResponse } from '@root/schemas/common/error.schema.js'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'

export const options = {
  ajv: {
    customOptions: {
      coerceTypes: 'array',
      removeAdditional: 'all',
    },
  },
}

/**
 * Configures and initializes the Fastify server with plugin autoloading, SSR routing, and error handling.
 *
 * Loads external and custom plugins, registers route handlers, and integrates Vite for server-side rendering.
 * Implements global error and not-found handlers with logging and rate limiting.
 */
export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  // Basic setup
  fastify.register(FastifyFormBody)

  // Load external plugins
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/external'),
    options: {
      ...opts,
      timeout: 30000,
    },
  })

  // Load custom plugins
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'plugins/custom'),
    options: {
      ...opts,
      timeout: 30000,
    },
  })

  // Load routes
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    options: {
      ...opts,
      timeout: 30000,
    },
  })

  // Error handler
  fastify.setErrorHandler((err, request, reply) => {
    const statusCode = err.statusCode ?? 500
    // Avoid logging query/params to prevent leaking tokens/PII
    const logData = {
      err,
      request: {
        id: request.id,
        method: request.method,
        path: request.url.split('?')[0],
        route: request.routeOptions?.url,
      },
    }

    // Use appropriate log level based on status code
    if (statusCode === 401) {
      request.log.warn(logData, 'Authentication required')
    } else if (statusCode >= 500) {
      request.log.error(logData, 'Internal server error occurred')
    } else {
      request.log.warn(logData, 'Client error occurred')
    }
    reply.code(statusCode)
    const isServerError = statusCode >= 500
    const payload: ErrorResponse = {
      statusCode,
      code: err.code || 'GENERIC_ERROR',
      error: isServerError
        ? 'Internal Server Error'
        : 'error' in err && typeof err.error === 'string'
          ? err.error
          : 'Client Error',
      message: isServerError
        ? 'Internal Server Error'
        : err.message || 'An error occurred',
    }
    return payload
  })

  // 404 handler for API routes
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            id: request.id,
            method: request.method,
            path: request.url.split('?')[0],
            route: request.routeOptions?.url,
          },
        },
        'Resource not found',
      )
      reply.code(404)
      const response: ErrorResponse = {
        statusCode: 404,
        code: 'NOT_FOUND',
        error: 'Not Found',
        message: 'Resource not found',
      }
      return response
    },
  )

  // FastifyVite is the core of the app - register it at the end
  await fastify.register(FastifyVite, {
    root: resolve(import.meta.dirname, '../'),
    dev: process.argv.includes('--dev'),
    spa: true,
    distDir: 'dist/client',
  })

  await fastify.vite.ready()
}
