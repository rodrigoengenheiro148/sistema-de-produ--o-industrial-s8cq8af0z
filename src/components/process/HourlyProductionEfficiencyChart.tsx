import { useState, useMemo, useEffect } from 'react'
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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'
import { format, isSameDay } from 'date-fns'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { calculateDailyMetrics } from '@/lib/process-calculations'

interface HourlyProductionEfficiencyChartProps {
  date?: Date
}

export function HourlyProductionEfficiencyChart({
  date,
}: HourlyProductionEfficiencyChartProps) {
  const { production, cookingTimeRecords, downtimeRecords } = useData()
  const [internalDate, setInternalDate] = useState<Date>(new Date())
  const [unit, setUnit] = useState<'kg' | 't'>('kg')
  const [now, setNow] = useState(new Date())

  // Use prop date if available, otherwise internal state
  const selectedDate = date || internalDate

  // Update 'now' every minute to keep the "Active until now" logic fresh for today
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const chartData = useMemo(() => {
    // 1. Calculate Daily Metrics using shared logic
    const dailyMetrics = calculateDailyMetrics(
      selectedDate,
      cookingTimeRecords,
      downtimeRecords,
      production,
      now,
    )

    // 2. Calculate Rates per Minute (to distribute across active minutes)
    // We avoid division by zero
    const netMinutes = dailyMetrics.netActiveMinutes
    const consumptionPerMinute =
      netMinutes > 0 ? dailyMetrics.totalConsumption / netMinutes : 0

    // Also calculate production output for the "Produção" bar
    const totalDailyProduction = production
      .filter((p) => isSameDay(p.date, selectedDate))
      .reduce((acc, curr) => {
        return (
          acc +
          (curr.seboProduced || 0) +
          (curr.fcoProduced || 0) +
          (curr.farinhetaProduced || 0)
        )
      }, 0)
    const productionPerMinute =
      netMinutes > 0 ? totalDailyProduction / netMinutes : 0

    // 3. Aggregate into Hours (00-23)
    const data = []
    for (let h = 0; h < 24; h++) {
      let activeMinsInHour = 0
      const startMin = h * 60
      const endMin = (h + 1) * 60

      for (let m = startMin; m < endMin; m++) {
        if (dailyMetrics.activeMinutesArray[m] === 1) {
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

    return {
      data,
      hasActivity:
        dailyMetrics.grossActiveMinutes > 0 ||
        dailyMetrics.totalConsumption > 0,
    }
  }, [production, cookingTimeRecords, downtimeRecords, selectedDate, unit, now])

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

  const formatLabel = (value: number) => {
    if (value === 0) return null
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: unit === 't' ? 2 : 0,
      maximumFractionDigits: unit === 't' ? 2 : 0,
    })
  }

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
          {/* Internal date picker removed to rely on parent state if provided, or default behavior */}

          <Tabs value={unit} onValueChange={(v) => setUnit(v as 'kg' | 't')}>
            <TabsList>
              <TabsTrigger value="kg">kg</TabsTrigger>
              <TabsTrigger value="t">t</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.hasActivity ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData.data}
              barGap={0}
              margin={{ top: 20 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={2}
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
              >
                <LabelList
                  position="top"
                  offset={10}
                  className="fill-foreground text-[10px]"
                  formatter={(value: number) => formatLabel(value)}
                />
              </Bar>
              <Bar
                dataKey="consumption"
                fill="var(--color-consumption)"
                radius={[4, 4, 0, 0]}
                name={`Consumo Real (${unit})`}
              >
                <LabelList
                  position="top"
                  offset={10}
                  className="fill-foreground text-[10px]"
                  formatter={(value: number) => formatLabel(value)}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] w-full flex flex-col gap-2 items-center justify-center text-muted-foreground border border-dashed rounded-md bg-muted/10">
            <p className="font-medium">
              Nenhuma atividade registrada para esta data.
            </p>
            <p className="text-sm">
              Certifique-se de registrar Tempos de Cozimento e Produção.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
