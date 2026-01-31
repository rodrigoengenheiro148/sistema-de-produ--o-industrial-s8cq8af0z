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
import { format } from 'date-fns'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function HourlyProductionEfficiencyChart() {
  const { production, cookingTimeRecords } = useData()
  const [unit, setUnit] = useState<'kg' | 't'>('kg')

  const chartData = useMemo(() => {
    // Map to aggregate data by date
    const dateMap = new Map<
      string,
      {
        date: Date
        production: number
        consumption: number
        durationMinutes: number
      }
    >()

    // 1. Process Production Data (Output & Input)
    production.forEach((entry) => {
      const dateKey = format(entry.date, 'yyyy-MM-dd')
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: entry.date,
          production: 0,
          consumption: 0,
          durationMinutes: 0,
        })
      }
      const record = dateMap.get(dateKey)!

      // Total Production = Sebo + FCO + Farinheta
      const totalProd =
        (entry.seboProduced || 0) +
        (entry.fcoProduced || 0) +
        (entry.farinhetaProduced || 0)

      // Total Consumption = MP Used
      const totalCons = entry.mpUsed || 0

      record.production += totalProd
      record.consumption += totalCons
    })

    // 2. Process Cooking Time Records (Duration)
    cookingTimeRecords.forEach((record) => {
      const dateKey = format(record.date, 'yyyy-MM-dd')
      // Ensure we have an entry even if no production (though efficiency would be 0)
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: record.date,
          production: 0,
          consumption: 0,
          durationMinutes: 0,
        })
      }
      const entry = dateMap.get(dateKey)!

      if (record.startTime && record.endTime) {
        const [startH, startM] = record.startTime.split(':').map(Number)
        const [endH, endM] = record.endTime.split(':').map(Number)

        let startMins = startH * 60 + startM
        let endMins = endH * 60 + endM

        // Handle overnight shifts (e.g. 23:00 to 02:00)
        if (endMins < startMins) {
          endMins += 24 * 60
        }

        const durationMins = endMins - startMins
        if (durationMins > 0) {
          entry.durationMinutes += durationMins
        }
      }
    })

    // 3. Calculate Hourly Rates
    const data = Array.from(dateMap.values()).map((entry) => {
      const hours = entry.durationMinutes / 60

      // Avoid division by zero
      let productionRate = hours > 0 ? entry.production / hours : 0
      let consumptionRate = hours > 0 ? entry.consumption / hours : 0

      // Convert to Tons if selected
      if (unit === 't') {
        productionRate = productionRate / 1000
        consumptionRate = consumptionRate / 1000
      }

      return {
        dateLabel: format(entry.date, 'dd/MM'),
        fullDate: entry.date,
        productionRate: Number(productionRate.toFixed(2)),
        consumptionRate: Number(consumptionRate.toFixed(2)),
      }
    })

    // Sort by date and limit to last 14 entries for readability
    return data
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
      .slice(-14)
  }, [production, cookingTimeRecords, unit])

  const chartConfig = {
    productionRate: {
      label: `Produção (${unit}/h)`,
      color: 'hsl(var(--chart-1))',
    },
    consumptionRate: {
      label: `Consumo MP (${unit}/h)`,
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle>Eficiência de Produção Horária</CardTitle>
          <CardDescription>
            Comparativo de Produção vs Consumo por hora de operação
          </CardDescription>
        </div>
        <Tabs value={unit} onValueChange={(v) => setUnit(v as 'kg' | 't')}>
          <TabsList>
            <TabsTrigger value="kg">kg/h</TabsTrigger>
            <TabsTrigger value="t">t/h</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="productionRate"
                fill="var(--color-productionRate)"
                radius={[4, 4, 0, 0]}
                name={`Produção (${unit}/h)`}
              />
              <Bar
                dataKey="consumptionRate"
                fill="var(--color-consumptionRate)"
                radius={[4, 4, 0, 0]}
                name={`Consumo (${unit}/h)`}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground border border-dashed rounded-md">
            Sem dados suficientes para cálculo de eficiência.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
