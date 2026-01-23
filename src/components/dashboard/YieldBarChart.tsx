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
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, LabelList, YAxis } from 'recharts'
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
import { Maximize2, CalendarDays, CalendarRange, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YieldBarChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

export function YieldBarChart({
  data,
  isMobile = false,
  className,
}: YieldBarChartProps) {
  const [timeScale, setTimeScale] = useState<'daily' | 'monthly'>('daily')

  const { chartData, chartConfig } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], chartConfig: {} }

    let processedData: any[] = []

    if (timeScale === 'daily') {
      const dailyMap = new Map<
        string,
        { date: Date; mp: number; prod: number }
      >()

      data.forEach((item) => {
        const key = format(item.date, 'yyyy-MM-dd')
        if (!dailyMap.has(key)) {
          dailyMap.set(key, { date: item.date, mp: 0, prod: 0 })
        }
        const entry = dailyMap.get(key)!
        entry.mp += item.mpUsed
        entry.prod +=
          item.seboProduced + item.fcoProduced + item.farinhetaProduced
      })

      processedData = Array.from(dailyMap.values())
        .map((entry) => ({
          date: format(entry.date, 'dd/MM'),
          fullDate: format(entry.date, "dd 'de' MMMM", { locale: ptBR }),
          originalDate: entry.date,
          yield: entry.mp > 0 ? (entry.prod / entry.mp) * 100 : 0,
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
    } else {
      const monthlyMap = new Map<
        string,
        { date: Date; mp: number; prod: number }
      >()

      data.forEach((item) => {
        const key = format(item.date, 'yyyy-MM')
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { date: item.date, mp: 0, prod: 0 })
        }
        const entry = monthlyMap.get(key)!
        entry.mp += item.mpUsed
        entry.prod +=
          item.seboProduced + item.fcoProduced + item.farinhetaProduced
      })

      processedData = Array.from(monthlyMap.values())
        .map((entry) => ({
          date: format(entry.date, 'MMM/yy', { locale: ptBR }),
          fullDate: format(entry.date, 'MMMM yyyy', { locale: ptBR }),
          originalDate: entry.date,
          yield: entry.mp > 0 ? (entry.prod / entry.mp) * 100 : 0,
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
    }

    const config = {
      yield: {
        label: 'Rendimento Total',
        color: 'hsl(var(--primary))',
      },
    } satisfies ChartConfig

    return { chartData: processedData, chartConfig: config }
  }, [data, timeScale])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Performance de Rendimento</CardTitle>
          <CardDescription>
            Visualização do rendimento total da fábrica
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
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={30}
          fontSize={12}
        />
        {/* We can optionally hide YAxis or keep it for scale reference */}
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="yield"
          fill="var(--color-yield)"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
          name="Rendimento"
        >
          <LabelList
            dataKey="yield"
            position="top"
            formatter={(val: number) => `${val.toFixed(1)}%`}
            className="fill-foreground font-bold"
            fontSize={isMobile ? 10 : 12}
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
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance de Rendimento
          </CardTitle>
          <CardDescription>
            Rendimento total calculado sobre MP processada
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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Performance de Rendimento</DialogTitle>
                <DialogDescription>
                  Visualização expandida do rendimento total.
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
