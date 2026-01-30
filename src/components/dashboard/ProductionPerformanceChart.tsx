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
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
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
  const { chartData, chartConfig } = useMemo(() => {
    let processedData = []

    if (timeScale === 'monthly') {
      const monthlyData = new Map<string, any>()

      data.forEach((p) => {
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
        entry.producao += p.seboProduced + p.fcoProduced + p.farinhetaProduced
        entry.mp += p.mpUsed
      })

      processedData = Array.from(monthlyData.values()).sort((a, b) =>
        a.dateKey.localeCompare(b.dateKey),
      )
    } else {
      // Daily
      processedData = data
        .map((p) => ({
          date: format(p.date, 'dd/MM'),
          fullDate: format(p.date, "dd 'de' MMMM", { locale: ptBR }),
          originalDate: p.date,
          producao: p.seboProduced + p.fcoProduced + p.farinhetaProduced,
          mp: p.mpUsed,
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
    }

    const config: ChartConfig = {
      producao: {
        label: 'Produção Total',
        color: '#166534', // Dark Green (emerald-800)
      },
      mp: {
        label: 'MP Processada',
        color: '#f59e0b', // Amber/Yellow (amber-500)
      },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data, timeScale])

  if (!data || data.length === 0) {
    return (
      <Card className={`shadow-sm border-primary/10 ${className}`}>
        <CardHeader>
          <CardTitle>Desempenho de Produção</CardTitle>
          <CardDescription>Comparativo diário de processamento</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          fontSize={isMobile ? 10 : 12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 35 : 50}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          fontSize={isMobile ? 10 : 12}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(value, payload) =>
                payload[0]?.payload?.fullDate || value
              }
            />
          }
          cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="producao"
          stroke="var(--color-producao)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: 'var(--color-producao)' }}
          animationDuration={1000}
        />
        <Line
          type="monotone"
          dataKey="mp"
          stroke="var(--color-mp)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: 'var(--color-mp)' }}
          animationDuration={1000}
        />
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card className={`shadow-sm border-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Desempenho de Produção
          </CardTitle>
          <CardDescription>Comparativo diário de processamento</CardDescription>
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
              <DialogTitle>Desempenho de Produção</DialogTitle>
              <DialogDescription>
                Visualização detalhada do processamento de MP e produção total.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4 pl-0 sm:pl-2">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
