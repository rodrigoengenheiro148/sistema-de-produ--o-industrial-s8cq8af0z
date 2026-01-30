import { useMemo, useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

export function HourlyProductionChart({ className }: { className?: string }) {
  const { cookingTimeRecords, downtimeRecords } = useData()
  const [now, setNow] = useState(new Date())

  // Refresh current time every minute to update the real-time bar
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const chartData = useMemo(() => {
    const today = now // Use current state to ensure day consistency across refreshes
    const records = cookingTimeRecords.filter((r) => isSameDay(r.date, today))
    const downtimes = downtimeRecords.filter((r) => isSameDay(r.date, today))

    const data = []
    const tonsPerMinute = 7.125 / 60

    for (let h = 0; h < 24; h++) {
      const hourStartMins = h * 60
      const hourEndMins = (h + 1) * 60

      let activeMinutes = 0

      // Calculate shift overlap
      records.forEach((rec) => {
        const startParts = rec.startTime.split(':').map(Number)
        const startMins = startParts[0] * 60 + startParts[1]

        let endMins
        if (rec.endTime) {
          const endParts = rec.endTime.split(':').map(Number)
          endMins = endParts[0] * 60 + endParts[1]
        } else {
          // If no end time, assume it goes until now (if current time)
          endMins = now.getHours() * 60 + now.getMinutes()
        }

        // Handle day crossover (e.g. 23:00 to 02:00)
        if (endMins < startMins) endMins += 24 * 60

        // Calculate overlap with current hour window
        const overlapStart = Math.max(startMins, hourStartMins)
        const overlapEnd = Math.min(endMins, hourEndMins)

        if (overlapEnd > overlapStart) {
          activeMinutes += overlapEnd - overlapStart
        }
      })

      // Calculate Downtime Subtraction with proper spanning logic
      let downtimeMinutesInHour = 0
      downtimes.forEach((dt) => {
        if (dt.createdAt) {
          // dt.createdAt is a Date object mapped in context
          const dtStart = dt.createdAt
          const dtEnd = new Date(
            dtStart.getTime() + dt.durationHours * 60 * 60 * 1000,
          )

          // Define current hour boundaries as Date objects
          const hourStart = new Date(today)
          hourStart.setHours(h, 0, 0, 0)

          const hourEnd = new Date(today)
          hourEnd.setHours(h + 1, 0, 0, 0)

          // Calculate intersection
          const start = Math.max(dtStart.getTime(), hourStart.getTime())
          const end = Math.min(dtEnd.getTime(), hourEnd.getTime())

          if (end > start) {
            const overlapMinutes = (end - start) / (1000 * 60)
            downtimeMinutesInHour += overlapMinutes
          }
        }
      })

      activeMinutes = Math.max(0, activeMinutes - downtimeMinutesInHour)

      data.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        volume: Math.max(0, activeMinutes * tonsPerMinute),
      })
    }

    return data
  }, [cookingTimeRecords, downtimeRecords, now])

  const config = {
    volume: {
      label: 'Volume',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  const formatValue = (valueInTons: number) => {
    const valueInKg = valueInTons * 1000
    if (valueInKg < 1000) {
      return `${valueInKg.toFixed(0)} kg/M`
    }
    return `${valueInTons.toFixed(1)} t/h`
  }

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader>
        <CardTitle>Produção Horária</CardTitle>
        <CardDescription>
          Volume produzido por hora (Base: 7.125 t/h)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={12}
              interval={2}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={formatValue}
              width={60}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatValue(Number(value))}
                />
              }
            />
            <Bar
              dataKey="volume"
              fill="var(--color-volume)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
