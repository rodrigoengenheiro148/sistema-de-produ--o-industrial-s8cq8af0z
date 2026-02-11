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
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HourlyProductionEfficiencyChartProps {
  date?: Date
}

export function HourlyProductionEfficiencyChart({
  date,
}: HourlyProductionEfficiencyChartProps) {
  const { production, cookingTimeRecords } = useData()
  const [unit, setUnit] = useState<'kg' | 't'>('kg')

  // Use prop date as end date, default to today
  const endDate = date || new Date()
  // Show last 7 days including the selected date
  const startDate = subDays(endDate, 6)

  const chartData = useMemo(() => {
    // 1. Group Production by Day
    const productionByDay = new Map<string, number>()
    production.forEach((p) => {
      const key = format(p.date, 'yyyy-MM-dd')
      const total =
        (p.seboProduced || 0) +
        (p.fcoProduced || 0) +
        (p.farinhetaProduced || 0)
      productionByDay.set(key, (productionByDay.get(key) || 0) + total)
    })

    // 2. Group Hours by Day
    const hoursByDay = new Map<string, number>()
    cookingTimeRecords.forEach((c) => {
      const key = format(c.date, 'yyyy-MM-dd')
      const hours = c.totalHours || 0
      hoursByDay.set(key, (hoursByDay.get(key) || 0) + hours)
    })

    // 3. Generate Interval and Data
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    const data = days.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const prod = productionByDay.get(key) || 0
      const hrs = hoursByDay.get(key) || 0

      let productivity = 0
      if (hrs > 0) {
        productivity = prod / hrs
      }

      if (unit === 't') {
        productivity = productivity / 1000
      }

      return {
        date: format(day, 'dd/MM'),
        fullDate: format(day, "d 'de' MMMM", { locale: ptBR }),
        productivity: Number(productivity.toFixed(2)),
        hasData: prod > 0 || hrs > 0,
      }
    })

    const hasActivity = data.some((d) => d.hasData)

    return { data, hasActivity }
  }, [production, cookingTimeRecords, startDate, endDate, unit])

  const chartConfig = {
    productivity: {
      label: `Produtividade (${unit}/h)`,
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
        <div className="space-y-1">
          <CardTitle>Produção por Hora</CardTitle>
          <CardDescription>
            Histórico de produtividade diária (Produção Total / Horas Ativas)
          </CardDescription>
        </div>
        <Tabs value={unit} onValueChange={(v) => setUnit(v as 'kg' | 't')}>
          <TabsList>
            <TabsTrigger value="kg">kg</TabsTrigger>
            <TabsTrigger value="t">t</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {chartData.hasActivity ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData.data}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="productivity"
                fill="var(--color-productivity)"
                radius={[4, 4, 0, 0]}
                name={`Produtividade (${unit}/h)`}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground text-[12px]"
                  fontSize={12}
                  formatter={(value: number) => value.toLocaleString()}
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
