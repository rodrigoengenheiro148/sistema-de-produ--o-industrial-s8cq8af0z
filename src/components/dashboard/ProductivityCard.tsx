import { useMemo, useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, AlertOctagon } from 'lucide-react'
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

  // 2. Find Active Process
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

  // 3. Find Active Downtime
  const activeDowntime = useMemo(() => {
    return downtimeRecords.find((r) => r.startTime && !r.endTime)
  }, [downtimeRecords])

  // 4. Calculate Total Downtime Hours for the active process
  const totalDowntimeHours = useMemo(() => {
    if (!activeProcess) return 0

    // Filter closed downtimes that happened today (or associated with current process context)
    // We assume downtimes logged today are relevant to today's process
    const relevantDowntimes = downtimeRecords.filter((r) =>
      isSameDay(r.date, now),
    )

    let totalHours = 0

    // Add closed downtimes
    relevantDowntimes.forEach((d) => {
      if (d.endTime || (!d.startTime && d.durationHours)) {
        totalHours += d.durationHours
      }
    })

    // Add current active downtime duration
    if (activeDowntime && activeDowntime.startTime) {
      const start = new Date(activeDowntime.startTime)
      const currentDurationSeconds = Math.max(
        0,
        differenceInSeconds(now, start),
      )
      totalHours += currentDurationSeconds / 3600
    }

    return totalHours
  }, [downtimeRecords, activeDowntime, now, activeProcess])

  const metrics = useMemo(() => {
    if (!activeProcess) {
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
        isStopped: false,
      }
    }

    // Total elapsed time since process start
    const totalElapsedSeconds = Math.max(
      0,
      differenceInSeconds(now, activeProcess.startDateTime),
    )
    const totalElapsedHours = totalElapsedSeconds / 3600

    // Net Active Time = Total Elapsed - Total Downtime
    const netActiveHours = Math.max(0, totalElapsedHours - totalDowntimeHours)

    // Processed Amount = Net Active Time * Rate
    const processedTons = netActiveHours * FIXED_FLOW_RATE
    const processedKg = processedTons * 1000

    // Remaining Logic
    const remainingKg = totalDailyInputKg - processedKg

    // Unit Logic
    let mainValue: number
    let mainUnit: string
    if (processedKg < 1000) {
      mainValue = processedKg
      mainUnit = 'kg/h'
    } else {
      mainValue = processedTons
      mainUnit = 't/h'
    }

    let remValue: number
    let remUnit: string
    const absRemaining = Math.abs(remainingKg)
    if (absRemaining < 1000) {
      remValue = remainingKg
      remUnit = 'kg'
    } else {
      remValue = remainingKg / 1000
      remUnit = 't'
    }

    // Timer formatting (Total Elapsed - Total Downtime) -> Net Process Time?
    // Usually user wants to see the Net Working Time or just Total Elapsed?
    // Requirement says: "The 'Elapsed Time' timer on the card must stop incrementing."
    // This implies showing Net Active Time.
    const netSeconds = Math.floor(netActiveHours * 3600)
    const hh = Math.floor(netSeconds / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((netSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (netSeconds % 60).toString().padStart(2, '0')

    return {
      processedValue: mainValue,
      processedUnit: mainUnit,
      remainingValue: remValue,
      remainingUnit: remUnit,
      elapsedString: `${hh}:${mm}:${ss}`,
      isActive: true,
      isStopped: !!activeDowntime,
    }
  }, [
    activeProcess,
    now,
    totalDailyInputKg,
    totalDowntimeHours,
    activeDowntime,
  ])

  const formatNumber = (val: number, unit: string) => {
    if (unit.includes('kg')) {
      return val.toFixed(0)
    }
    return val.toFixed(2)
  }

  const mainDisplay = formatNumber(
    metrics.processedValue,
    metrics.processedUnit,
  )
  const remDisplay = formatNumber(metrics.remainingValue, metrics.remainingUnit)

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
          {mainDisplay}{' '}
          <span className={cn('text-sm font-medium', subTextClass)}>
            {metrics.processedUnit}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <p className={cn('text-xs', subTextClass)}>
            Restante: {remDisplay}
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
