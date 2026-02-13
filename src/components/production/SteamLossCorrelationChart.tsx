import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { format, isSameDay, eachDayOfInterval, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { isBloodRecord, formatNumber } from '@/lib/utils'

export function SteamLossCorrelationChart() {
  const { production, steamControlRecords, dateRange } = useData()

  const data = useMemo(() => {
    // If no specific date range, default to last 15 days for this detailed view
    const endDate = dateRange?.to || new Date()
    const startDate = dateRange?.from || subDays(endDate, 15)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days
      .map((day) => {
        // 1. Calculate Daily Losses (Main Line)
        const dayLosses = production
          .filter((p) => isSameDay(p.date, day) && !isBloodRecord(p))
          .reduce((acc, curr) => acc + curr.losses, 0)

        // 2. Calculate Daily Steam Consumption
        const daySteam = steamControlRecords
          .filter((r) => isSameDay(r.date, day))
          .reduce((acc, curr) => acc + (curr.meterEnd - curr.meterStart), 0)

        return {
          date: format(day, 'dd/MM'),
          fullDate: format(day, "d 'de' MMMM", { locale: ptBR }),
          losses: dayLosses, // kg
          steam: daySteam, // tons
        }
      })
      .filter((d) => d.losses > 0 || d.steam > 0)
  }, [production, steamControlRecords, dateRange])

  const chartConfig = {
    losses: {
      label: 'Perdas (kg)',
      color: 'hsl(var(--destructive))',
    },
    steam: {
      label: 'Consumo Vapor (t)',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  if (data.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correlação: Vapor x Perdas</CardTitle>
        <CardDescription>
          Análise comparativa entre o consumo de vapor e as perdas de processo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            {/* Left Axis: Steam (Tons) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Vapor (t)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(var(--primary))', fontSize: 12 },
              }}
            />
            {/* Right Axis: Losses (kg) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Perdas (kg)',
                angle: 90,
                position: 'insideRight',
                style: { fill: 'hsl(var(--destructive))', fontSize: 12 },
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Bar
              yAxisId="right"
              dataKey="losses"
              fill="var(--color-losses)"
              name="Perdas"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="steam"
              stroke="var(--color-steam)"
              strokeWidth={3}
              name="Vapor"
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
