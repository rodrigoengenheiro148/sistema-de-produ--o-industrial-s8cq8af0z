import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
import {
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'

interface QualityChartProps {
  title?: string
  data: any[]
  mean?: number
  stdDev?: number
  unit?: string
}

const chartConfig: ChartConfig = {
  value: { label: 'Valor', color: 'hsl(var(--primary))' },
  valueMA: { label: 'Média Móvel', color: 'hsl(var(--chart-2))' },
  mean: { label: 'Média Período', color: 'hsl(var(--muted-foreground))' },
}

export function QualityChart({
  title = 'Controle de Qualidade',
  data = [],
  mean = 0,
  stdDev = 0,
  unit = '',
}: QualityChartProps) {
  const isMobile = useIsMobile()

  // Defensive programming: Ensure numeric values
  const safeMean = typeof mean === 'number' && !isNaN(mean) ? mean : 0
  const safeStdDev = typeof stdDev === 'number' && !isNaN(stdDev) ? stdDev : 0

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/10 text-muted-foreground text-sm p-4 text-center">
        Sem dados suficientes.
      </div>
    )
  }

  const lowerBound = Math.max(0, safeMean - safeStdDev)
  const upperBound = safeMean + safeStdDev

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 10, bottom: 20, left: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="dateStr"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={isMobile ? 10 : 12}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={['auto', 'auto']}
          tickLine={false}
          axisLine={false}
          width={isMobile ? 30 : 40}
          fontSize={isMobile ? 10 : 12}
          tickFormatter={(val) => {
            if (typeof val !== 'number' || isNaN(val)) return '0.0'
            return val.toFixed(1)
          }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />

        <ReferenceLine
          y={safeMean}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="3 3"
        />
        <ReferenceLine
          y={upperBound}
          stroke="hsl(var(--destructive))"
          strokeOpacity={0.5}
          strokeDasharray="3 3"
        />
        <ReferenceLine
          y={lowerBound}
          stroke="hsl(var(--destructive))"
          strokeOpacity={0.5}
          strokeDasharray="3 3"
        />

        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-value)' }}
          activeDot={{ r: 5 }}
          name={`Valor (${unit})`}
        />
        <Line
          type="monotone"
          dataKey="valueMA"
          stroke="var(--color-valueMA)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Média Móvel"
        />
      </ComposedChart>
    </ChartContainer>
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Tendência e Desvio Padrão (σ = {safeStdDev.toFixed(2)})
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
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Tendência e Desvio Padrão (σ = {safeStdDev.toFixed(2)})
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
