import { useMemo, useState } from 'react'
import { ShippingEntry, ProductionEntry } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  LabelList,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, TrendingUp, DollarSign, Layers, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RevenueChartProps {
  data: ShippingEntry[]
  productionData?: ProductionEntry[]
  timeScale?: 'daily' | 'monthly'
  isMobile?: boolean
  className?: string
}

export function RevenueChart({
  data,
  productionData = [],
  timeScale = 'daily',
  isMobile = false,
  className,
}: RevenueChartProps) {
  const [groupBy, setGroupBy] = useState<'product' | 'client'>('product')

  const {
    chartData,
    chartConfig,
    keys,
    averageRevenue,
    maxRevenue,
    maxDate,
    totalForecast,
  } = useMemo(() => {
    // 1. Calculate Average Unit Prices from Shipping Data (to apply to Production)
    const prices: Record<string, number> = {}
    const counts: Record<string, number> = {}

    data.forEach((s) => {
      const product = s.product
      // Normalize product names if needed or use as is
      if (!prices[product]) {
        prices[product] = 0
        counts[product] = 0
      }
      prices[product] += s.unitPrice * s.quantity // Weighted sum
      counts[product] += s.quantity
    })

    const avgPrices: Record<string, number> = {}
    Object.keys(prices).forEach((p) => {
      avgPrices[p] = counts[p] > 0 ? prices[p] / counts[p] : 0
    })

    // Fallback prices if missing from current shipping data (could use a global constant or history)
    // For now, if 0, we can't forecast value.

    const uniqueKeys = new Set<string>()
    const dateMap = new Map<string, any>()
    let globalTotal = 0
    let globalForecast = 0

    // 2. Process Shipping Data (Actual Revenue)
    data.forEach((s) => {
      if (!s.date) return

      let dateKey: string
      let displayDate: string
      let fullDate: string

      if (timeScale === 'monthly') {
        dateKey = format(s.date, 'yyyy-MM')
        displayDate = format(s.date, 'MMM', { locale: ptBR })
        fullDate = format(s.date, 'MMMM yyyy', { locale: ptBR })
      } else {
        dateKey = format(s.date, 'yyyy-MM-dd')
        displayDate = format(s.date, 'dd/MM')
        fullDate = format(s.date, "dd 'de' MMMM", { locale: ptBR })
      }

      const revenue = s.quantity * s.unitPrice
      const groupKey = groupBy === 'product' ? s.product : s.client

      uniqueKeys.add(groupKey)
      globalTotal += revenue

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          dateKey,
          displayDate,
          fullDate,
          totalRevenue: 0,
          forecastRevenue: 0,
        })
      }

      const entry = dateMap.get(dateKey)
      entry[groupKey] = (entry[groupKey] || 0) + revenue
      entry.totalRevenue += revenue
    })

    // 3. Process Production Data (Forecast Revenue)
    // Forecast = Produced Quantity * Average Unit Price
    productionData.forEach((p) => {
      if (!p.date) return

      let dateKey: string
      let displayDate: string
      let fullDate: string

      if (timeScale === 'monthly') {
        dateKey = format(p.date, 'yyyy-MM')
        displayDate = format(p.date, 'MMM', { locale: ptBR })
        fullDate = format(p.date, 'MMMM yyyy', { locale: ptBR })
      } else {
        dateKey = format(p.date, 'yyyy-MM-dd')
        displayDate = format(p.date, 'dd/MM')
        fullDate = format(p.date, "dd 'de' MMMM", { locale: ptBR })
      }

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          dateKey,
          displayDate,
          fullDate,
          totalRevenue: 0,
          forecastRevenue: 0,
        })
      }

      const entry = dateMap.get(dateKey)

      // Calculate potential value
      const seboValue = p.seboProduced * (avgPrices['Sebo'] || 0)
      const fcoValue =
        p.fcoProduced * (avgPrices['FCO'] || avgPrices['Farinha'] || 0)
      const farinhetaValue = p.farinhetaProduced * (avgPrices['Farinheta'] || 0)

      const dailyForecast = seboValue + fcoValue + farinhetaValue
      entry.forecastRevenue += dailyForecast
      globalForecast += dailyForecast
    })

    const processedData = Array.from(dateMap.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    )

    const avg =
      processedData.length > 0 ? globalTotal / processedData.length : 0

    // Find peak
    let max = 0
    let mDate = ''
    processedData.forEach((d) => {
      if (d.totalRevenue > max) {
        max = d.totalRevenue
        mDate = d.fullDate
      }
    })

    const sortedKeys = Array.from(uniqueKeys).sort()
    const config: ChartConfig = {
      forecastRevenue: {
        label: 'Projeção (Produção)',
        color: 'hsl(var(--muted-foreground))',
      },
    }

    // Assign colors based on index or specific mapping if needed
    sortedKeys.forEach((key, index) => {
      config[key] = {
        label: key,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }
    })

    // Fallback config if no keys
    if (Object.keys(config).length === 1) {
      // Only forecast
      config['revenue'] = { label: 'Receita', color: 'hsl(var(--primary))' }
    }

    return {
      chartData: processedData,
      chartConfig: config,
      keys: sortedKeys,
      totalRevenue: globalTotal,
      averageRevenue: avg,
      maxRevenue: max,
      maxDate: mDate,
      totalForecast: globalForecast,
    }
  }, [data, productionData, groupBy, timeScale])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)

  const formatCompact = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 1,
    }).format(value)

  if ((!data || data.length === 0) && productionData.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Receita {timeScale === 'monthly' ? 'Mensal' : 'Diária'}
          </CardTitle>
          <CardDescription>
            Acompanhamento do faturamento{' '}
            {timeScale === 'monthly' ? 'mensal' : 'diário'}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de faturamento ou produção disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
        />
        <XAxis
          dataKey="displayDate"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 35 : 60}
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              compactDisplay: 'short',
              style: 'currency',
              currency: 'BRL',
            }).format(value)
          }
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) => {
                return payload[0]?.payload?.fullDate || value
              }}
              formatter={(value, name, item) => (
                <div className="flex items-center gap-2 w-full min-w-[150px]">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground flex-1 text-xs">
                    {name}
                  </span>
                  <span className="font-semibold text-foreground text-xs font-mono">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />

        {/* Actual Revenue Bars */}
        {keys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={`var(--color-${key})`}
            radius={[0, 0, 0, 0]}
            maxBarSize={60}
          >
            {/* Only show labels on bars if not cluttered, maybe skip for monthly if many months */}
            <LabelList
              dataKey={key}
              position="inside"
              className="fill-white font-bold"
              style={{
                textShadow: '0px 1px 2px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
              fontSize={isMobile ? 9 : 10}
              formatter={(value: number) => {
                // Only show if bar is tall enough relative to max
                if (value === 0) return ''
                return formatCompact(value)
              }}
            />
          </Bar>
        ))}

        {/* Forecast Line */}
        <Line
          type="monotone"
          dataKey="forecastRevenue"
          name="Projeção (Produção)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: 'hsl(var(--muted-foreground))' }}
        />

        {/* Average Line */}
        <ReferenceLine
          y={averageRevenue}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="3 3"
          label={{
            position: 'insideBottomRight',
            value: 'Média',
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 10,
          }}
        />
      </ComposedChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Receita {timeScale === 'monthly' ? 'Mensal' : 'Diária'}
            </CardTitle>
            <CardDescription>
              Realizado (Expedição) vs Projetado (Produção)
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Tabs
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as 'product' | 'client')}
              className="w-[200px]"
            >
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="product" className="text-xs px-2 h-6">
                  <Layers className="h-3 w-3 mr-1" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="client" className="text-xs px-2 h-6">
                  <Users className="h-3 w-3 mr-1" />
                  Clientes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted"
                >
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Expandir</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    Detalhamento de Receita{' '}
                    {timeScale === 'monthly' ? 'Mensal' : 'Diária'}
                  </DialogTitle>
                  <DialogDescription>
                    Visualização expandida do faturamento.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 w-full min-h-0 py-4">
                  <ChartContent height="h-full" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                  <div>
                    Média Real:{' '}
                    <span className="font-medium text-foreground">
                      {formatCurrency(averageRevenue)}
                    </span>
                  </div>
                  <div>
                    Projeção Total (Período):{' '}
                    <span className="font-medium text-foreground">
                      {formatCurrency(totalForecast)}
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 min-h-0">
        <ChartContent />
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t bg-muted/5 pt-4">
        {maxRevenue > 0 ? (
          <div className="flex w-full items-start gap-2 leading-none">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            <div className="grid gap-1">
              <span className="font-medium text-foreground">
                Pico de Faturamento: {formatCurrency(maxRevenue)}
              </span>
              <span className="text-muted-foreground text-xs">
                Registrado em {maxDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Sem faturamento registrado no período.
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
