export interface User {
  id: number
  name: string
  username: string
  email: string | null
  is_active: boolean
  is_admin: boolean
  created_at?: string
  updated_at?: string
}

export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace'
  | 'silent'

export interface Config {
  id: number

  // Server Configuration
  baseUrl: string
  port: number
  logLevel: LogLevel
  closeGraceDelay: number
  rateLimitMax: number

  // Database Configuration
  dbType: 'sqlite' | 'postgres'
  dbHost: string
  dbPort: number
  dbName: string
  dbUser: string
  dbPassword: string
  dbConnectionString: string

  // Session Configuration
  cookieSecret: string
  cookieName: string
  cookieSecured: boolean

  // Shopify Configuration
  shopifyApiKey: string
  shopifyClientSecret: string
  shopifyHostName: string

  // Redis Configuration
  redisUrl: string
  redisHost: string
  redisPort: number
  redisPassword: string

  // Application Settings
  allowIframes: boolean
  _isReady: boolean
}

export type RawConfig = {
  [K in keyof Config]: Config[K]
}
