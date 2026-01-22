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

interface ProductionPerformanceChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

export function ProductionPerformanceChart({
  data,
  isMobile = false,
  className,
}: ProductionPerformanceChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const processedData = data.map((p) => ({
      date: format(p.date, 'dd/MM'),
      originalDate: p.date,
      producao: p.seboProduced + p.fcoProduced + p.farinhetaProduced,
      mp: p.mpUsed,
    }))

    const config: ChartConfig = {
      producao: { label: 'Produção Total', color: 'hsl(var(--chart-1))' },
      mp: { label: 'MP Processada', color: 'hsl(var(--chart-2))' },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={`shadow-sm border-primary/10 ${className}`}>
        <CardHeader>
          <CardTitle>Desempenho de Produção</CardTitle>
          <CardDescription>
            Comparativo entre MP processada e produtos gerados
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
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 30 : 50}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="producao"
          stroke="var(--color-producao)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-producao)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            position="top"
            offset={12}
            className="fill-foreground font-bold"
            fontSize={10}
            formatter={(value: any) =>
              value > 0 ? `${(value / 1000).toFixed(1)}k` : ''
            }
          />
        </Line>
        <Line
          type="monotone"
          dataKey="mp"
          stroke="var(--color-mp)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-mp)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            position="bottom"
            offset={12}
            className="fill-muted-foreground"
            fontSize={9}
            formatter={(value: any) =>
              value > 0 ? `${(value / 1000).toFixed(1)}k` : ''
            }
          />
        </Line>
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card className={`shadow-sm border-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Desempenho de Produção</CardTitle>
          <CardDescription>
            Comparativo entre MP processada e produtos gerados
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
