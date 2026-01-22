import { useMemo } from 'react'
import { ShippingEntry } from '@/lib/types'
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
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
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
import { Maximize2, TrendingUp, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueChartProps {
  data: ShippingEntry[]
  isMobile?: boolean
  className?: string
}

export function RevenueChart({
  data,
  isMobile = false,
  className,
}: RevenueChartProps) {
  const {
    chartData,
    chartConfig,
    totalRevenue,
    averageRevenue,
    maxRevenue,
    maxDate,
  } = useMemo(() => {
    const revenueMap = new Map<string, number>()

    // Group by ISO date to ensure correct sorting across years/months
    data.forEach((s) => {
      if (!s.date) return
      const key = format(s.date, 'yyyy-MM-dd')
      revenueMap.set(key, (revenueMap.get(key) || 0) + s.quantity * s.unitPrice)
    })

    const processedData = Array.from(revenueMap.entries())
      .map(([dateKey, revenue]) => {
        const dateObj = parseISO(dateKey)
        return {
          dateKey, // for sorting
          displayDate: format(dateObj, 'dd/MM'),
          fullDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }),
          revenue,
        }
      })
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

    const total = processedData.reduce((acc, curr) => acc + curr.revenue, 0)
    const avg = processedData.length > 0 ? total / processedData.length : 0

    // Find peak
    let max = 0
    let mDate = ''
    processedData.forEach((d) => {
      if (d.revenue > max) {
        max = d.revenue
        mDate = d.fullDate
      }
    })

    const config: ChartConfig = {
      revenue: {
        label: 'Faturamento',
        color: 'hsl(var(--primary))',
      },
    }

    return {
      chartData: processedData,
      chartConfig: config,
      totalRevenue: total,
      averageRevenue: avg,
      maxRevenue: max,
      maxDate: mDate,
    }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Receita Diária
          </CardTitle>
          <CardDescription>
            Acompanhamento do faturamento diário
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de faturamento disponível.
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
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
          width={isMobile ? 40 : 80}
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
              formatter={(value) => (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.revenue === maxRevenue && chartData.length > 1
                  ? 'hsl(var(--chart-2))'
                  : 'hsl(var(--primary))'
              }
            />
          ))}
        </Bar>
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
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Receita Diária
          </CardTitle>
          <CardDescription>
            Análise de faturamento por dia de expedição
          </CardDescription>
        </div>
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
          <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Detalhamento de Receita Diária</DialogTitle>
              <DialogDescription>
                Visualização expandida do faturamento diário e tendências.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground border-t pt-4">
              <div>
                Média do Período:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(averageRevenue)}
                </span>
              </div>
              {maxRevenue > 0 && (
                <div>
                  Pico do Período:{' '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(maxRevenue)}
                  </span>{' '}
                  ({maxDate})
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4 flex-1 min-h-0">
        <ChartContent />
      </CardContent>
      {maxRevenue > 0 && (
        <CardFooter className="flex-col items-start gap-2 text-sm border-t bg-muted/5 pt-4">
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
        </CardFooter>
      )}
    </Card>
  )
}
