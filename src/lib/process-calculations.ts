import { CookingTimeRecord, DowntimeRecord, ProductionEntry } from '@/lib/types'
import { format } from 'date-fns'

export interface ProcessBatch {
  id: string
  start_time: string
  end_time?: string | null
  raw_material_weight?: number
  product_weight?: number
  status?: string
}

// 0.55 tons per minute * 60 minutes = 33 tons per hour
export const TARGET_HOURLY_RATE = 33

export interface DailyMetrics {
  totalConsumption: number
  totalProduced: number
  netActiveMinutes: number
  netActiveHours: number
  totalDowntimeMinutes: number
  rateTon: number
  yieldPercentage: number
  targetHourlyRate: number
  productionCapacity: number // Estimated production in Tons based on active hours
  // Legacy fields for backward compatibility
  totalProcessed?: number
  cookingTimeMinutes?: number
  throughput?: number
}

export function calculateDailyMetrics(
  date: Date,
  cookingTimeRecords: CookingTimeRecord[] = [],
  downtimeRecords: DowntimeRecord[] = [],
  productionRecords: ProductionEntry[] = [],
): DailyMetrics {
  // Defensive checks to ensure arrays are valid
  const safeCooking = Array.isArray(cookingTimeRecords)
    ? cookingTimeRecords
    : []
  const safeDowntime = Array.isArray(downtimeRecords) ? downtimeRecords : []
  const safeProduction = Array.isArray(productionRecords)
    ? productionRecords
    : []

  // Ensure date is valid
  const targetDate = date instanceof Date ? date : new Date()
  const targetDateStr = format(targetDate, 'yyyy-MM-dd')

  // Helper to check if record matches the target date
  const isSameDay = (d: Date | string) => {
    try {
      if (!d) return false
      const dateObj = d instanceof Date ? d : new Date(d)
      if (isNaN(dateObj.getTime())) return false
      return format(dateObj, 'yyyy-MM-dd') === targetDateStr
    } catch {
      return false
    }
  }

  // Filter records for the specific date
  const dailyCooking = safeCooking.filter((r) => isSameDay(r.date))
  const dailyDowntime = safeDowntime.filter((r) => isSameDay(r.date))
  const dailyProduction = safeProduction.filter((r) => isSameDay(r.date))

  // Calculate Totals
  const totalConsumption = dailyProduction.reduce(
    (sum, p) => sum + (Number(p.mpUsed) || 0),
    0,
  )

  const totalProduced = dailyProduction.reduce(
    (sum, p) =>
      sum +
      (Number(p.seboProduced) || 0) +
      (Number(p.fcoProduced) || 0) +
      (Number(p.farinhetaProduced) || 0),
    0,
  )

  // Calculate Time Metrics
  // Assuming totalHours in CookingTimeRecord represents the Net Active Time (Production Time)
  const netActiveHours = dailyCooking.reduce(
    (sum, c) => sum + (Number(c.totalHours) || 0),
    0,
  )
  const netActiveMinutes = netActiveHours * 60

  const totalDowntimeHours = dailyDowntime.reduce(
    (sum, d) => sum + (Number(d.durationHours) || 0),
    0,
  )
  const totalDowntimeMinutes = totalDowntimeHours * 60

  // Throughput (Ton/Hour) = (Total Consumption in Tons) / Net Active Hours
  const rateTon =
    netActiveHours > 0 ? totalConsumption / 1000 / netActiveHours : 0

  // Yield Percentage = (Total Produced / Total Consumption) * 100
  const yieldPercentage =
    totalConsumption > 0 ? (totalProduced / totalConsumption) * 100 : 0

  // Production Estimate based on Constant Rate
  const productionCapacity = netActiveHours * TARGET_HOURLY_RATE

  return {
    totalConsumption,
    totalProduced,
    netActiveMinutes,
    netActiveHours,
    totalDowntimeMinutes,
    rateTon,
    yieldPercentage,
    targetHourlyRate: TARGET_HOURLY_RATE,
    productionCapacity,
    // Mapping for legacy support if needed
    totalProcessed: totalConsumption,
    cookingTimeMinutes: netActiveMinutes,
    throughput: rateTon,
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes && minutes !== 0) return '0h 00m'
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  return `${hours}h ${mins.toString().padStart(2, '0')}m`
}
