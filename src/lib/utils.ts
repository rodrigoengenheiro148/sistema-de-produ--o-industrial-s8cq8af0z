/* General utility functions (exposes cn and helper functions) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ProductionEntry } from '@/lib/types'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a production record is a Blood Meal record.
 * Used to filter out blood production from industrial yield calculations.
 */
export function isBloodRecord(record: ProductionEntry): boolean {
  return (
    record.bloodMealProduced > 0 ||
    (record.bloodMealBags !== undefined && record.bloodMealBags > 0)
  )
}

/**
 * Parses a date string (typically YYYY-MM-DD) into a Date object set to noon (12:00:00) local time.
 * This ensures that the date is stable and not affected by timezone offsets when displayed or compared.
 * It fixes issues where UTC midnight becomes previous day in Western timezones.
 */
export function parseAsLocalNoon(
  dateStr: string | Date | null | undefined,
): Date {
  if (!dateStr) return new Date()
  if (dateStr instanceof Date) return dateStr

  // Try to match YYYY-MM-DD
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [_, y, m, d] = match
    // Create date at 12:00:00 local time
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0)
  }

  // Fallback to standard parsing
  return new Date(dateStr)
}
