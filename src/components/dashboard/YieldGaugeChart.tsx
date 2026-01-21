import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YieldGaugeChartProps {
  value: number
  target: number
  className?: string
}

export function YieldGaugeChart({
  value,
  target,
  className,
}: YieldGaugeChartProps) {
  // Cap value for visualization (max 100 for the gauge arc)
  const displayValue = Math.min(Math.max(value, 0), 100)

  // Determine color status
  const isAboveTarget = value >= target
  const isNearTarget = value >= target * 0.9 && value < target

  // Select color: Green (chart-2) for success, Orange (chart-4) for warning, Red (destructive) for bad
  // We use CSS variables to respect the theme
  const color = isAboveTarget
    ? 'hsl(var(--chart-2))'
    : isNearTarget
      ? 'hsl(var(--chart-4))'
      : 'hsl(var(--destructive))'

  const chartData = useMemo(
    () => [
      { name: 'Atual', value: displayValue, fill: color },
      {
        name: 'Restante',
        value: 100 - displayValue,
        fill: 'hsl(var(--muted))',
      },
    ],
    [displayValue, color],
  )

  const chartConfig = {
    yield: {
      label: 'Rendimento',
      color: color,
    },
  } satisfies ChartConfig

  // Needle rotation calculation
  // 0% = -90deg (Left), 50% = 0deg (Up), 100% = 90deg (Right)
  const needleRotation = (displayValue / 100) * 180 - 90

  const ChartContent = () => (
    <div className="relative flex flex-col items-center justify-center pt-4 pb-2">
      <div className="relative h-[180px] w-full max-w-[300px]">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full mx-auto aspect-square"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="65%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              cornerRadius={6}
            >
              <Cell key="value" fill={color} />
              <Cell key="remaining" fill="hsl(var(--muted)/0.3)" />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Needle */}
        <div
          className="absolute left-1/2 top-[80%] h-[75%] w-1 -translate-x-1/2 -translate-y-full origin-bottom transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          <div className="h-full w-full bg-foreground rounded-t-full shadow-sm" />
          <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-foreground border-2 border-background" />
        </div>
      </div>

      <div className="mt-[-20px] text-center flex flex-col items-center z-10">
        <span
          className="text-4xl font-bold transition-colors duration-300"
          style={{ color }}
        >
          {value.toFixed(2)}%
        </span>
        <span className="text-sm text-muted-foreground font-medium mt-1">
          Meta: {target.toFixed(1)}%
        </span>
      </div>
    </div>
  )

  return (
    <Card
      className={cn('flex flex-col shadow-sm border-primary/10', className)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            Rendimento Fábrica
          </CardTitle>
          <CardDescription>Indicador em tempo real</CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Expandir</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[500px] flex flex-col">
            <DialogHeader>
              <DialogTitle>Acelerômetro de Rendimento</DialogTitle>
              <DialogDescription>
                Visualização detalhada da performance da fábrica em relação à
                meta estabelecida.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-8 flex items-center justify-center bg-muted/10 rounded-lg mt-4">
              <div className="scale-125 transform origin-center">
                <ChartContent />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
