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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RawMaterialChartProps {
  data: RawMaterialEntry[]
  className?: string
}

export function RawMaterialChart({ data, className }: RawMaterialChartProps) {
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
    const config: ChartConfig = {}
    suppliers.forEach((supplier, index) => {
      const colorVar = `hsl(var(--chart-${(index % 5) + 1}))`
      config[supplier] = {
        label: supplier,
        color: colorVar,
      }
    })

    return { chartData: sortedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card
        className={cn('col-span-full shadow-sm border-primary/10', className)}
      >
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

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart data={chartData} margin={{ top: 10 }}>
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
          >
            <LabelList
              dataKey={supplier}
              position="inside"
              className="fill-white font-bold"
              style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
              fontSize={11}
              formatter={(value: any) =>
                value > 0 ? `${Number(value).toLocaleString('pt-BR')} kg` : ''
              }
            />
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('col-span-full shadow-sm border-primary/10', className)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Entrada Diária de MP por Fornecedor</CardTitle>
          <CardDescription>
            Volume recebido por dia detalhado por fornecedor
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Expandir</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Entrada Diária de MP por Fornecedor</DialogTitle>
              <DialogDescription>
                Detalhamento do volume recebido por fornecedor.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
