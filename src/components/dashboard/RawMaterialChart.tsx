import { useMemo } from 'react'
import { RawMaterialEntry } from '@/lib/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RawMaterialChartProps {
  data: RawMaterialEntry[]
}

export function RawMaterialChart({ data }: RawMaterialChartProps) {
  // Process data for the chart
  const { chartData, chartConfig } = useMemo(() => {
    const suppliers = Array.from(new Set(data.map((item) => item.supplier)))
    const dateMap = new Map<string, any>()

    data.forEach((item) => {
      const dateKey = format(item.date, 'dd/MM')
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, originalDate: item.date })
      }
      const entry = dateMap.get(dateKey)
      entry[item.supplier] = (entry[item.supplier] || 0) + item.quantity
    })

    const sortedData = Array.from(dateMap.values()).sort(
      (a, b) => a.originalDate.getTime() - b.originalDate.getTime(),
    )

    // Generate config with Green/Yellow theme colors
    // We cycle through chart-1 to chart-5 variables which are theme-aware
    const config: ChartConfig = {}
    suppliers.forEach((supplier, index) => {
      // Logic to assign specific colors if needed, but using theme vars for consistency
      const colorVar = `hsl(var(--chart-${(index % 5) + 1}))`
      config[supplier] = {
        label: supplier,
        color: colorVar,
      }
    })

    return { chartData: sortedData, chartConfig: config }
  }, [data])

  if (data.length === 0) {
    return (
      <Card className="col-span-full shadow-sm border-primary/10">
        <CardHeader>
          <CardTitle>Entrada Diária de MP por Fornecedor</CardTitle>
          <CardDescription>
            Acompanhamento diário de recebimento de matéria-prima
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível para o período selecionado.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full shadow-sm border-primary/10">
      <CardHeader>
        <CardTitle>Entrada Diária de MP por Fornecedor</CardTitle>
        <CardDescription>
          Volume recebido por dia detalhado por fornecedor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-48"
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-2">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium">
                        {Number(value).toLocaleString('pt-BR')} kg
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {Object.keys(chartConfig).map((supplier) => (
              <Bar
                key={supplier}
                dataKey={supplier}
                fill={chartConfig[supplier].color}
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
