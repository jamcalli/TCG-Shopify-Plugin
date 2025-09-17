import type { Config } from '@root/types/config.types.js'
import type { DatabaseService } from '@services/database.service.js'

/**
 * Retrieves the application configuration from the database.
 *
 * Fetches the configuration record with `id: 1` from the `configs` table.
 * Applies defaults and type conversions for the TCG application configuration.
 *
 * @returns The application configuration object if found, otherwise `undefined`.
 */
export async function getConfig(
  this: DatabaseService,
): Promise<Config | undefined> {
  const config = await this.knex('configs').where({ id: 1 }).first()
  if (!config) return undefined

  return {
    ...config,
    // Convert boolean fields
    cookieSecured: Boolean(config.cookieSecured),
    allowIframes: Boolean(config.allowIframes),
    _isReady: Boolean(config._isReady),
  }
}

/**
 * Creates a new configuration record in the database, enforcing that only one configuration entry exists.
 *
 * Throws an error if a configuration already exists. Returns the ID of the newly created configuration.
 *
 * @param config - The configuration data to insert, excluding `id`, `created_at`, and `updated_at`
 * @returns The ID of the newly created configuration
 */
export async function createConfig(
  this: DatabaseService,
  config: Omit<Config, 'id' | 'created_at' | 'updated_at'>,
): Promise<number> {
  const exists = await this.knex('configs').count('* as c').first()
  if (Number(exists?.c) > 0) {
    throw new Error('Configuration already exists – use updateConfig instead')
  }

  const result = await this.knex('configs')
    .insert({
      // Enforce single config row with id: 1
      id: 1,
      // Server Configuration
      baseUrl: config.baseUrl,
      port: config.port,
      logLevel: config.logLevel,
      closeGraceDelay: config.closeGraceDelay,
      rateLimitMax: config.rateLimitMax,
      // Database Configuration
      dbType: config.dbType,
      dbHost: config.dbHost,
      dbPort: config.dbPort,
      dbName: config.dbName,
      dbUser: config.dbUser,
      dbPassword: config.dbPassword,
      dbConnectionString: config.dbConnectionString,
      // Session Configuration
      cookieSecret: config.cookieSecret,
      cookieName: config.cookieName,
      cookieSecured: config.cookieSecured,
      // Application Settings
      allowIframes: config.allowIframes,
      // Ready state
      _isReady: config._isReady || false,
      // Timestamps
      created_at: this.timestamp,
      updated_at: this.timestamp,
    })
    .returning('id')

  const id = this.extractId(result)
  this.log.info(`Config created with ID: ${id}`)
  return id
}

// Define allowed mutable columns to prevent accidental database corruption
const ALLOWED_COLUMNS = new Set([
  // Server Configuration
  'baseUrl',
  'port',
  'logLevel',
  'closeGraceDelay',
  'rateLimitMax',

  // Database Configuration
  'dbType',
  'dbHost',
  'dbPort',
  'dbName',
  'dbUser',
  'dbPassword',
  'dbConnectionString',

  // Session Configuration
  'cookieSecret',
  'cookieName',
  'cookieSecured',

  // Application Settings
  'allowIframes',
  '_isReady',
])

// JSON columns that need special serialization handling
const JSON_COLUMNS = new Set<string>([
  // Currently no JSON columns for basic TCG app
])

/**
 * Updates the application configuration with the provided partial data.
 *
 * Only fields included in the allowed columns set are updated. JSON fields are automatically serialized. Returns `true` if the configuration was successfully updated, or `false` if no changes were made or an error occurred.
 *
 * @param config - Partial configuration data to update
 * @returns `true` if the configuration was updated, `false` otherwise
 */
export async function updateConfig(
  this: DatabaseService,
  config: Partial<Config>,
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: this.timestamp,
    }

    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined && ALLOWED_COLUMNS.has(key)) {
        if (JSON_COLUMNS.has(key)) {
          updateData[key] =
            value !== undefined && value !== null ? JSON.stringify(value) : null
        } else {
          updateData[key] = value
        }
      }
    }

    const updated = await this.knex('configs')
      .where({ id: 1 })
      .update(updateData)
    return updated > 0
  } catch (error) {
    this.log.error({ error }, 'Error updating config:')
    return false
  }
}
