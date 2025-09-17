/**
 * Date serialization utilities
 *
 * Helper functions for consistent date serialization across API endpoints
 */

/**
 * Serializes a date value to an ISO 8601 string or returns the original string.
 *
 * If the input is a Date object, returns its ISO string representation. If the input is a string, returns it unchanged. Returns null if the input is null or undefined.
 *
 * @param date - The date value to serialize.
 * @returns The ISO 8601 string, the original string, or null.
 */
export function serializeDate(
  date: Date | string | null | undefined,
): string | null {
  if (!date) return null
  return typeof date === 'string' ? date : date.toISOString()
}
