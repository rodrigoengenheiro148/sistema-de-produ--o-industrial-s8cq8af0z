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
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'
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
import { Maximize2, AlertTriangle } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface LossesAnalysisChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

export function LossesAnalysisChart({
  data,
  isMobile = false,
  className,
}: LossesAnalysisChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const dailyMap = new Map<
      string,
      { losses: number; mpUsed: number; date: Date }
    >()

    data.forEach((p) => {
      if (!p.date) return
      const dateKey = format(p.date, 'yyyy-MM-dd')
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { losses: 0, mpUsed: 0, date: p.date })
      }
      const entry = dailyMap.get(dateKey)!
      entry.losses += p.losses || 0
      entry.mpUsed += p.mpUsed || 0
    })

    const processedData = Array.from(dailyMap.values())
      .filter((d) => d.losses > 0)
      .map((d) => ({
        date: format(d.date, 'dd/MM'),
        fullDate: format(d.date, "dd 'de' MMMM", { locale: ptBR }),
        originalDate: d.date,
        losses: d.losses,
        percentage: d.mpUsed > 0 ? (d.losses / d.mpUsed) * 100 : 0,
      }))
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

    const config = {
      losses: {
        label: 'Perdas (kg)',
        color: '#ef4444', // Red-500
      },
    } satisfies ChartConfig

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Análise de Perdas</CardTitle>
          <CardDescription>
            Volume de quebra técnica e perdas diárias ( &gt; 0kg )
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de perda registrado.
        </CardContent>
      </Card>
    )
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toString()
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart
        data={chartData}
        margin={{ top: 25, right: 10, left: 0, bottom: 0 }}
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
          tickMargin={10}
          minTickGap={30}
          fontSize={12}
          tick={{ fill: '#6b7280' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={formatYAxis}
          width={45}
          fontSize={12}
          tick={{ fill: '#6b7280' }}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
          content={
            <ChartTooltipContent
              formatter={(value, name, props) => (
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-red-600">
                    {formatNumber(Number(value))} kg
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({props.payload.percentage.toFixed(1)}% da MP)
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="losses"
          fill="var(--color-losses)"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
          name="Perdas"
        >
          <LabelList
            dataKey="percentage"
            position="top"
            formatter={(val: number) => `${val.toFixed(1)}%`}
            className="fill-foreground font-bold"
            fontSize={isMobile ? 10 : 12}
            offset={8}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Análise de Perdas
          </CardTitle>
          <CardDescription>
            Volume de quebra técnica e perdas diárias ( &gt; 0kg )
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
                <DialogTitle>Análise de Perdas</DialogTitle>
                <DialogDescription>
                  Volume de quebra técnica e perdas diárias expandido.
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
