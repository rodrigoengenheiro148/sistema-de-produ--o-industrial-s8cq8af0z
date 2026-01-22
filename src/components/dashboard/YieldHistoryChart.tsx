import { useMemo, useState } from 'react'
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
  ChartTooltipContent,
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
import { cn } from '@/lib/utils'

interface YieldHistoryChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

// Helper to calculate exponential trend line points: y = a * e^(b * x)
const calculateExponentialTrend = (dataPoints: number[]) => {
  // Filter valid points for regression (y > 0 for log)
  // x is the index
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

  // Generate trend points for all original indices
  return dataPoints.map((_, x) => {
    const val = a * Math.exp(b * x)
    // Cap at 100% or 0% for sanity, though exponential can grow indefinitely
    return Math.max(0, Math.min(100, val))
  })
}

export function YieldHistoryChart({
  data,
  isMobile = false,
  className,
}: YieldHistoryChartProps) {
  const [timeScale, setTimeScale] = useState<'daily' | 'monthly'>('daily')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    'sebo',
    'fco',
    'farinheta',
  ])

  const { chartData, chartConfig } = useMemo(() => {
    let processedData: any[] = []

    // 1. Prepare Base Data
    if (timeScale === 'daily') {
      processedData = data
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((p) => ({
          date: format(p.date, 'dd/MM'),
          fullDate: p.date,
          sebo: p.mpUsed > 0 ? (p.seboProduced / p.mpUsed) * 100 : 0,
          fco: p.mpUsed > 0 ? (p.fcoProduced / p.mpUsed) * 100 : 0,
          farinheta: p.mpUsed > 0 ? (p.farinhetaProduced / p.mpUsed) * 100 : 0,
        }))
    } else {
      // Monthly Aggregation
      const monthlyData = new Map<string, any>()
      const sortedData = [...data].sort(
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
          })
        }

        const entry = monthlyData.get(monthKey)
        entry.mpUsed += p.mpUsed
        entry.seboProduced += p.seboProduced
        entry.fcoProduced += p.fcoProduced
        entry.farinhetaProduced += p.farinhetaProduced
      })

      processedData = Array.from(monthlyData.values()).map((entry) => ({
        date: entry.date,
        sebo: entry.mpUsed > 0 ? (entry.seboProduced / entry.mpUsed) * 100 : 0,
        fco: entry.mpUsed > 0 ? (entry.fcoProduced / entry.mpUsed) * 100 : 0,
        farinheta:
          entry.mpUsed > 0 ? (entry.farinhetaProduced / entry.mpUsed) * 100 : 0,
      }))
    }

    // 2. Calculate Trend Lines
    // Extract series
    const seboSeries = processedData.map((d) => d.sebo as number)
    const fcoSeries = processedData.map((d) => d.fco as number)
    const farinhetaSeries = processedData.map((d) => d.farinheta as number)

    // Compute trends
    const seboTrend = calculateExponentialTrend(seboSeries)
    const fcoTrend = calculateExponentialTrend(fcoSeries)
    const farinhetaTrend = calculateExponentialTrend(farinhetaSeries)

    // Merge trends back into processedData
    const finalData = processedData.map((item, index) => ({
      ...item,
      sebo_trend: seboTrend[index],
      fco_trend: fcoTrend[index],
      farinheta_trend: farinhetaTrend[index],
    }))

    const config: ChartConfig = {
      sebo: { label: 'Sebo', color: 'hsl(var(--chart-1))' },
      fco: { label: 'FCO', color: 'hsl(var(--chart-2))' },
      farinheta: { label: 'Farinheta', color: 'hsl(var(--chart-3))' },
      sebo_trend: { label: 'Tendência Sebo', color: 'hsl(var(--chart-1))' },
      fco_trend: { label: 'Tendência FCO', color: 'hsl(var(--chart-2))' },
      farinheta_trend: {
        label: 'Tendência Farinheta',
        color: 'hsl(var(--chart-3))',
      },
    }

    return { chartData: finalData, chartConfig: config }
  }, [data, timeScale])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>
            Evolução percentual dos rendimentos com tendência
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de rendimento disponível.
        </CardContent>
      </Card>
    )
  }

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        if (prev.length === 1) return prev
        return prev.filter((p) => p !== product)
      }
      return [...prev, product]
    })
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
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />

        {/* Bars */}
        {selectedProducts.includes('sebo') && (
          <Bar
            dataKey="sebo"
            fill="var(--color-sebo)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            name="Sebo"
          >
            <LabelList
              dataKey="sebo"
              position="top"
              offset={5}
              className="fill-foreground font-bold"
              fontSize={10}
              formatter={(value: any) =>
                value > 0 ? `${value.toFixed(1)}%` : ''
              }
            />
          </Bar>
        )}
        {selectedProducts.includes('fco') && (
          <Bar
            dataKey="fco"
            fill="var(--color-fco)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            name="FCO"
          >
            <LabelList
              dataKey="fco"
              position="top"
              offset={5}
              className="fill-foreground font-bold"
              fontSize={10}
              formatter={(value: any) =>
                value > 0 ? `${value.toFixed(1)}%` : ''
              }
            />
          </Bar>
        )}
        {selectedProducts.includes('farinheta') && (
          <Bar
            dataKey="farinheta"
            fill="var(--color-farinheta)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            name="Farinheta"
          >
            <LabelList
              dataKey="farinheta"
              position="top"
              offset={5}
              className="fill-foreground font-bold"
              fontSize={10}
              formatter={(value: any) =>
                value > 0 ? `${value.toFixed(1)}%` : ''
              }
            />
          </Bar>
        )}

        {/* Trend Lines (Exponential) */}
        {selectedProducts.includes('sebo') && (
          <Line
            type="monotone"
            dataKey="sebo_trend"
            stroke="var(--color-sebo)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Tend. Sebo"
          />
        )}
        {selectedProducts.includes('fco') && (
          <Line
            type="monotone"
            dataKey="fco_trend"
            stroke="var(--color-fco)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Tend. FCO"
          />
        )}
        {selectedProducts.includes('farinheta') && (
          <Line
            type="monotone"
            dataKey="farinheta_trend"
            stroke="var(--color-farinheta)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Tend. Farinheta"
          />
        )}
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
            Evolução percentual dos rendimentos com tendência
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Time Scale Toggle */}
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

          {/* Product Filter */}
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
              <DropdownMenuCheckboxItem
                checked={selectedProducts.includes('sebo')}
                onCheckedChange={() => toggleProduct('sebo')}
              >
                Sebo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedProducts.includes('fco')}
                onCheckedChange={() => toggleProduct('fco')}
              >
                FCO (Farinha)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedProducts.includes('farinheta')}
                onCheckedChange={() => toggleProduct('farinheta')}
              >
                Farinheta
              </DropdownMenuCheckboxItem>
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
                  Visualização detalhada dos rendimentos com análise de
                  tendência.
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
