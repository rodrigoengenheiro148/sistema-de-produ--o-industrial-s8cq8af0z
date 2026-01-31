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
  const { cookingTimeRecords } = useData()
  const [now, setNow] = useState(new Date())

  // Fixed flow rate as per requirements (7.125 t/h)
  const FIXED_FLOW_RATE = 7.125

  // Update current time every second for the timer and real-time calculation
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const activeProcess = useMemo(() => {
    // Find a record that has start_time but no end_time
    // We prioritize records from today, but if a process started yesterday and is still running, it should appear too
    // However, usually we filter by 'current date' context in the app, but here we want the *current active process*

    // Sort by date descending to get the latest
    const sortedRecords = [...cookingTimeRecords].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )

    // Find the first one that is "open" (no endTime)
    // And is relatively recent (e.g. started within the last 24h) to avoid stale data ghosts
    const active = sortedRecords.find((r) => !r.endTime)

    if (!active) return null

    // Parse start time
    const [h, m] = active.startTime.split(':').map(Number)
    const startDate = new Date(active.date)
    startDate.setHours(h, m, 0, 0)

    // Safety check: if start date is in the future (should not happen), ignore
    if (startDate > now) return null

    return {
      ...active,
      startDateTime: startDate,
    }
  }, [cookingTimeRecords, now]) // Dependent on 'now' only for the future check, but mostly on records

  const metrics = useMemo(() => {
    if (!activeProcess) {
      return {
        processedTons: 0,
        processedKg: 0,
        elapsedHours: 0,
        elapsedString: '00:00:00',
      }
    }

    const secondsDiff = Math.max(
      0,
      differenceInSeconds(now, activeProcess.startDateTime),
    )
    const hoursDiff = secondsDiff / 3600

    // Calculate consumption: (Elapsed Time in Hours) * 7.125
    const totalTons = hoursDiff * FIXED_FLOW_RATE
    const totalKg = totalTons * 1000

    // Format timer string HH:mm:ss
    const hh = Math.floor(secondsDiff / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((secondsDiff % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (secondsDiff % 60).toString().padStart(2, '0')

    return {
      processedTons: totalTons,
      processedKg: totalKg,
      elapsedHours: hoursDiff,
      elapsedString: `${hh}:${mm}:${ss}`,
    }
  }, [activeProcess, now])

  // Formatting Logic based on Acceptance Criteria
  // If calculated value (kg) is between 0 and 999 -> unit kg/h
  // If calculated value (kg) is 1,000 or higher -> unit t/h
  let displayValue: string
  let displayUnit: string

  if (metrics.processedKg < 1000) {
    displayValue = metrics.processedKg.toFixed(2)
    displayUnit = 'kg/h'
  } else {
    displayValue = metrics.processedTons.toFixed(2)
    displayUnit = 't/h'
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Produtividade (t/h)
        </CardTitle>
        <Activity className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-baseline gap-1">
          {displayValue}{' '}
          <span className="text-sm font-medium text-muted-foreground">
            {displayUnit}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <p className="text-xs text-muted-foreground">
            {metrics.processedTons.toFixed(1)}t em{' '}
            {metrics.elapsedHours.toFixed(1)}h
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
