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

  // 1. Calculate Daily Raw Material Input (Total Initial Raw Material)
  const totalDailyInputKg = useMemo(() => {
    return rawMaterials
      .filter((r) => isSameDay(r.date, now))
      .reduce((acc, curr) => acc + curr.quantity, 0)
  }, [rawMaterials, now])

  // 2. Find Active Process & Start Time
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

    // Safety check: if start date is in the future, ignore
    if (startDate > now) return null

    return {
      ...active,
      startDateTime: startDate,
    }
  }, [cookingTimeRecords, now])

  const metrics = useMemo(() => {
    if (!activeProcess) {
      // Determine unit for remaining (total input) when not active
      let remVal = totalDailyInputKg
      let remUnit = 'kg'
      if (Math.abs(remVal) >= 1000) {
        remVal = remVal / 1000
        remUnit = 't'
      }

      return {
        processedValue: 0,
        processedUnit: 'kg/h',
        remainingValue: remVal,
        remainingUnit: remUnit,
        elapsedString: '00:00:00',
        isActive: false,
      }
    }

    const elapsedSeconds = Math.max(
      0,
      differenceInSeconds(now, activeProcess.startDateTime),
    )
    const elapsedHours = elapsedSeconds / 3600

    // Processed Amount Logic: Consumption Rate * Elapsed Hours
    // FIXED_FLOW_RATE is in t/h
    const processedTons = elapsedHours * FIXED_FLOW_RATE
    const processedKg = processedTons * 1000

    // Remaining Logic: Total Initial - Processed
    const remainingKg = totalDailyInputKg - processedKg

    // Unit Logic for Main Metric (Processed)
    // If < 1000 (kg), show kg/h. If >= 1000, show t/h
    let mainValue: number
    let mainUnit: string

    if (processedKg < 1000) {
      mainValue = processedKg
      mainUnit = 'kg/h'
    } else {
      mainValue = processedTons
      mainUnit = 't/h'
    }

    // Unit Logic for Remaining Metric
    // If < 1000 (kg), show kg. If >= 1000, show t
    let remValue: number
    let remUnit: string
    const absRemaining = Math.abs(remainingKg)

    if (absRemaining < 1000) {
      remValue = remainingKg // Keep original sign
      remUnit = 'kg'
    } else {
      remValue = remainingKg / 1000 // Keep original sign
      remUnit = 't'
    }

    // Timer formatting HH:MM:SS
    const hh = Math.floor(elapsedSeconds / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((elapsedSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (elapsedSeconds % 60).toString().padStart(2, '0')

    return {
      processedValue: mainValue,
      processedUnit: mainUnit,
      remainingValue: remValue,
      remainingUnit: remUnit,
      elapsedString: `${hh}:${mm}:${ss}`,
      isActive: true,
    }
  }, [activeProcess, now, totalDailyInputKg])

  // Formatting helper
  const formatNumber = (val: number, unit: string) => {
    // If unit implies kg (base unit), use integer (0 decimals)
    if (unit.includes('kg')) {
      return val.toFixed(0)
    }
    // If unit implies tons (large unit), use 2 decimals
    return val.toFixed(2)
  }

  const mainDisplay = formatNumber(
    metrics.processedValue,
    metrics.processedUnit,
  )
  const remDisplay = formatNumber(metrics.remainingValue, metrics.remainingUnit)

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
          {mainDisplay}{' '}
          <span className="text-sm font-medium text-muted-foreground">
            {metrics.processedUnit}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <p className="text-xs text-muted-foreground">
            Restante: {remDisplay}
            {metrics.remainingUnit}
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
