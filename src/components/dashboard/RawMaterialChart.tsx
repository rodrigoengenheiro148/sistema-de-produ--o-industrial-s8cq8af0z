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
import { format } from 'date-fns'

interface RawMaterialChartProps {
  data: RawMaterialEntry[]
  className?: string
  isMobile?: boolean
}

export function RawMaterialChart({
  data,
  className,
  isMobile = false,
}: RawMaterialChartProps) {
  // Process data for the chart
  const { chartData, chartConfig } = useMemo(() => {
    // Get unique product types (for stacks)
    const productTypes = Array.from(
      new Set(data.map((item) => item.type)),
    ).sort()

    // Group data by supplier
    const supplierMap = new Map<string, any>()

    data.forEach((item) => {
      // Normalize supplier name to avoid duplicates due to spacing
      const supplierName = item.supplier.trim()

      if (!supplierMap.has(supplierName)) {
        supplierMap.set(supplierName, {
          supplier: supplierName,
          _breakdown: {}, // Map to store entries by type for tooltip details
          total: 0, // Track total for sorting if needed
        })
      }
      const entry = supplierMap.get(supplierName)

      // Sum quantity per type
      entry[item.type] = (entry[item.type] || 0) + item.quantity

      // Update total
      entry.total += item.quantity

      // Store entry for breakdown
      if (!entry._breakdown[item.type]) {
        entry._breakdown[item.type] = []
      }
      entry._breakdown[item.type].push(item)
    })

    // Convert map to array and sort by supplier name alphabetically
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
      <BarChart
        data={chartData}
        margin={{ top: 20, left: isMobile ? 0 : 20, right: 10 }}
        layout={isMobile ? 'vertical' : 'horizontal'}
      >
        <CartesianGrid
          vertical={!isMobile}
          horizontal={isMobile}
          strokeDasharray="3 3"
        />
        {isMobile ? (
          <>
            <XAxis type="number" hide />
            <YAxis
              dataKey="supplier"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, width: 100 }}
              width={100}
            />
          </>
        ) : (
          <>
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
          </>
        )}
        <ChartTooltip
          cursor={{ fill: 'transparent' }}
          content={
            <ChartTooltipContent
              className="w-auto min-w-[200px] max-w-[300px]"
              formatter={(value, name, item) => {
                const type = name as string
                // item.payload is the chart data entry (supplierMap value)
                const entry = item.payload
                const breakdown = entry._breakdown?.[type] as
                  | RawMaterialEntry[]
                  | undefined

                // Sort breakdown by date descending
                const sortedBreakdown = breakdown
                  ? [...breakdown].sort(
                      (a, b) => b.date.getTime() - a.date.getTime(),
                    )
                  : []

                return (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex w-full justify-between gap-2 items-center border-b pb-1 mb-1 border-border/50">
                      <span className="text-muted-foreground font-semibold">
                        {name}
                      </span>
                      <span className="font-mono font-bold">
                        {Number(value).toLocaleString('pt-BR')} kg
                      </span>
                    </div>
                    {sortedBreakdown.length > 0 && (
                      <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1">
                        {sortedBreakdown.map((record, idx) => (
                          <div
                            key={record.id || idx}
                            className="flex justify-between gap-4 text-xs"
                          >
                            <span className="text-muted-foreground">
                              {format(record.date, 'dd/MM/yyyy')}
                            </span>
                            <span className="font-mono text-foreground/80">
                              {record.quantity.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {Object.keys(chartConfig).map((productType) => (
          <Bar
            key={productType}
            dataKey={productType}
            fill={chartConfig[productType].color}
            radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            stackId="a"
            maxBarSize={50}
          >
            {!isMobile && (
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
            )}
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
        <ChartContent height={isMobile ? 'h-[400px]' : 'h-[350px]'} />
      </CardContent>
    </Card>
  )
}
