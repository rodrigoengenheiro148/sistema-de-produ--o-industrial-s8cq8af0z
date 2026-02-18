import { useMemo, useState, useEffect } from 'react'
import { ProductionEntry } from '@/lib/types'
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
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'
import {
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts'
import { format } from 'date-fns'
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
import { Maximize2, CalendarDays, CalendarRange, Filter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, isBloodRecord } from '@/lib/utils'
import { useData } from '@/context/DataContext'

interface YieldHistoryChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

const calculateExponentialTrend = (dataPoints: number[]) => {
  const validPoints = dataPoints
    .map((y, x) => ({ x, y }))
    .filter((p) => p.y > 0)

  if (validPoints.length < 2) return Array(dataPoints.length).fill(null)

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0
  const n = validPoints.length

  validPoints.forEach((p) => {
    const logY = Math.log(p.y)
    sumX += p.x
    sumY += logY
    sumXY += p.x * logY
    sumXX += p.x * p.x
  })

  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return Array(dataPoints.length).fill(null)

  const b = (n * sumXY - sumX * sumY) / denominator
  const a = Math.exp((sumY - b * sumX) / n)

  return dataPoints.map((_, x) => {
    const val = a * Math.exp(b * x)
    return Math.max(0, Math.min(100, val))
  })
}

export function YieldHistoryChart({
  data,
  isMobile = false,
  className,
}: YieldHistoryChartProps) {
  const { factories, currentFactoryId } = useData()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)
  // Check for 'Mar Reciclagem' or 'Mar' as per requirements
  const isMarReciclagem =
    currentFactory?.name === 'Mar Reciclagem' || currentFactory?.name === 'Mar'
  // Check for 'Farinorte' as per requirements
  const isFarinorte = currentFactory?.name === 'Farinorte'

  const [timeScale, setTimeScale] = useState<'daily' | 'monthly'>('daily')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Initialize selected products based on factory
  useEffect(() => {
    if (isMarReciclagem) {
      setSelectedProducts([
        'farinhaCarne',
        'farinhaVisceras',
        'farinhaPenas',
        'sebo',
        'oleo',
      ])
    } else {
      if (isFarinorte) {
        setSelectedProducts(['sebo', 'fco'])
      } else {
        setSelectedProducts(['sebo', 'fco', 'farinheta'])
      }
    }
  }, [isMarReciclagem, isFarinorte])

  const { chartData, chartConfig } = useMemo(() => {
    const industrialData = data.filter((p) => !isBloodRecord(p))
    let processedData: any[] = []

    const mapYield = (prod: number, mp: number) =>
      mp > 0 ? (prod / mp) * 100 : 0

    if (timeScale === 'daily') {
      processedData = industrialData
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((p) => {
          const entry: any = {
            date: format(p.date, 'dd/MM'),
            fullDate: p.date,
          }
          if (isMarReciclagem) {
            entry.farinhaCarne = mapYield(p.fcoProduced, p.mpUsed)
            entry.farinhaVisceras = mapYield(
              p.viscerasMealProduced || 0,
              p.mpUsed,
            )
            entry.farinhaPenas = mapYield(p.featherMealProduced || 0, p.mpUsed)
            entry.sebo = mapYield(p.seboProduced, p.mpUsed)
            entry.oleo = mapYield(p.viscerasOilProduced || 0, p.mpUsed)
          } else {
            entry.sebo = mapYield(p.seboProduced, p.mpUsed)
            entry.fco = mapYield(p.fcoProduced, p.mpUsed)
            if (!isFarinorte) {
              entry.farinheta = mapYield(p.farinhetaProduced, p.mpUsed)
            }
          }
          return entry
        })
    } else {
      const monthlyData = new Map<string, any>()
      const sortedData = [...industrialData].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      )

      sortedData.forEach((p) => {
        const monthKey = format(p.date, 'yyyy-MM')
        const displayDate = format(p.date, 'MMM/yy', { locale: ptBR })

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            monthKey,
            date: displayDate,
            mpUsed: 0,
            seboProduced: 0,
            fcoProduced: 0,
            farinhetaProduced: 0,
            viscerasMealProduced: 0,
            featherMealProduced: 0,
            viscerasOilProduced: 0,
          })
        }

        const entry = monthlyData.get(monthKey)
        entry.mpUsed += p.mpUsed
        entry.seboProduced += p.seboProduced
        entry.fcoProduced += p.fcoProduced
        entry.farinhetaProduced += p.farinhetaProduced
        entry.viscerasMealProduced += p.viscerasMealProduced || 0
        entry.featherMealProduced += p.featherMealProduced || 0
        entry.viscerasOilProduced += p.viscerasOilProduced || 0
      })

      processedData = Array.from(monthlyData.values()).map((entry) => {
        const result: any = { date: entry.date }
        if (isMarReciclagem) {
          result.farinhaCarne = mapYield(entry.fcoProduced, entry.mpUsed)
          result.farinhaVisceras = mapYield(
            entry.viscerasMealProduced,
            entry.mpUsed,
          )
          result.farinhaPenas = mapYield(
            entry.featherMealProduced,
            entry.mpUsed,
          )
          result.sebo = mapYield(entry.seboProduced, entry.mpUsed)
          result.oleo = mapYield(entry.viscerasOilProduced, entry.mpUsed)
        } else {
          result.sebo = mapYield(entry.seboProduced, entry.mpUsed)
          result.fco = mapYield(entry.fcoProduced, entry.mpUsed)
          if (!isFarinorte) {
            result.farinheta = mapYield(entry.farinhetaProduced, entry.mpUsed)
          }
        }
        return result
      })
    }

    // Trends calculation
    let trends: any = {}
    if (isMarReciclagem) {
      trends.farinhaCarne_trend = calculateExponentialTrend(
        processedData.map((d) => d.farinhaCarne),
      )
      trends.farinhaVisceras_trend = calculateExponentialTrend(
        processedData.map((d) => d.farinhaVisceras),
      )
      trends.farinhaPenas_trend = calculateExponentialTrend(
        processedData.map((d) => d.farinhaPenas),
      )
      trends.sebo_trend = calculateExponentialTrend(
        processedData.map((d) => d.sebo),
      )
      trends.oleo_trend = calculateExponentialTrend(
        processedData.map((d) => d.oleo),
      )
    } else {
      trends.sebo_trend = calculateExponentialTrend(
        processedData.map((d) => d.sebo),
      )
      trends.fco_trend = calculateExponentialTrend(
        processedData.map((d) => d.fco),
      )
      if (!isFarinorte) {
        trends.farinheta_trend = calculateExponentialTrend(
          processedData.map((d) => d.farinheta),
        )
      }
    }

    const finalData = processedData.map((item, index) => {
      const trendItem: any = {}
      Object.keys(trends).forEach((key) => {
        trendItem[key] = trends[key][index]
      })
      return { ...item, ...trendItem }
    })

    let config: ChartConfig
    if (isMarReciclagem) {
      config = {
        farinhaCarne: { label: 'Far. Carne', color: 'hsl(var(--chart-1))' },
        farinhaVisceras: {
          label: 'Far. Vísceras',
          color: 'hsl(var(--chart-2))',
        },
        farinhaPenas: { label: 'Far. Penas', color: 'hsl(var(--chart-3))' },
        sebo: { label: 'Sebo', color: 'hsl(var(--chart-4))' },
        oleo: { label: 'Óleo', color: 'hsl(var(--chart-5))' },
        farinhaCarne_trend: {
          label: 'Tend. Far. Carne',
          color: 'hsl(var(--chart-1))',
        },
        farinhaVisceras_trend: {
          label: 'Tend. Far. Vísceras',
          color: 'hsl(var(--chart-2))',
        },
        farinhaPenas_trend: {
          label: 'Tend. Far. Penas',
          color: 'hsl(var(--chart-3))',
        },
        sebo_trend: { label: 'Tend. Sebo', color: 'hsl(var(--chart-4))' },
        oleo_trend: { label: 'Tend. Óleo', color: 'hsl(var(--chart-5))' },
      }
    } else {
      config = {
        sebo: { label: 'Sebo', color: 'hsl(var(--chart-1))' },
        fco: { label: 'FCO', color: 'hsl(var(--chart-2))' },
        sebo_trend: { label: 'Tendência Sebo', color: 'hsl(var(--chart-1))' },
        fco_trend: { label: 'Tendência FCO', color: 'hsl(var(--chart-2))' },
      }
      if (!isFarinorte) {
        config.farinheta = { label: 'Farinheta', color: 'hsl(var(--chart-3))' }
        config.farinheta_trend = {
          label: 'Tendência Farinheta',
          color: 'hsl(var(--chart-3))',
        }
      }
    }

    return { chartData: finalData, chartConfig: config }
  }, [data, timeScale, isMarReciclagem, isFarinorte])

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        if (prev.length === 1) return prev
        return prev.filter((p) => p !== product)
      }
      return [...prev, product]
    })
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>
            Evolução percentual dos rendimentos industriais
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de rendimento disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={30}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(value) => `${value}%`}
          domain={[0, 'auto']}
        />
        <ChartTooltip
          cursor={false}
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null
            return (
              <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                <div className="font-medium">{label}</div>
                <div className="grid gap-1.5">
                  {payload.map((item: any) => (
                    <div
                      key={item.dataKey || item.name}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{
                          backgroundColor:
                            item.color || item.payload?.fill || item.fill,
                        }}
                      />
                      <span className="text-muted-foreground">
                        {item.name}:
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {Number(item.value).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }}
        />
        <ChartLegend content={<ChartLegendContent />} />

        {Object.keys(chartConfig)
          .filter((k) => !k.includes('trend') && selectedProducts.includes(k))
          .map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name={chartConfig[key].label as string}
            >
              <LabelList
                dataKey={key}
                position="top"
                offset={5}
                className="fill-foreground font-bold"
                fontSize={10}
                formatter={(value: any) =>
                  value > 0 ? `${value.toFixed(2)}%` : ''
                }
              />
            </Bar>
          ))}

        {Object.keys(chartConfig)
          .filter(
            (k) =>
              k.includes('trend') &&
              selectedProducts.includes(k.replace('_trend', '')),
          )
          .map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key.replace('_trend', '')})`}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name={chartConfig[key].label as string}
            />
          ))}
      </ComposedChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 gap-4">
        <div>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>
            Evolução percentual dos rendimentos industriais com tendência
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="bg-muted/50 p-1 rounded-md flex items-center">
            <Button
              variant={timeScale === 'daily' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeScale('daily')}
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              Dia
            </Button>
            <Button
              variant={timeScale === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeScale('monthly')}
            >
              <CalendarRange className="h-3.5 w-3.5 mr-1" />
              Mês
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtrar Produtos</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar Produtos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(chartConfig)
                .filter((k) => !k.includes('trend'))
                .map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={selectedProducts.includes(key)}
                    onCheckedChange={() => toggleProduct(key)}
                  >
                    {chartConfig[key].label}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Expandir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Histórico de Rendimentos</DialogTitle>
                <DialogDescription>
                  Visualização detalhada dos rendimentos industriais com análise
                  de tendência.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full min-h-0 py-4">
                <ChartContent height="h-full" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
