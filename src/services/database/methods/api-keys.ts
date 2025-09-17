import { randomBytes } from 'node:crypto'
import type { ApiKey, ApiKeyCreate } from '@root/types/api-key.types.js'
import type { Auth } from '@schemas/auth/auth.js'
import type { DatabaseService } from '@services/database.service.js'

/**
 * Generates a cryptographically secure API key as a 32-byte base64url-encoded string.
 *
 * Format: 32 random bytes → base64url encoding → 43-character string
 * Example: "dGhpcyBpcyBhIHRlc3Qgc3RyaW5nIGZvciBhcGkga2V5cw"
 * Uniqueness: Cryptographically secure random generation with retry logic
 *
 * @returns A secure, 43-character base64url-encoded API key string
 */
function generateApiKey(): string {
  // Generate a secure random key
  return randomBytes(32).toString('base64url')
}

/**
 * Creates a new API key with the specified name and returns its details.
 *
 * Attempts to generate and insert a unique API key, retrying up to five times if a key collision occurs. Throws an error if a unique key cannot be created after the maximum retries or if another database error occurs.
 *
 * @param data - The API key creation details, including the name.
 * @returns The newly created API key object with id, name, key, creation timestamp, and active status.
 */
export async function createApiKey(
  this: DatabaseService,
  data: ApiKeyCreate,
): Promise<ApiKey> {
  // Resolve an admin user to own the API key
  const adminUser = await this.knex('admin_users')
    .where('role', 'admin')
    .orderBy('id', 'asc')
    .first()

  if (!adminUser) {
    throw new Error(
      'Cannot create API key: No admin user found. ' +
        'Please create an admin user first.',
    )
  }

  const targetUserId = adminUser.id

  const MAX_RETRIES = 5
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    const key = generateApiKey()

    try {
      const [apiKey] = await this.knex('api_keys')
        .insert({
          name: data.name,
          key: key,
          user_id: targetUserId, // Assign to discovered admin user
          is_active: true,
          created_at: this.timestamp,
        })
        .returning('*')

      return {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        user_id: apiKey.user_id,
        created_at: apiKey.created_at,
        is_active: Boolean(apiKey.is_active),
      }
    } catch (error) {
      // Handle unique constraint violations for both PostgreSQL and better-sqlite3
      const isUniqueViolation =
        // PostgreSQL: SQLSTATE 23505
        (error instanceof Error &&
          'code' in error &&
          error.code === '23505' &&
          'constraint' in error &&
          typeof error.constraint === 'string' &&
          error.constraint.includes('key')) ||
        // better-sqlite3: Error code SQLITE_CONSTRAINT_UNIQUE (19)
        (error instanceof Error &&
          'code' in error &&
          error.code === 'SQLITE_CONSTRAINT_UNIQUE') ||
        // better-sqlite3: Generic constraint error with UNIQUE in message
        (error instanceof Error &&
          'code' in error &&
          error.code === 'SQLITE_CONSTRAINT' &&
          error.message.includes('UNIQUE')) ||
        // Fallback: Check message for UNIQUE constraint failures
        (error instanceof Error &&
          error.message.includes('UNIQUE constraint failed'))

      if (isUniqueViolation) {
        attempt++
        if (attempt >= MAX_RETRIES) {
          throw new Error(
            'Failed to generate unique API key after multiple attempts',
          )
        }
        // Retry with a new key
        continue
      }
      // Re-throw other errors
      throw error
    }
  }

  throw new Error('Failed to create API key: Maximum retry attempts exceeded')
}

/**
 * Retrieves all active API keys from the database, ordered by creation date descending.
 *
 * @returns An array of active API key objects, each with a Boolean `is_active` property.
 */
export async function getApiKeys(this: DatabaseService): Promise<ApiKey[]> {
  const keys = await this.knex('api_keys')
    .select('id', 'name', 'key', 'user_id', 'created_at', 'is_active')
    .where('is_active', true)
    .orderBy('created_at', 'desc')

  return keys.map((key: ApiKey) => ({
    id: key.id,
    name: key.name,
    key: key.key,
    user_id: key.user_id,
    created_at: key.created_at,
    is_active: Boolean(key.is_active),
  }))
}

/**
 * Revokes an API key by setting its active status to false.
 *
 * @param id - The unique identifier of the API key to revoke
 * @returns True if the API key was found and deactivated; false if no matching key exists
 */
export async function revokeApiKey(
  this: DatabaseService,
  id: number,
): Promise<boolean> {
  const result = await this.knex('api_keys')
    .where('id', id)
    .update({ is_active: false })

  return result > 0
}

/**
 * Returns an array of all active API keys with user data (id, email, username, role) for caching.
 *
 * Queries the database for API keys marked as active and returns their key values with full user info.
 *
 * @returns An array of objects with key and user session data.
 */
export async function getActiveApiKeys(
  this: DatabaseService,
): Promise<Array<{ key: string; user: Auth }>> {
  const keys = await this.knex('api_keys')
    .select(
      'api_keys.key',
      'admin_users.id',
      'admin_users.email',
      'admin_users.username',
      'admin_users.role',
    )
    .join('admin_users', 'api_keys.user_id', 'admin_users.id')
    .where('api_keys.is_active', true)

  return keys.map(({ key, id, email, username, role }) => ({
    key,
    user: { id, email, username, role },
  }))
}
