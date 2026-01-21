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
  CartesianGrid,
  XAxis,
  YAxis,
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

interface YieldHistoryChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

export function YieldHistoryChart({
  data,
  isMobile = false,
  className,
}: YieldHistoryChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const processedData = data.map((p) => ({
      date: format(p.date, 'dd/MM'),
      sebo: p.mpUsed > 0 ? (p.seboProduced / p.mpUsed) * 100 : 0,
      fco: p.mpUsed > 0 ? (p.fcoProduced / p.mpUsed) * 100 : 0,
      farinheta: p.mpUsed > 0 ? (p.farinhetaProduced / p.mpUsed) * 100 : 0,
    }))

    const config: ChartConfig = {
      sebo: { label: 'Sebo', color: 'hsl(var(--chart-1))' },
      fco: { label: 'FCO', color: 'hsl(var(--chart-2))' },
      farinheta: { label: 'Farinheta', color: 'hsl(var(--chart-3))' },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={`shadow-sm border-primary/10 ${className}`}>
        <CardHeader>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>Evolução percentual dos rendimentos</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de rendimento disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="sebo"
          stroke="var(--color-sebo)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-sebo)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            position="top"
            offset={12}
            fill="var(--color-sebo)"
            fontSize={isMobile ? 9 : 12}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
        </Line>
        <Line
          type="monotone"
          dataKey="fco"
          stroke="var(--color-fco)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-fco)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            position="top"
            offset={12}
            fill="var(--color-fco)"
            fontSize={isMobile ? 9 : 12}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
        </Line>
        <Line
          type="monotone"
          dataKey="farinheta"
          stroke="var(--color-farinheta)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-farinheta)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList
            position="top"
            offset={12}
            fill="var(--color-farinheta)"
            fontSize={isMobile ? 9 : 12}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card className={`shadow-sm border-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>Evolução percentual dos rendimentos</CardDescription>
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
              <DialogTitle>Histórico de Rendimentos</DialogTitle>
              <DialogDescription>
                Visualização detalhada dos rendimentos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
