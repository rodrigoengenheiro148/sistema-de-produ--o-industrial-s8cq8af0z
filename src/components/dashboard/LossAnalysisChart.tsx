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

interface LossAnalysisChartProps {
  data: ProductionEntry[]
  className?: string
}

export function LossAnalysisChart({ data, className }: LossAnalysisChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    // Filter out entries with 0 losses and map to chart format
    // Strict requirement: Bars with a value of 0 must not be displayed.
    const processedData = data
      .filter((p) => p.losses > 0)
      .map((p) => ({
        date: format(p.date, 'dd/MM'),
        originalDate: p.date,
        perdas: p.losses,
      }))
      // Ensure chronological order if not already sorted
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

    const config: ChartConfig = {
      perdas: { label: 'Perdas', color: 'hsl(var(--destructive))' },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={`shadow-sm border-primary/10 ${className}`}>
        <CardHeader>
          <CardTitle>Análise de Perdas</CardTitle>
          <CardDescription>
            Volume de quebra técnica e perdas por dia
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
            dataKey="perdas"
            position="top"
            offset={8}
            className="fill-foreground font-bold"
            fontSize={11}
            formatter={(value: any) =>
              value > 0 ? `${value.toLocaleString('pt-BR')}` : ''
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={`shadow-sm border-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Análise de Perdas</CardTitle>
          <CardDescription>
            Volume de quebra técnica e perdas por dia ( &gt; 0kg )
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
              <DialogTitle>Análise de Perdas</DialogTitle>
              <DialogDescription>
                Visualização detalhada das perdas diárias.
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
