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
import { BarChart, Bar, CartesianGrid, XAxis, LabelList } from 'recharts'
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
import { Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LossAnalysisChartProps {
  data: ProductionEntry[]
  timeScale?: 'daily' | 'monthly'
  className?: string
}

export function LossAnalysisChart({
  data,
  timeScale = 'daily',
  className,
}: LossAnalysisChartProps) {
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
            perdas: 0,
            mp: 0,
          })
        }
        const entry = monthlyData.get(dateKey)
        entry.perdas += p.losses
        entry.mp += p.mpUsed
      })

      processedData = Array.from(monthlyData.values())
        .filter((d) => d.perdas > 0)
        .map((d) => ({
          ...d,
          percentage: d.mp > 0 ? (d.perdas / d.mp) * 100 : 0,
        }))
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    } else {
      processedData = data
        .filter((p) => p.losses > 0)
        .map((p) => ({
          date: format(p.date, 'dd/MM'),
          originalDate: p.date,
          perdas: p.losses,
          percentage: p.mpUsed > 0 ? (p.losses / p.mpUsed) * 100 : 0,
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
    }

    const config: ChartConfig = {
      perdas: { label: 'Perdas', color: 'hsl(var(--destructive))' },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data, timeScale])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Análise de Perdas</CardTitle>
          <CardDescription>
            Volume de quebra técnica e perdas{' '}
            {timeScale === 'monthly' ? 'mensais' : 'diárias'}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart data={chartData} margin={{ top: 20 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="perdas" fill="var(--color-perdas)" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="percentage"
            position="top"
            offset={8}
            className="fill-foreground font-bold"
            fontSize={11}
            formatter={(value: number) =>
              value > 0 ? `${value.toFixed(1)}%` : ''
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Análise de Perdas</CardTitle>
          <CardDescription>
            Volume de quebra técnica e perdas{' '}
            {timeScale === 'monthly' ? 'mensais' : 'diárias'} ( &gt; 0kg )
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
              <DialogTitle>
                Análise de Perdas (
                {timeScale === 'monthly' ? 'Mensal' : 'Diário'})
              </DialogTitle>
              <DialogDescription>
                Visualização detalhada das perdas com percentual.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4">
        {chartData.length > 0 ? (
          <ChartContent />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma perda registrada no período.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
