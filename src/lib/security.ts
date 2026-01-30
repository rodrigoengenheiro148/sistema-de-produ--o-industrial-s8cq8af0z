import { differenceInHours, differenceInMinutes } from 'date-fns'

export const BYPASS_PASSWORD = '16071997'

/**
 * Checks if a record is locked based on the business date (legacy logic).
 * Returns true if the record date is more than 24 hours ago.
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
  if (!createdAt) return false
  const createdDate =
    typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const now = new Date()
  // Allow editing only if created within the last 5 minutes
  return differenceInMinutes(now, createdDate) <= 5
}
