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
  const { cookingTimeRecords, rawMaterials, currentFactoryId } = useData()
  const [now, setNow] = useState(new Date())

  // Fixed flow rate as per requirements (7.125 t/h)
  const FIXED_FLOW_RATE = 7.125
  const FIXED_FLOW_RATE_KG = FIXED_FLOW_RATE * 1000

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
    // We prioritize the active one.
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
        rateTph: 0,
        rateKph: 0,
        remainingKg: totalDailyInputKg,
        elapsedString: '00:00:00',
        isActive: false,
      }
    }

    const secondsDiff = Math.max(
      0,
      differenceInSeconds(now, activeProcess.startDateTime),
    )
    const hoursDiff = secondsDiff / 3600

    // Calculate consumption: (Elapsed Time in Hours) * 7.125
    // Formula: Remaining = Starting Daily Quantity - (7.125 t/h * elapsed_hours)
    const consumedTons = hoursDiff * FIXED_FLOW_RATE
    const consumedKg = consumedTons * 1000
    const remainingKg = totalDailyInputKg - consumedKg

    // Format timer string HH:mm:ss
    const hh = Math.floor(secondsDiff / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((secondsDiff % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (secondsDiff % 60).toString().padStart(2, '0')

    return {
      rateTph: FIXED_FLOW_RATE,
      rateKph: FIXED_FLOW_RATE_KG,
      remainingKg,
      elapsedString: `${hh}:${mm}:${ss}`,
      isActive: true,
    }
  }, [activeProcess, now, totalDailyInputKg])

  // Formatting Logic based on Acceptance Criteria

  // 1. Productivity Rate Metric (Main Value)
  // If consumption rate is between 0 and 999 -> unit kg/h
  // If consumption rate is 1,000 or above -> unit t/h
  let mainValue: string
  let mainUnit: string

  const rateToDisplay = metrics.isActive ? metrics.rateKph : 0

  if (rateToDisplay < 1000) {
    mainValue = rateToDisplay.toFixed(2)
    mainUnit = 'kg/h'
  } else {
    // Convert to tons for display
    mainValue = (rateToDisplay / 1000).toFixed(2)
    mainUnit = 't/h'
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
    remainingValue = (remainingKgAbs / 1000).toFixed(2) // usually 1 decimal place is good for subtext but let's match precision
    remainingUnit = 't'
  }

  const remainingString = `${isNegative ? '-' : ''}${remainingValue}${remainingUnit}`

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
          <p className="text-xs text-muted-foreground">
            Restante: {remainingString}
          </p>

          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/30 w-fit px-1.5 py-0.5 rounded">
            <Clock className="h-3 w-3" />
            {metrics.elapsedString}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
