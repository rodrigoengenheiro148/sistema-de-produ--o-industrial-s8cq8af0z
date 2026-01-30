import { useMemo, useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isSameDay } from 'date-fns'

interface ProductivityCardProps {
  className?: string
}

export function ProductivityCard({ className }: ProductivityCardProps) {
  const { rawMaterials, cookingTimeRecords, downtimeRecords } = useData()
  const [now, setNow] = useState(new Date())

  // Fixed flow rate as per requirements (7.125 t/h)
  const FIXED_FLOW_RATE = 7.125

  // Update current time every minute to keep calculations fresh for running processes
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const metrics = useMemo(() => {
    // 1. Filter Data by Current Date (Today)
    const today = now
    const filterFn = (d: Date) => isSameDay(d, today)

    // Data from context is already filtered by factory_id
    const filteredRawMaterials = rawMaterials.filter((r) => filterFn(r.date))
    const filteredCookingTimes = cookingTimeRecords.filter((r) =>
      filterFn(r.date),
    )
    const filteredDowntime = downtimeRecords.filter((r) => filterFn(r.date))

    // 2. Total Raw Material (kg -> tons)
    // Goal is to process all entered raw material
    const totalRawMaterialKg = filteredRawMaterials.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0),
      0,
    )
    const totalRawMaterialTons = totalRawMaterialKg / 1000

    // 3. Total Downtime (hours)
    const totalDowntimeHours = filteredDowntime.reduce(
      (acc, curr) => acc + (Number(curr.durationHours) || 0),
      0,
    )

    // 4. Total Cooking Time (hours)
    const getMinutes = (timeStr: string | null) => {
      if (!timeStr) return 0
      const parts = timeStr.split(':')
      if (parts.length < 2) return 0
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      if (isNaN(h) || isNaN(m)) return 0
      return h * 60 + m
    }

    let totalElapsedMinutes = 0
    filteredCookingTimes.forEach((record) => {
      const start = getMinutes(record.startTime)
      let end

      if (record.endTime) {
        end = getMinutes(record.endTime)
      } else {
        // Use current time for ongoing processes
        end = now.getHours() * 60 + now.getMinutes()
      }

      let diff = end - start
      if (diff < 0) diff += 24 * 60 // Handle day crossover
      if (diff < 0) diff = 0

      totalElapsedMinutes += diff
    })

    const totalElapsedHours = totalElapsedMinutes / 60

    // 5. Useful Hours (Total Time - Downtime)
    const usefulHours = Math.max(0, totalElapsedHours - totalDowntimeHours)

    // 6. Calculate Processed
    const calculatedProcessedTons = usefulHours * FIXED_FLOW_RATE
    // Ensure we don't display more processed than available raw material (if data is slightly off)
    const processedTons = Math.min(
      calculatedProcessedTons,
      totalRawMaterialTons > 0 ? totalRawMaterialTons : calculatedProcessedTons,
    )
    const remainingTons = Math.max(0, totalRawMaterialTons - processedTons)

    return {
      processedTons,
      remainingTons,
      totalRawMaterialTons,
      processedKg: processedTons * 1000,
    }
  }, [rawMaterials, cookingTimeRecords, downtimeRecords, now])

  // Formatting Logic based on Acceptance Criteria
  // If calculated value (kg) is between 0 and 999 -> unit kg/M
  // If calculated value (kg) is 1,000 or higher -> unit t/h
  let displayValue: string
  let displayUnit: string

  if (metrics.processedKg < 1000) {
    displayValue = metrics.processedKg.toFixed(2)
    displayUnit = 'kg/M'
  } else {
    displayValue = metrics.processedTons.toFixed(2)
    displayUnit = 't/h'
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Volume Processado
        </CardTitle>
        <Timer className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-baseline gap-1">
          {displayValue}{' '}
          <span className="text-sm font-medium text-muted-foreground">
            {displayUnit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {metrics.remainingTons.toFixed(2)}t restantes de{' '}
          {metrics.totalRawMaterialTons.toFixed(2)}t
        </p>
      </CardContent>
    </Card>
  )
}
