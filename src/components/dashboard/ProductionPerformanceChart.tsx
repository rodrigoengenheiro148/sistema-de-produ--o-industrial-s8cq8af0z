import { useMemo } from 'react'
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
import { Maximize2, TrendingUp } from 'lucide-react'
import { formatNumber, cn, isBloodRecord } from '@/lib/utils'
import { useData } from '@/context/DataContext'

interface ProductionPerformanceChartProps {
  data: ProductionEntry[]
  timeScale?: 'daily' | 'monthly'
  isMobile?: boolean
  className?: string
}

export function ProductionPerformanceChart({
  data,
  timeScale = 'daily',
  isMobile = false,
  className,
}: ProductionPerformanceChartProps) {
  const { factories, currentFactoryId } = useData()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)
  const isFarinorte = currentFactory?.name === 'Farinorte'

  const { chartData, chartConfig } = useMemo(() => {
    // Filter out blood records to ensure industrial processing accuracy
    const sourceData = data.filter((p) => !isBloodRecord(p))

    const calculateProd = (p: ProductionEntry) => {
      return (
        (p.seboProduced || 0) +
        (p.fcoProduced || 0) +
        (isFarinorte ? 0 : p.farinhetaProduced || 0) +
        (p.viscerasMealProduced || 0) +
        (p.featherMealProduced || 0) +
        (p.viscerasOilProduced || 0) +
        (p.fishMealProduced || 0)
      )
    }

    let processedData = []

    if (timeScale === 'monthly') {
      const monthlyData = new Map<string, any>()

      sourceData.forEach((p) => {
        if (!p.date) return
        const dateKey = format(p.date, 'yyyy-MM')
        const displayDate = format(p.date, 'MMM/yy', { locale: ptBR })

        if (!monthlyData.has(dateKey)) {
          monthlyData.set(dateKey, {
            dateKey,
            date: displayDate,
            originalDate: p.date,
            producao: 0,
            mp: 0,
          })
        }

        const entry = monthlyData.get(dateKey)
        entry.producao += calculateProd(p)
        entry.mp += p.mpUsed || 0
      })

      processedData = Array.from(monthlyData.values()).sort((a, b) =>
        a.dateKey.localeCompare(b.dateKey),
      )
    } else {
      const dailyData = new Map<string, any>()

      sourceData.forEach((p) => {
        if (!p.date) return
        const dateKey = format(p.date, 'yyyy-MM-dd')

        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, {
            dateKey,
            date: format(p.date, 'dd/MM'),
            fullDate: format(p.date, "dd 'de' MMMM", { locale: ptBR }),
            originalDate: p.date,
            producao: 0,
            mp: 0,
          })
        }

        const entry = dailyData.get(dateKey)
        entry.producao += calculateProd(p)
        entry.mp += p.mpUsed || 0
      })

      processedData = Array.from(dailyData.values()).sort(
        (a, b) => a.originalDate.getTime() - b.originalDate.getTime(),
      )
    }

    const config: ChartConfig = {
      producao: {
        label: 'Produção Total (Industrial)',
        color: '#166534', // Dark green
      },
      mp: {
        label: 'MP Processada',
        color: '#f97316', // Orange
      },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data, timeScale, isFarinorte])

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return formatNumber(value / 1000, { maximumFractionDigits: 0 }) + 'k'
    }
    return formatNumber(value)
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn(`shadow-sm border-border`, className)}>
        <CardHeader>
          <CardTitle>Análise de Produção</CardTitle>
          <CardDescription>
            Comparativo diário de processamento industrial (exclui sangue)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer
      config={chartConfig}
      className={cn(`${height} w-full mt-4 aspect-auto`)}
    >
      <LineChart
        data={chartData}
        margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="#e5e7eb"
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          minTickGap={32}
          fontSize={isMobile ? 10 : 12}
          tick={{ fill: '#6b7280' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 35 : 50}
          tickFormatter={(value) =>
            `${formatNumber(value / 1000, { maximumFractionDigits: 0 })}k`
          }
          fontSize={isMobile ? 10 : 12}
          tick={{ fill: '#6b7280' }}
        />
        <ChartTooltip
          cursor={{
            fill: 'hsl(var(--muted)/0.4)',
            strokeWidth: 1,
            strokeDasharray: '3 3',
          }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(value, payload) =>
                payload[0]?.payload?.fullDate || value
              }
              formatter={(value, name) => (
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        name === 'producao' ||
                        name === 'Produção Total (Industrial)'
                          ? 'var(--color-producao)'
                          : 'var(--color-mp)',
                    }}
                  />
                  <span className="text-muted-foreground text-xs">{name}</span>
                  <span className="font-mono font-bold">
                    {formatNumber(Number(value))} kg
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />

        <Line
          type="monotone"
          dataKey="mp"
          name="MP Processada"
          stroke="var(--color-mp)"
          strokeWidth={3}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            dataKey="mp"
            position="top"
            offset={12}
            className="fill-foreground font-bold"
            fontSize={isMobile ? 10 : 12}
            formatter={formatValue}
          />
        </Line>

        <Line
          type="monotone"
          dataKey="producao"
          name="Produção Total (Industrial)"
          stroke="var(--color-producao)"
          strokeWidth={3}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            dataKey="producao"
            position="top"
            offset={12}
            className="fill-foreground font-bold"
            fontSize={isMobile ? 10 : 12}
            formatter={formatValue}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card className={cn(`shadow-sm border-border flex flex-col`, className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-[#166534]" />
            Análise de Produção
          </CardTitle>
          <CardDescription>
            Comparativo diário de processamento industrial (exclui sangue)
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">Expandir</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Análise de Produção Industrial</DialogTitle>
              <DialogDescription>
                Comparativo diário de processamento industrial (exclui sangue).
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-2 pb-6 pl-0 sm:pl-2 flex-1 min-h-[300px]">
        <ChartContent height="h-full" />
      </CardContent>
    </Card>
  )
}
