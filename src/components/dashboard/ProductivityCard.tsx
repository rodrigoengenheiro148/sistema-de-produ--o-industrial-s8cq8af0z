import { useMemo } from 'react'
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

  const metrics = useMemo(() => {
    // 1. Filter Data by Current Date (Today)
    // We strictly use the current day for this KPI to show real-time daily efficiency
    const today = new Date()
    const filterFn = (d: Date) => isSameDay(d, today)

    const filteredRawMaterials = rawMaterials.filter((r) => filterFn(r.date))
    const filteredCookingTimes = cookingTimeRecords.filter((r) =>
      filterFn(r.date),
    )
    const filteredDowntime = downtimeRecords.filter((r) => filterFn(r.date))

    // 2. Total Raw Material (kg -> tons)
    // Sum quantity from raw_materials for today
    const totalRawMaterialKg = filteredRawMaterials.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0),
      0,
    )
    const totalRawMaterialTons = totalRawMaterialKg / 1000

    // 3. Total Downtime (hours)
    // Sum duration_hours from downtime_records for today
    const totalDowntimeHours = filteredDowntime.reduce(
      (acc, curr) => acc + (Number(curr.durationHours) || 0),
      0,
    )

    // 4. Total Cooking Time (hours)
    // Helper to parse HH:mm or HH:mm:ss to minutes
    // We use manual parsing to be robust against different DB time formats
    const getMinutes = (timeStr: string) => {
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
      const end = getMinutes(record.endTime)

      let diff = end - start
      // Handle crossover (next day) if end time is smaller than start time
      // This assumes a shift within 24h period (e.g., 23:00 -> 02:00)
      if (diff < 0) diff += 24 * 60

      totalElapsedMinutes += diff
    })

    const totalElapsedHours = totalElapsedMinutes / 60

    // 5. Effective Time = Elapsed - Downtime
    // Protect against negative time if downtime exceeds elapsed (data anomaly protection)
    const effectiveHours = Math.max(0, totalElapsedHours - totalDowntimeHours)

    // 6. Productivity (t/h)
    // Avoid division by zero: if effective hours is 0, productivity is 0
    const productivity =
      effectiveHours > 0 ? totalRawMaterialTons / effectiveHours : 0

    // Ensure we never return NaN/undefined values for UI
    return {
      productivity: Number.isFinite(productivity) ? productivity : 0,
      effectiveHours: Number.isFinite(effectiveHours) ? effectiveHours : 0,
      totalRawMaterialTons: Number.isFinite(totalRawMaterialTons)
        ? totalRawMaterialTons
        : 0,
    }
  }, [rawMaterials, cookingTimeRecords, downtimeRecords])

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tempo de Cozimento (t/h)
        </CardTitle>
        <Timer className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metrics.productivity.toFixed(2)} t/h
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {metrics.totalRawMaterialTons.toFixed(1)}t em{' '}
          {metrics.effectiveHours.toFixed(1)}h úteis
        </p>
      </CardContent>
    </Card>
  )
}
