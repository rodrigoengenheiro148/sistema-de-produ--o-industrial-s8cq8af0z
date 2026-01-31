import { useMemo, useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isSameDay, differenceInSeconds } from 'date-fns'

interface ProductivityCardProps {
  className?: string
}

export function ProductivityCard({ className }: ProductivityCardProps) {
  const { cookingTimeRecords, rawMaterials, downtimeRecords } = useData()
  const [now, setNow] = useState(new Date())

  // Fixed flow rate as per requirements (7.125 t/h)
  const FIXED_FLOW_RATE = 7.125

  // Update current time every second for the timer and real-time calculation
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // 1. Calculate Daily Raw Material Input (Starting Daily Quantity)
  const totalDailyInputKg = useMemo(() => {
    return rawMaterials
      .filter((r) => isSameDay(r.date, now))
      .reduce((acc, curr) => acc + curr.quantity, 0)
  }, [rawMaterials, now])

  // 2. Process Timing & Active Process
  const activeProcess = useMemo(() => {
    // Filter records for the current day
    const todaysRecords = cookingTimeRecords.filter((r) =>
      isSameDay(r.date, now),
    )

    // Sort by start time descending to get the latest
    // startTime is a string "HH:mm" or "HH:mm:ss"
    const sortedRecords = [...todaysRecords].sort((a, b) => {
      return b.startTime.localeCompare(a.startTime)
    })

    // Find the most recent record that is "open" (no endTime)
    const active = sortedRecords.find((r) => !r.endTime)

    if (!active) return null

    // Parse start time
    const [h, m, s] = active.startTime.split(':').map(Number)
    const startDate = new Date(active.date)
    startDate.setHours(h, m, s || 0, 0)

    // Safety check: if start date is in the future (should not happen), ignore
    if (startDate > now) return null

    return {
      ...active,
      startDateTime: startDate,
    }
  }, [cookingTimeRecords, now])

  // Calculate Total Daily Downtime to adjust effective processing
  const totalDowntimeHours = useMemo(() => {
    return downtimeRecords
      .filter((r) => isSameDay(r.date, now))
      .reduce((acc, curr) => acc + curr.durationHours, 0)
  }, [downtimeRecords, now])

  const metrics = useMemo(() => {
    if (!activeProcess) {
      return {
        rateValue: 0,
        rateUnit: 'kg/h',
        remainingKg: totalDailyInputKg,
        elapsedString: '00:00:00',
        isActive: false,
      }
    }

    const elapsedSeconds = Math.max(
      0,
      differenceInSeconds(now, activeProcess.startDateTime),
    )
    const elapsedHours = elapsedSeconds / 3600

    // Effective Process Time = Elapsed Time - Downtime
    // This allows the rate to vary based on efficiency/downtime
    const effectiveHours = Math.max(0, elapsedHours - totalDowntimeHours)

    // Calculate consumption: (Effective Time in Hours) * 7.125
    let processedTons = effectiveHours * FIXED_FLOW_RATE
    let processedKg = processedTons * 1000

    // Clamp processed amount to Total Input (cannot process more than available)
    if (processedKg > totalDailyInputKg) {
      processedKg = totalDailyInputKg
      processedTons = processedKg / 1000
    }

    // Calculate Remaining: Total Raw Material - Processed Raw Material
    const remainingKg = totalDailyInputKg - processedKg

    // Calculate Productivity Rate (Throughput)
    // Formula: (Total Raw Material - Remaining Raw Material) / (Elapsed Time in Hours)
    // This equals: Processed / Elapsed Time
    // We use elapsedHours (Wall Time) for the denominator to reflect true throughput
    const rateTonsPerHour = elapsedHours > 0 ? processedTons / elapsedHours : 0
    const rateKgPerHour = rateTonsPerHour * 1000

    // Determine Units based on Rate
    let rateValue: number
    let rateUnit: string

    if (rateKgPerHour < 1000) {
      rateValue = rateKgPerHour
      rateUnit = 'kg/h'
    } else {
      rateValue = rateTonsPerHour
      rateUnit = 't/h'
    }

    // Format timer string HH:mm:ss
    const hh = Math.floor(elapsedSeconds / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((elapsedSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (elapsedSeconds % 60).toString().padStart(2, '0')

    return {
      rateValue,
      rateUnit,
      remainingKg,
      elapsedString: `${hh}:${mm}:${ss}`,
      isActive: true,
    }
  }, [activeProcess, now, totalDailyInputKg, totalDowntimeHours])

  // Formatting Logic based on Acceptance Criteria

  // 1. Main Value: Processing Rate
  let mainValue: string

  if (metrics.rateUnit === 'kg/h') {
    // Integer for kg/h
    mainValue = metrics.rateValue.toFixed(0)
  } else {
    // 2 decimal places for t/h
    mainValue = metrics.rateValue.toFixed(2)
  }

  // 2. Remaining Quantity Metric (Sub-text)
  // Displayed as Mass (kg or t)
  let remainingValue: string
  let remainingUnit: string

  const remainingKgAbs = Math.abs(metrics.remainingKg)
  const isNegative = metrics.remainingKg < 0

  if (remainingKgAbs < 1000) {
    remainingValue = remainingKgAbs.toFixed(0)
    remainingUnit = 'kg'
  } else {
    remainingValue = (remainingKgAbs / 1000).toFixed(2)
    remainingUnit = 't'
  }

  // Format: "Restante: [Value][Unit]" (e.g. "Restante: 55.90t")
  const remainingString = `Restante: ${isNegative ? '-' : ''}${remainingValue}${remainingUnit}`

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Produtividade
        </CardTitle>
        <Activity
          className={cn(
            'h-4 w-4',
            metrics.isActive ? 'text-blue-500' : 'text-muted-foreground',
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-baseline gap-1">
          {mainValue}{' '}
          <span className="text-sm font-medium text-muted-foreground">
            {metrics.rateUnit}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <p className="text-xs text-muted-foreground">{remainingString}</p>

          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/30 w-fit px-1.5 py-0.5 rounded">
            <Clock className="h-3 w-3" />
            {metrics.elapsedString}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
