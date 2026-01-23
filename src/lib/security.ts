import { differenceInHours } from 'date-fns'

export const BYPASS_PASSWORD = '16071997'

export function isRecordLocked(
  date: Date | string | undefined | null,
): boolean {
  if (!date) return false
  const recordDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  // Check if difference is 24 hours or more
  return Math.abs(differenceInHours(now, recordDate)) >= 24
}
