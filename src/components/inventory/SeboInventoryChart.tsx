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
import { format, parseISO } from 'date-fns'
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

interface SeboInventoryChartProps {
  data: SeboInventoryRecord[]
  className?: string
}

export function SeboInventoryChart({
  data,
  className,
}: SeboInventoryChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by date and sum quantities
    const grouped = data.reduce(
      (acc, record) => {
        // Use yyyy-MM-dd string as key to group
        const dateKey = format(record.date, 'yyyy-MM-dd')
        if (!acc[dateKey]) {
          acc[dateKey] = {
            dateKey,
            originalDate: record.date,
            totalKg: 0,
            totalLt: 0,
          }
        }
        acc[dateKey].totalKg += Number(record.quantityKg) || 0
        acc[dateKey].totalLt += Number(record.quantityLt) || 0
        return acc
      },
      {} as Record<
        string,
        {
          dateKey: string
          originalDate: Date
          totalKg: number
          totalLt: number
        }
      >,
    )

    // Convert to array and sort
    return Object.values(grouped)
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())
      .map((item) => ({
        date: format(item.originalDate, 'dd/MM'),
        fullDate: format(item.originalDate, "dd 'de' MMMM", { locale: ptBR }),
        quantity: item.totalKg, // Defaulting to KG for display
      }))
  }, [data])

  const chartConfig = {
    quantity: {
      label: 'Estoque (kg)',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader>
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
        >
          <LabelList
            dataKey="quantity"
            position="top"
            formatter={(val: number) =>
              val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)
            }
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
