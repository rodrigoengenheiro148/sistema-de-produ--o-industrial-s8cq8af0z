import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { format, isSameDay } from 'date-fns'
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts'
import { Loader2 } from 'lucide-react'

export function SteamCharts() {
  const { steamRecords, production, dateRange } = useData()

  const processedData = useMemo(() => {
    const dataMap = new Map<
      string,
      {
        date: Date
        dateStr: string
        displayDate: string
        steamConsumption: number
        woodChips: number
        mpUsed: number
        totalProduction: number
      }
    >()

    // Filter and Process Steam Records
    steamRecords.forEach((record) => {
      if (
        dateRange.from &&
        (record.date < dateRange.from ||
          (dateRange.to && record.date > dateRange.to))
      ) {
        return
      }

      const dateKey = format(record.date, 'yyyy-MM-dd')
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: record.date,
          dateStr: dateKey,
          displayDate: format(record.date, 'dd/MM', { locale: ptBR }),
          steamConsumption: 0,
          woodChips: 0,
          mpUsed: 0,
          totalProduction: 0,
        })
      }
      const entry = dataMap.get(dateKey)!
      entry.steamConsumption += record.steamConsumption || 0
      entry.woodChips += record.woodChips || 0
    })

    // Filter and Process Production Records
    production.forEach((prod) => {
      if (
        dateRange.from &&
        (prod.date < dateRange.from ||
          (dateRange.to && prod.date > dateRange.to))
      ) {
        return
      }

      const dateKey = format(prod.date, 'yyyy-MM-dd')
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: prod.date,
          dateStr: dateKey,
          displayDate: format(prod.date, 'dd/MM', { locale: ptBR }),
          steamConsumption: 0,
          woodChips: 0,
          mpUsed: 0,
          totalProduction: 0,
        })
      }
      const entry = dataMap.get(dateKey)!
      entry.mpUsed += prod.mpUsed || 0
      entry.totalProduction +=
        (prod.seboProduced || 0) +
        (prod.fcoProduced || 0) +
        (prod.farinhetaProduced || 0)
    })

    return Array.from(dataMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )
  }, [steamRecords, production, dateRange])

  const chartConfig: ChartConfig = {
    steamConsumption: {
      label: 'Vapor (t)',
      color: 'hsl(var(--chart-1))',
    },
    woodChips: {
      label: 'Cavaco (m³)',
      color: 'hsl(var(--chart-2))',
    },
    mpUsed: {
      label: 'Matéria-Prima (kg)',
      color: 'hsl(var(--chart-3))',
    },
    totalProduction: {
      label: 'Produção (kg)',
      color: 'hsl(var(--chart-4))',
    },
  }

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toFixed(0)
  }

  if (processedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
        <p>Nenhum dado encontrado para o período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Chart 1: Daily Steam Consumption */}
      <Card>
        <CardHeader>
          <CardTitle>Consumo de Vapor</CardTitle>
          <CardDescription>Total diário (t)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="steamConsumption"
                fill="var(--color-steamConsumption)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="steamConsumption"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 2: Wood Chips vs Steam */}
      <Card>
        <CardHeader>
          <CardTitle>Cavacos vs. Toneladas Vapor</CardTitle>
          <CardDescription>Comparativo Diário</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="woodChips"
                fill="var(--color-woodChips)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="woodChips"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
              <Bar
                dataKey="steamConsumption"
                fill="var(--color-steamConsumption)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="steamConsumption"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 3: MPs vs Vapor */}
      <Card>
        <CardHeader>
          <CardTitle>MPs vs. Vapor</CardTitle>
          <CardDescription>Relação MP e Consumo de Vapor</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="mpUsed"
                fill="var(--color-mpUsed)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="mpUsed"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
              <Bar
                dataKey="steamConsumption"
                fill="var(--color-steamConsumption)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="steamConsumption"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 4: MPs vs m³ Cavaco */}
      <Card>
        <CardHeader>
          <CardTitle>MPs vs. m³ Cavaco</CardTitle>
          <CardDescription>Relação MP e Combustível</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="mpUsed"
                fill="var(--color-mpUsed)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="mpUsed"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
              <Bar
                dataKey="woodChips"
                fill="var(--color-woodChips)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="woodChips"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 5: Vapor vs MPs */}
      <Card>
        <CardHeader>
          <CardTitle>Vapor vs MPs</CardTitle>
          <CardDescription>Eficiência Vapor/Matéria-Prima</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="steamConsumption"
                fill="var(--color-steamConsumption)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="steamConsumption"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
              <Bar
                dataKey="mpUsed"
                fill="var(--color-mpUsed)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="mpUsed"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 6: Tons vs MPs */}
      <Card>
        <CardHeader>
          <CardTitle>Tons vs. MPs</CardTitle>
          <CardDescription>Produção Total vs Matéria-Prima</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="totalProduction"
                name="Tons (Produção)"
                fill="var(--color-totalProduction)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="totalProduction"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
              <Bar
                dataKey="mpUsed"
                name="MPs (Entrada)"
                fill="var(--color-mpUsed)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="mpUsed"
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
