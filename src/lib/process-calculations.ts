import { isSameDay, endOfDay } from 'date-fns'
import { CookingTimeRecord, DowntimeRecord, ProductionEntry } from '@/lib/types'

export interface DailyMetrics {
  activeMinutesArray: Int8Array
  rawActiveMinutes: number
  grossActiveMinutes: number
  netActiveMinutes: number
  netActiveHours: number
  totalConsumption: number
  totalDowntimeMinutes: number
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

  // New logic: Check if any record has totalHours set. If so, prefer that for Rate calculation.
  const recordsWithTotalHours = dayCooking.filter(
    (r) => r.totalHours !== undefined && r.totalHours !== null,
  )
  const hasTotalHoursInput = recordsWithTotalHours.length > 0

  let totalManualHours = 0

  if (hasTotalHoursInput) {
    totalManualHours = recordsWithTotalHours.reduce(
      (acc, curr) => acc + (curr.totalHours || 0),
      0,
    )
  }

  // Still populate array for legacy visualization if possible
  dayCooking.forEach((record) => {
    if (record.startTime) {
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
    }
  })

  // 1.5 Calculate Raw Active Minutes (Before Downtime)
  const rawActiveMinutesLegacy = activeMinutesArray.reduce((a, b) => a + b, 0)

  // 2. Subtract Timestamped Downtime
  const dayDowntime = downtimeRecords.filter((r) => {
    if (r.startTime) {
      return isSameDay(new Date(r.startTime), date)
    }
    return isSameDay(r.date, date)
  })

  let manualDowntimeMinutes = 0
  let timestampedDowntimeMinutes = 0 // Approximate overlap count

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
        if (i >= 0 && i < 1440) {
          if (activeMinutesArray[i] === 1) {
            activeMinutesArray[i] = 0
            // Only count as downtime deduction if it was active
            timestampedDowntimeMinutes++
          }
        }
      }
    } else {
      // Manual downtime (durationHours)
      manualDowntimeMinutes += record.durationHours * 60
    }
  })

  // 3. Calculate Totals
  const grossActiveMinutes = activeMinutesArray.reduce((a, b) => a + b, 0)

  let netActiveMinutes = 0
  let netActiveHours = 0

  if (hasTotalHoursInput) {
    // New calculation path: Directly use input hours as Net Hours
    // We treat 'totalHours' input as the effective working time
    netActiveHours = totalManualHours
    netActiveMinutes = totalManualHours * 60
  } else {
    // Legacy calculation path
    // Net minutes: Gross minus manual downtime (cannot be negative)
    netActiveMinutes = Math.max(0, grossActiveMinutes - manualDowntimeMinutes)
    netActiveHours = netActiveMinutes / 60
  }

  const totalDowntimeMinutes = hasTotalHoursInput
    ? manualDowntimeMinutes + timestampedDowntimeMinutes * 0 // If using total hours, downtime is implicit or separate logic
    : rawActiveMinutesLegacy - grossActiveMinutes + manualDowntimeMinutes

  // Calculate Total Production for Rate
  // Formula: (sebo + fco + farinheta) / total_hours
  const totalProduction = productionRecords
    .filter((p) => isSameDay(p.date, date))
    .reduce((acc, curr) => {
      return (
        acc +
        (curr.seboProduced || 0) +
        (curr.fcoProduced || 0) +
        (curr.farinhetaProduced || 0)
      )
    }, 0)

  // Rate calculations
  // New Requirement: Rate = Total Production (Output) / Net Active Hours
  const rateKg = netActiveHours > 0 ? totalProduction / netActiveHours : 0
  const rateTon = rateKg / 1000

  // Legacy consumption metric
  const totalConsumption = productionRecords
    .filter((p) => isSameDay(p.date, date))
    .reduce((acc, curr) => acc + (curr.mpUsed || 0), 0)

  return {
    activeMinutesArray,
    rawActiveMinutes: hasTotalHoursInput
      ? netActiveMinutes
      : rawActiveMinutesLegacy,
    grossActiveMinutes,
    netActiveMinutes,
    netActiveHours,
    totalConsumption, // kg (Input)
    totalDowntimeMinutes,
    rateKg,
    rateTon,
  }
}
