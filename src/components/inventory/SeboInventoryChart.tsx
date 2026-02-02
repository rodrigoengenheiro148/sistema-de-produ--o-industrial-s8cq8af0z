import { useMemo } from 'react'
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
import { format, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SeboInventoryRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Maximize2, BarChart3 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface SeboInventoryChartProps {
  data: SeboInventoryRecord[]
  startDate?: Date
  endDate?: Date
  className?: string
  isLoading?: boolean
}

export function SeboInventoryChart({
  data,
  startDate,
  endDate,
  className,
  isLoading = false,
}: SeboInventoryChartProps) {
  const chartData = useMemo(() => {
    // If loading or invalid range, return empty to prevent calculation errors
    if (isLoading || !data) return []

    // Group by date (yyyy-MM-dd) to aggregate multiple records per day (e.g. tanks)
    const grouped = data.reduce(
      (acc, record) => {
        const dateKey = format(record.date, 'yyyy-MM-dd')
        if (!acc[dateKey]) {
          acc[dateKey] = {
            totalKg: 0,
            totalLt: 0,
          }
        }
        acc[dateKey].totalKg += Number(record.quantityKg) || 0
        acc[dateKey].totalLt += Number(record.quantityLt) || 0
        return acc
      },
      {} as Record<string, { totalKg: number; totalLt: number }>,
    )

    // If a range is provided, we generate all days in that interval
    // This ensures gaps are shown as 0 instead of missing from the axis
    if (startDate && endDate) {
      try {
        const days = eachDayOfInterval({ start: startDate, end: endDate })
        return days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayStats = grouped[dateKey] || { totalKg: 0, totalLt: 0 }
          return {
            date: format(day, 'dd/MM'),
            fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
            quantity: dayStats.totalKg,
            originalDate: day,
          }
        })
      } catch (e) {
        console.error('Invalid date interval for chart', e)
        return []
      }
    }

    // Fallback if no range provided: just show existing dates sorted
    return Object.entries(grouped)
      .map(([dateStr, stats]) => {
        // Need to parse back to date object correctly from string key
        const [y, m, d] = dateStr.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        return {
          date: format(dateObj, 'dd/MM'),
          fullDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }),
          quantity: stats.totalKg,
          originalDate: dateObj,
        }
      })
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
  }, [data, startDate, endDate, isLoading])

  const chartConfig = {
    quantity: {
      label: 'Estoque (kg)',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <Card className={cn('shadow-sm flex flex-col', className)}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardHeader>
        <CardContent className="pt-4 flex-1 min-h-[300px] flex items-end gap-2 px-6">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(20, Math.random() * 80)}%`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução do Estoque
          </CardTitle>
          <CardDescription>Histórico diário do estoque de Sebo</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado encontrado para o período.
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
          fontSize={12}
          minTickGap={20}
        />
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="quantity"
          fill="var(--color-quantity)"
          radius={[4, 4, 0, 0]}
          name="Estoque (Kg)"
          maxBarSize={60}
          animationDuration={500}
        >
          <LabelList
            dataKey="quantity"
            position="top"
            formatter={(val: number) => {
              if (val === 0) return ''
              return val >= 1000
                ? `${(val / 1000).toFixed(1)}k`
                : val.toFixed(0)
            }}
            className="fill-foreground font-bold"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={cn('shadow-sm flex flex-col', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução do Estoque
          </CardTitle>
          <CardDescription>
            Quantidade total de sebo (Kg) por dia
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">Expandir</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Evolução Detalhada do Estoque</DialogTitle>
              <DialogDescription>
                Visualização expandida do estoque diário de Sebo Bovino.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4 flex-1 min-h-[300px]">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
