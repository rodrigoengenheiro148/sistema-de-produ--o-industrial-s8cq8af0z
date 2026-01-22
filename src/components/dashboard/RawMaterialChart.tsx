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
    // Get unique product types (for stacks)
    const productTypes = Array.from(
      new Set(data.map((item) => item.type)),
    ).sort()

    // Group data by supplier
    const supplierMap = new Map<string, any>()

    data.forEach((item) => {
      if (!supplierMap.has(item.supplier)) {
        supplierMap.set(item.supplier, { supplier: item.supplier })
      }
      const entry = supplierMap.get(item.supplier)
      entry[item.type] = (entry[item.type] || 0) + item.quantity
    })

    // Convert map to array and sort by supplier name
    const processedData = Array.from(supplierMap.values()).sort((a, b) =>
      a.supplier.localeCompare(b.supplier),
    )

    // Generate config with themes
    const config: ChartConfig = {}
    productTypes.forEach((type, index) => {
      // Cycle through chart colors 1-5
      const colorVar = `hsl(var(--chart-${(index % 5) + 1}))`
      config[type] = {
        label: type,
        color: colorVar,
      }
    })

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card
        className={cn('col-span-full shadow-sm border-primary/10', className)}
      >
        <CardHeader>
          <CardTitle>Entrada de MP por Fornecedor</CardTitle>
          <CardDescription>
            Volume total recebido por fornecedor e tipo de material
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
      <BarChart data={chartData} margin={{ top: 20 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="supplier"
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
        {Object.keys(chartConfig).map((productType) => (
          <Bar
            key={productType}
            dataKey={productType}
            fill={chartConfig[productType].color}
            radius={[4, 4, 0, 0]}
            stackId="a"
          >
            <LabelList
              dataKey={productType}
              position="inside"
              className="fill-white font-bold"
              style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.8)' }}
              fontSize={11}
              formatter={(value: any) =>
                value > 0 ? `${(value / 1000).toFixed(0)}k` : ''
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
          <CardTitle>Entrada de MP por Fornecedor</CardTitle>
          <CardDescription>
            Volume total recebido por fornecedor e tipo de material
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
              <DialogTitle>Entrada de MP por Fornecedor</DialogTitle>
              <DialogDescription>
                Detalhamento do volume recebido por fornecedor e produto.
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
