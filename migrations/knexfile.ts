import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import type { Knex } from 'knex'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

// Load environment variables before anything else
dotenv.config({ path: resolve(projectRoot, '.env') })

// Build PostgreSQL connection configuration
const getPostgresConnection = () => {
  // If connection string is provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Parse and validate port number
  const port = Number.parseInt(process.env.DB_PORT || '5432', 10)
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error('Invalid database port number')
  }

  // Otherwise, build from individual components
  return {
    host: process.env.DB_HOST || 'localhost',
    port,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || 'tcg_shopify',
  }
}

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: getPostgresConnection(),
    migrations: {
      directory: resolve(__dirname, 'migrations'),
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    client: 'pg',
    connection: getPostgresConnection(),
    migrations: {
      directory: resolve(__dirname, 'migrations'),
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
}

export default config
