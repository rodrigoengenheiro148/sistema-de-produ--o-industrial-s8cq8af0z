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
