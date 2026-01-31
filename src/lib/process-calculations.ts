import { isSameDay, endOfDay } from 'date-fns'
import { CookingTimeRecord, DowntimeRecord, ProductionEntry } from '@/lib/types'

export interface DailyMetrics {
  activeMinutesArray: Int8Array
  grossActiveMinutes: number
  netActiveMinutes: number
  netActiveHours: number
  totalConsumption: number
  rateKg: number
  rateTon: number
}

export function calculateDailyMetrics(
  date: Date,
  cookingRecords: CookingTimeRecord[],
  downtimeRecords: DowntimeRecord[],
  productionRecords: ProductionEntry[],
  now: Date = new Date(),
): DailyMetrics {
  // 1. Calculate Active Minutes Array (0-1439) representing Cooking Status
  const activeMinutesArray = new Int8Array(1440).fill(0)

  // Filter records for the day
  const dayCooking = cookingRecords.filter((r) => isSameDay(r.date, date))

  dayCooking.forEach((record) => {
    const [startH, startM] = record.startTime.split(':').map(Number)
    let startMin = startH * 60 + startM

    let endMin = 24 * 60
    if (record.endTime) {
      const [endH, endM] = record.endTime.split(':').map(Number)
      endMin = endH * 60 + endM
      // Handle overnight shifts by clamping to end of day for this visualization
      if (endMin < startMin) endMin = 24 * 60
    } else {
      // If active and today, clamp to now
      if (isSameDay(date, now)) {
        endMin = now.getHours() * 60 + now.getMinutes()
      }
    }

    // Clamp to day boundaries
    startMin = Math.max(0, Math.min(1440, startMin))
    endMin = Math.max(0, Math.min(1440, endMin))

    for (let i = startMin; i < endMin; i++) {
      activeMinutesArray[i] = 1
    }
  })

  // 2. Subtract Timestamped Downtime
  const dayDowntime = downtimeRecords.filter((r) => {
    if (r.startTime) {
      return isSameDay(new Date(r.startTime), date)
    }
    return isSameDay(r.date, date)
  })

  let manualDowntimeMinutes = 0

  dayDowntime.forEach((record) => {
    if (record.startTime) {
      const start = new Date(record.startTime)
      const end = record.endTime
        ? new Date(record.endTime)
        : isSameDay(date, now)
          ? now
          : endOfDay(date)

      const startMin = start.getHours() * 60 + start.getMinutes()
      let endMin = end.getHours() * 60 + end.getMinutes()

      if (endMin < startMin) endMin = 24 * 60

      for (let i = startMin; i < endMin; i++) {
        if (i >= 0 && i < 1440) activeMinutesArray[i] = 0
      }
    } else {
      // Manual downtime (durationHours)
      manualDowntimeMinutes += record.durationHours * 60
    }
  })

  // 3. Calculate Totals
  // Gross minutes: Actual minutes marked as active in the array (excludes timestamped downtime)
  const grossActiveMinutes = activeMinutesArray.reduce((a, b) => a + b, 0)

  // Net minutes: Gross minus manual downtime (cannot be negative)
  const netActiveMinutes = Math.max(
    0,
    grossActiveMinutes - manualDowntimeMinutes,
  )
  const netActiveHours = netActiveMinutes / 60

  const totalConsumption = productionRecords
    .filter((p) => isSameDay(p.date, date))
    .reduce((acc, curr) => acc + (curr.mpUsed || 0), 0)

  // Rate calculations
  // Rate = Total Consumption / Net Active Hours
  const rateKg = netActiveHours > 0 ? totalConsumption / netActiveHours : 0
  const rateTon = rateKg / 1000

  return {
    activeMinutesArray,
    grossActiveMinutes,
    netActiveMinutes,
    netActiveHours,
    totalConsumption, // kg
    rateKg,
    rateTon,
  }
}
