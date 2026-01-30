import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Timer, TrendingUp } from 'lucide-react'
import { isSameDay, differenceInMinutes, parse } from 'date-fns'

interface ProductivityCardProps {
  className?: string
}

export function ProductivityCard({ className }: ProductivityCardProps) {
  const {
    rawMaterials,
    cookingTimeRecords,
    downtimeRecords,
    dateRange, // Usually dashboard uses this, but requirements say "for the day".
    // We will assume "current date" logic or the selected date range if it represents a single day.
    // However, the user story mentions "The card must reset or update according to the 'current date' logic".
    // We'll stick to calculating for the selected range to be consistent with other dashboard cards,
    // which effectively becomes "the day" if user selects today.
  } = useData()

  const metrics = useMemo(() => {
    // 1. Filter Data by Date Range (or strictly today if no range? Dashboard usually sets a default range)
    const filterFn = (d: Date) => {
      if (!dateRange.from) return false
      const from = new Date(dateRange.from)
      from.setHours(0, 0, 0, 0)
      const to = dateRange.to ? new Date(dateRange.to) : new Date(from)
      to.setHours(23, 59, 59, 999)
      const target = new Date(d)
      return target >= from && target <= to
    }

    const filteredRawMaterials = rawMaterials.filter((r) => filterFn(r.date))
    const filteredCookingTimes = cookingTimeRecords.filter((r) =>
      filterFn(r.date),
    )
    const filteredDowntime = downtimeRecords.filter((r) => filterFn(r.date))

    // 2. Total Raw Material (kg -> tons)
    const totalRawMaterialKg = filteredRawMaterials.reduce(
      (acc, curr) => acc + curr.quantity,
      0,
    )
    const totalRawMaterialTons = totalRawMaterialKg / 1000

    // 3. Total Downtime (hours)
    const totalDowntimeHours = filteredDowntime.reduce(
      (acc, curr) => acc + curr.durationHours,
      0,
    )

    // 4. Total Cooking Time (hours)
    let totalElapsedMinutes = 0
    filteredCookingTimes.forEach((record) => {
      try {
        const start = parse(record.startTime, 'HH:mm', new Date())
        const end = parse(record.endTime, 'HH:mm', new Date())
        // Handle overnight crossing? Assuming simple daily shifts for now as per simple time input
        let diff = differenceInMinutes(end, start)
        if (diff < 0) diff += 24 * 60 // Simple adjustment if end < start
        totalElapsedMinutes += diff
      } catch (e) {
        console.error('Error parsing time', e)
      }
    })
    const totalElapsedHours = totalElapsedMinutes / 60

    // 5. Effective Time = Elapsed - Downtime
    // Ensure we don't go below zero
    const effectiveHours = Math.max(0, totalElapsedHours - totalDowntimeHours)

    // 6. Productivity (t/h)
    const productivity =
      effectiveHours > 0 ? totalRawMaterialTons / effectiveHours : 0

    return {
      productivity,
      effectiveHours,
      totalRawMaterialTons,
    }
  }, [rawMaterials, cookingTimeRecords, downtimeRecords, dateRange])

  return (
    <Card className={className}>
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
