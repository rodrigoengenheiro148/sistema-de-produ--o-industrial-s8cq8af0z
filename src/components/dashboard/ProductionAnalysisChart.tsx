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
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useData } from '@/context/DataContext'

interface ProductionAnalysisChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

export function ProductionAnalysisChart({
  data,
  isMobile = false,
  className,
}: ProductionAnalysisChartProps) {
  const { factories, currentFactoryId } = useData()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)
  const isFarinorte = currentFactory?.name === 'Farinorte'

  const { chartData, chartConfig } = useMemo(() => {
    const dailyMap = new Map<string, { date: Date; mp: number; prod: number }>()

    data.forEach((item) => {
      if (!item.date) return
      const dateKey = format(item.date, 'yyyy-MM-dd')
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: item.date, mp: 0, prod: 0 })
      }
      const entry = dailyMap.get(dateKey)!

      entry.mp += item.mpUsed || 0

      let prod = (item.seboProduced || 0) + (item.fcoProduced || 0)
      if (!isFarinorte) {
        prod += item.farinhetaProduced || 0
      }
      prod += item.featherMealProduced || 0
      prod += item.fishMealProduced || 0
      prod += item.viscerasMealProduced || 0
      prod += item.viscerasOilProduced || 0

      entry.prod += prod
    })

    const processedData = Array.from(dailyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((entry) => ({
        date: format(entry.date, 'dd/MM'),
        fullDate: format(entry.date, "dd 'de' MMMM", { locale: ptBR }),
        mp: entry.mp,
        prod: entry.prod,
      }))

    const config = {
      prod: {
        label: 'Produção Total (Industrial)',
        color: '#15803d', // Green 700
      },
      mp: {
        label: 'MP Processada',
        color: '#f97316', // Orange 500
      },
    } satisfies ChartConfig

    return { chartData: processedData, chartConfig: config }
  }, [data, isFarinorte])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise de Produção
          </CardTitle>
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

  const formatK = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
    return val.toString()
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
      <LineChart
        data={chartData}
        margin={{ top: 30, right: 20, left: 0, bottom: 0 }}
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
          minTickGap={30}
          fontSize={12}
          tick={{ fill: '#6b7280' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={formatK}
          width={45}
          fontSize={12}
          tick={{ fill: '#6b7280' }}
          domain={[0, 'auto']}
        />
        <ChartTooltip
          cursor={{
            stroke: 'hsl(var(--muted-foreground)/0.2)',
            strokeWidth: 1,
            strokeDasharray: '4 4',
          }}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) =>
                payload[0]?.payload?.fullDate || value
              }
              formatter={(value, name, item) => (
                <div className="flex items-center gap-2 w-full text-xs">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground flex-1">{name}</span>
                  <span className="font-mono font-medium">
                    {Number(value).toLocaleString('pt-BR')} kg
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} className="pt-6" />

        <Line
          type="monotone"
          dataKey="mp"
          name="MP Processada"
          stroke="var(--color-mp)"
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 6,
            fill: 'var(--color-mp)',
            stroke: '#fff',
            strokeWidth: 2,
          }}
        >
          <LabelList
            dataKey="mp"
            position="top"
            offset={10}
            className="fill-foreground font-bold text-[10px] md:text-xs"
            formatter={formatK}
          />
        </Line>
        <Line
          type="monotone"
          dataKey="prod"
          name="Produção Total (Industrial)"
          stroke="var(--color-prod)"
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 6,
            fill: 'var(--color-prod)',
            stroke: '#fff',
            strokeWidth: 2,
          }}
        >
          <LabelList
            dataKey="prod"
            position="top"
            offset={10}
            className="fill-foreground font-bold text-[10px] md:text-xs"
            formatter={formatK}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#15803d]" />
            Análise de Produção
          </CardTitle>
          <CardDescription>
            Comparativo diário de processamento industrial (exclui sangue)
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Análise de Produção</DialogTitle>
                <DialogDescription>
                  Comparativo detalhado de processamento industrial.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full min-h-0 py-4">
                <ChartContent height="h-full" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 min-h-[300px]">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
