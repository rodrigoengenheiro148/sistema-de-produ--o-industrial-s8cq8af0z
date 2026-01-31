import { useState, useEffect, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, AlertOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isSameDay } from 'date-fns'
import { calculateDailyMetrics } from '@/lib/process-calculations'

interface ProductivityCardProps {
  className?: string
}

export function ProductivityCard({ className }: ProductivityCardProps) {
  const { cookingTimeRecords, rawMaterials, downtimeRecords, production } =
    useData()
  const [now, setNow] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // 1. Calculate Daily Raw Material Input
  const totalDailyInputKg = useMemo(() => {
    return rawMaterials
      .filter((r) => isSameDay(r.date, now))
      .reduce((acc, curr) => acc + curr.quantity, 0)
  }, [rawMaterials, now])

  // 2. Find Active Process (for status indication)
  const activeProcess = useMemo(() => {
    const todaysRecords = cookingTimeRecords.filter((r) =>
      isSameDay(r.date, now),
    )
    const sortedRecords = [...todaysRecords].sort((a, b) => {
      return b.startTime.localeCompare(a.startTime)
    })
    const active = sortedRecords.find((r) => !r.endTime)
    if (!active) return null

    const [h, m, s] = active.startTime.split(':').map(Number)
    const startDate = new Date(active.date)
    startDate.setHours(h, m, s || 0, 0)

    if (startDate > now) return null

    return {
      ...active,
      startDateTime: startDate,
    }
  }, [cookingTimeRecords, now])

  // 3. Calculate Metrics using Shared Logic
  const metrics = useMemo(() => {
    const dailyMetrics = calculateDailyMetrics(
      now,
      cookingTimeRecords,
      downtimeRecords,
      production,
      now,
    )

    const remainingKg = totalDailyInputKg - dailyMetrics.totalConsumption
    const isStopped =
      !!activeProcess && downtimeRecords.some((d) => d.startTime && !d.endTime)

    // Format Active Time
    const netSeconds = Math.floor(dailyMetrics.netActiveMinutes * 60)
    const hh = Math.floor(netSeconds / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((netSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (netSeconds % 60).toString().padStart(2, '0')

    // Determine values for display
    let remainingVal = remainingKg
    let remainingUnit = 'kg'
    if (Math.abs(remainingKg) >= 1000) {
      remainingVal = remainingKg / 1000
      remainingUnit = 't'
    }

    return {
      rateVal: dailyMetrics.rateTon,
      rateUnit: 't/h',
      remainingVal,
      remainingUnit,
      elapsedString: `${hh}:${mm}:${ss}`,
      isActive: !!activeProcess,
      isStopped,
      totalConsumption: dailyMetrics.totalConsumption,
    }
  }, [
    now,
    cookingTimeRecords,
    downtimeRecords,
    production,
    totalDailyInputKg,
    activeProcess,
  ])

  // Dynamic Styles
  const cardBgClass = metrics.isStopped
    ? 'bg-destructive text-destructive-foreground'
    : ''
  const subTextClass = metrics.isStopped
    ? 'text-destructive-foreground/80'
    : 'text-muted-foreground'
  const titleClass = metrics.isStopped
    ? 'text-destructive-foreground'
    : 'text-muted-foreground'
  const iconClass = metrics.isStopped
    ? 'text-destructive-foreground'
    : metrics.isActive
      ? 'text-blue-500'
      : 'text-muted-foreground'
  const badgeClass = metrics.isStopped
    ? 'bg-destructive-foreground/20 text-destructive-foreground'
    : 'bg-muted/30 text-muted-foreground'

  return (
    <Card
      className={cn(className, cardBgClass, 'transition-colors duration-500')}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn('text-sm font-medium', titleClass)}>
          {metrics.isStopped ? 'Máquina parada' : 'Produtividade'}
        </CardTitle>
        {metrics.isStopped ? (
          <AlertOctagon className={cn('h-4 w-4 animate-pulse', iconClass)} />
        ) : (
          <Activity className={cn('h-4 w-4', iconClass)} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-baseline gap-1">
          {metrics.rateVal.toFixed(2)}{' '}
          <span className={cn('text-sm font-medium', subTextClass)}>
            {metrics.rateUnit}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <p className={cn('text-xs', subTextClass)}>
            Restante: {metrics.remainingVal.toFixed(2)}
            {metrics.remainingUnit}
          </p>

          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-mono w-fit px-1.5 py-0.5 rounded',
              badgeClass,
            )}
          >
            <Clock className="h-3 w-3" />
            {metrics.elapsedString}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
