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
  const { cookingTimeRecords, rawMaterials } = useData()
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
    // As per AC: "derived from the start_time of the most recent record... for the current day"
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

  const metrics = useMemo(() => {
    if (!activeProcess) {
      return {
        processedKg: 0,
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

    // Calculate consumption: (Elapsed Time in Hours) * 7.125
    // This represents the Total Processed Raw Material in real-time
    const processedTons = elapsedHours * FIXED_FLOW_RATE
    const processedKg = processedTons * 1000

    // Calculate Remaining: Starting Daily Quantity - Total Processed
    const remainingKg = totalDailyInputKg - processedKg

    // Format timer string HH:mm:ss
    const hh = Math.floor(elapsedSeconds / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((elapsedSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (elapsedSeconds % 60).toString().padStart(2, '0')

    return {
      processedKg,
      remainingKg,
      elapsedString: `${hh}:${mm}:${ss}`,
      isActive: true,
    }
  }, [activeProcess, now, totalDailyInputKg])

  // Formatting Logic based on Acceptance Criteria

  // 1. Main Value: Total Processed Raw Material
  // If value is between 0 and 999 -> unit kg
  // If value is 1,000 or above -> unit t (displayed as "t" for mass)
  let mainValue: string
  let mainUnit: string

  const processedDisplay = metrics.processedKg

  if (processedDisplay < 1000) {
    mainValue = processedDisplay.toFixed(0)
    mainUnit = 'kg'
  } else {
    // Convert to tons for display
    mainValue = (processedDisplay / 1000).toFixed(2)
    mainUnit = 't'
  }

  // 2. Remaining Quantity Metric (Sub-text)
  // If remaining quantity is between 0 and 999 -> kg
  // If remaining quantity is 1,000 or above -> t
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
          Produtividade (t/h)
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
            {mainUnit}
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
