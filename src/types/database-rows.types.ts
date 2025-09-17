/**
 * Database row types for table records
 * These types represent the raw database schema with snake_case field names
 */

/**
 * Common database row interface for tables with timestamps
 */
export interface BaseRow {
  id: number
  created_at: string
  updated_at: string
}

/**
 * User row interface
 */
export interface UserRow extends BaseRow {
  username: string
  email: string | null
  password_hash: string | null
  is_active: boolean | number
  is_admin: boolean | number
}

/**
 * API key row interface
 */
export interface ApiKeyRow extends BaseRow {
  key_hash: string
  name: string
  user_id: number | null
  is_active: boolean | number
  last_used_at: string | null
}
