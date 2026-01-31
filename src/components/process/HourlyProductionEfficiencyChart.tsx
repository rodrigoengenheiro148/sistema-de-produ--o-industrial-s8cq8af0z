import { useState, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format, isSameDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HourlyProductionEfficiencyChart() {
  const { production, cookingTimeRecords } = useData()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [unit, setUnit] = useState<'kg' | 't'>('kg')

  const chartData = useMemo(() => {
    // 1. Initialize timeline (minutes 0-1439 for the selected day)
    // 0 = inactive, 1 = active
    const activeMinutes = new Array(24 * 60).fill(0)

    // 2. Mark active periods from cooking records
    // We look for records that overlap with the selected date
    cookingTimeRecords.forEach((record) => {
      // We only consider records belonging to the selected date
      // to determine activity for this day's chart.
      if (!isSameDay(record.date, selectedDate)) return

      const [startH, startM] = record.startTime.split(':').map(Number)
      const startTotalMins = startH * 60 + startM

      let endTotalMins
      if (record.endTime) {
        const [endH, endM] = record.endTime.split(':').map(Number)
        endTotalMins = endH * 60 + endM
        // Handle overnight shift (e.g. 23:00 - 02:00)
        // For the purpose of "Today's Chart", we clamp to 24:00 (1440 mins)
        if (endTotalMins < startTotalMins) {
          endTotalMins = 24 * 60 // Clamp to end of day
        }
      } else {
        // If currently running
        if (isSameDay(new Date(), selectedDate)) {
          const now = new Date()
          endTotalMins = now.getHours() * 60 + now.getMinutes()
        } else {
          // If past day and no end time, assume it ran until end of day (or data issue)
          // We'll clamp to end of day
          endTotalMins = 24 * 60
        }
      }

      // Mark minutes as active
      for (let i = startTotalMins; i < endTotalMins; i++) {
        if (i < 1440) activeMinutes[i] = 1
      }
    })

    const totalActiveMinutes = activeMinutes.filter((m) => m === 1).length

    // 3. Calculate Daily Totals
    // Filter production records for the selected date
    const dailyProduction = production
      .filter((p) => isSameDay(p.date, selectedDate))
      .reduce((acc, curr) => {
        return (
          acc +
          (curr.seboProduced || 0) +
          (curr.fcoProduced || 0) +
          (curr.farinhetaProduced || 0)
        )
      }, 0)

    const dailyConsumption = production
      .filter((p) => isSameDay(p.date, selectedDate))
      .reduce((acc, curr) => acc + (curr.mpUsed || 0), 0)

    // 4. Calculate Rates (per minute)
    // Distribute total daily production/consumption uniformly over active minutes
    const productionPerMinute =
      totalActiveMinutes > 0 ? dailyProduction / totalActiveMinutes : 0
    const consumptionPerMinute =
      totalActiveMinutes > 0 ? dailyConsumption / totalActiveMinutes : 0

    // 5. Aggregate into Hours (00-23)
    const data = []
    for (let h = 0; h < 24; h++) {
      let activeMinsInHour = 0
      for (let m = 0; m < 60; m++) {
        const minuteIndex = h * 60 + m
        if (activeMinutes[minuteIndex] === 1) {
          activeMinsInHour++
        }
      }

      let hourlyProduction = activeMinsInHour * productionPerMinute
      let hourlyConsumption = activeMinsInHour * consumptionPerMinute

      // Convert units if needed
      if (unit === 't') {
        hourlyProduction /= 1000
        hourlyConsumption /= 1000
      }

      data.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        activeMinutes: activeMinsInHour,
        production: Number(hourlyProduction.toFixed(2)),
        consumption: Number(hourlyConsumption.toFixed(2)),
      })
    }

    return data
  }, [production, cookingTimeRecords, selectedDate, unit])

  const chartConfig = {
    production: {
      label: `Produção (${unit})`,
      color: 'hsl(var(--chart-1))',
    },
    consumption: {
      label: `Consumo Real (${unit})`,
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
        <div className="space-y-1">
          <CardTitle>Produção por Hora</CardTitle>
          <CardDescription>
            Produção vs Consumo Real distruibuído por horas ativas.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Tabs value={unit} onValueChange={(v) => setUnit(v as 'kg' | 't')}>
            <TabsList>
              <TabsTrigger value="kg">kg</TabsTrigger>
              <TabsTrigger value="t">t</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.some((d) => d.production > 0 || d.consumption > 0) ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData} barGap={0}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={2} // Show every 3rd label (00, 03, 06...) to avoid clutter
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="production"
                fill="var(--color-production)"
                radius={[4, 4, 0, 0]}
                name={`Produção (${unit})`}
              />
              <Bar
                dataKey="consumption"
                fill="var(--color-consumption)"
                radius={[4, 4, 0, 0]}
                name={`Consumo Real (${unit})`}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] w-full flex flex-col gap-2 items-center justify-center text-muted-foreground border border-dashed rounded-md bg-muted/10">
            <p>Nenhuma atividade registrada para esta data.</p>
            <p className="text-xs">
              Certifique-se de registrar Tempos de Cozimento e Produção.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
