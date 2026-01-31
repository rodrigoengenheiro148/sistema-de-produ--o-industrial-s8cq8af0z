import { differenceInHours, differenceInMinutes } from 'date-fns'

export const BYPASS_PASSWORD = '16071997'

/**
 * Checks if a record requires authentication to be modified.
 * Returns true if the record was created more than 5 minutes ago.
 */
export function shouldRequireAuth(
  createdAt: Date | string | undefined | null,
): boolean {
  if (!createdAt) return true // Treat records without timestamp as locked/legacy
  const createdDate =
    typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const now = new Date()
  return differenceInMinutes(now, createdDate) > 5
}

/**
 * Legacy logic: Checks if a record is locked based on the business date.
 * Returns true if the record date is more than 24 hours ago.
 * Kept for backward compatibility or different business rules.
 */
export function isRecordLocked(
  date: Date | string | undefined | null,
): boolean {
  if (!date) return false
  const recordDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  // Check if difference is 24 hours or more
  return Math.abs(differenceInHours(now, recordDate)) >= 24
}

/**
 * Checks if a record can be edited based on its creation timestamp.
 * Strictly allows editing only within 5 minutes of creation.
 */
export function canEditRecord(
  createdAt: Date | string | undefined | null,
): boolean {
  return !shouldRequireAuth(createdAt)
}
