import { z } from 'zod'

const LogLevelEnum = z.enum([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
])

export const ConfigSchema = z.object({
  // Server Configuration
  port: z.number().optional(),
  logLevel: LogLevelEnum.optional(),
  closeGraceDelay: z.number().optional(),
  rateLimitMax: z.number().optional(),

  // Database Configuration
  dbHost: z.string().optional(),
  dbPort: z.number().optional(),
  dbName: z.string().optional(),
  dbUser: z.string().optional(),
  dbPassword: z.string().optional(),
  databaseUrl: z.string().optional(),

  // Session Configuration
  cookieSecret: z.string().optional(),
  cookieName: z.string().optional(),
  cookieSecured: z.boolean().optional(),
  sessionSecret: z.string().optional(),

  // Shopify Configuration
  shopifyApiKey: z.string().optional(),
  shopifyClientSecret: z.string().optional(),
  shopifyHostName: z.string().optional(),

  // Redis Configuration
  redisUrl: z.string().optional(),
  redisHost: z.string().optional(),
  redisPort: z.number().optional(),
  redisPassword: z.string().optional(),

  // Application Settings
  _isReady: z.boolean().optional(),
})

export const ConfigResponseSchema = z.object({
  success: z.boolean(),
  config: ConfigSchema,
})

export const ConfigErrorSchema = z.object({
  error: z.string(),
})

export type Config = z.infer<typeof ConfigSchema>
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>
export type ConfigError = z.infer<typeof ConfigErrorSchema>
