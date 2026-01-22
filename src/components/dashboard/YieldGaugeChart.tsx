import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, Gauge, Target, Info } from 'lucide-react'
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
  // Constants - Strict 100% cap as per requirement
  const MAX_VALUE = 100
  const safeValue = Math.min(Math.max(value, 0), MAX_VALUE)
  const safeTarget = Math.min(Math.max(target, 0), MAX_VALUE)

  // Determine status color and text
  // Red: < 90% of target | Amber: 90%-99% of target | Green: >= 100% of target
  const getStatus = (val: number, tgt: number) => {
    // Use the raw value for status comparison to ensure accuracy even if capped visually
    if (val >= tgt)
      return {
        color: '#10b981',
        label: 'Superou a Meta',
        gradient: 'url(#gradient-success)',
        textClass: 'text-emerald-600',
      } // Emerald-500
    if (val >= tgt * 0.9)
      return {
        color: '#f59e0b',
        label: 'Próximo da Meta',
        gradient: 'url(#gradient-warning)',
        textClass: 'text-amber-500',
      } // Amber-500
    return {
      color: '#ef4444',
      label: 'Abaixo da Meta',
      gradient: 'url(#gradient-danger)',
      textClass: 'text-red-500',
    } // Red-500
  }

  // Use raw value for status calculation, but safe values for visual rendering
  const status = getStatus(value, target)

  // Chart Data Layers
  // Layer 1: The Gauge Value (colored) + Transparent remainder
  // Ensure we use safeValue to never exceed 100% visually
  const data = useMemo(
    () => [
      { name: 'Atual', value: safeValue },
      { name: 'Restante', value: MAX_VALUE - safeValue },
    ],
    [safeValue],
  )

  // Layer 2: The Background Track (grey)
  const trackData = [{ name: 'Track', value: 100 }]

  // Angles for absolute positioning (-90deg to 90deg scale)
  const calculateAngle = (val: number) => (val / MAX_VALUE) * 180 - 90

  // Needle and target also respect the 100% cap
  const needleAngle = calculateAngle(safeValue)
  const targetAngle = calculateAngle(safeTarget)

  const chartConfig = {
    yield: {
      label: 'Rendimento',
      color: status.color,
    },
  } satisfies ChartConfig

  const ChartContent = () => (
    <div className="relative flex flex-col items-center justify-center pt-2 w-full">
      {/* Gauge Visual */}
      <div className="relative w-full max-w-[280px] aspect-[2/1]">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full absolute inset-0"
        >
          <PieChart>
            <defs>
              <linearGradient id="gradient-success" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="gradient-warning" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="gradient-danger" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            {/* Track Layer */}
            <Pie
              data={trackData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="72%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="hsl(var(--muted)/0.4)" />
            </Pie>
            {/* Value Layer */}
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="72%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              cornerRadius={6}
              paddingAngle={0}
            >
              <Cell fill={status.gradient} />
              <Cell fill="transparent" />
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">
                          Rendimento Atual
                        </span>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Valor:</span>
                          <span
                            className={cn(
                              'font-bold font-mono',
                              status.textClass,
                            )}
                          >
                            {value.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Meta:</span>
                          <span className="font-mono">
                            {target.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ChartContainer>

        {/* Target Indicator (Dashed Line & Triangle) */}
        <div
          className="absolute bottom-0 left-1/2 w-0.5 h-[105%] bg-transparent pointer-events-none origin-bottom flex flex-col items-center justify-start transition-transform duration-700 ease-out"
          style={{ transform: `rotate(${targetAngle}deg)` }}
        >
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-foreground/80 translate-y-[-2px]" />
          <div className="w-0.5 h-3 bg-foreground/30 mt-0.5" />
        </div>

        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 h-full w-[2px] pointer-events-none origin-bottom flex items-end justify-center transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${needleAngle}deg)` }}
        >
          {/* Needle Body */}
          <div className="h-[95%] w-1.5 bg-foreground rounded-t-full shadow-lg relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-foreground to-transparent opacity-50" />
          </div>
        </div>

        {/* Needle Pivot (Center Hub) */}
        <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 bg-foreground rounded-full border-[3px] border-background shadow-md z-10" />

        {/* Corner Labels */}
        <div className="absolute bottom-1 left-1 text-[10px] font-medium text-muted-foreground/60 select-none">
          0%
        </div>
        <div className="absolute bottom-1 right-1 text-[10px] font-medium text-muted-foreground/60 select-none">
          100%
        </div>
      </div>

      {/* Center Text Stats */}
      <div className="mt-6 flex flex-col items-center z-10 text-center animate-fade-in-up">
        <span
          className={cn(
            'text-5xl font-bold tracking-tight transition-colors duration-500',
            status.textClass,
          )}
          style={{ textShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          {value.toFixed(2)}%
        </span>

        <div className="flex items-center gap-2 mt-2 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Meta: <span className="text-foreground">{target.toFixed(1)}%</span>
          </span>
        </div>

        <div
          className={cn(
            'mt-2 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded',
            status.color === '#10b981'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : status.color === '#f59e0b'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          {status.label}
        </div>
      </div>
    </div>
  )

  return (
    <Card
      className={cn(
        'flex flex-col shadow-subtle hover:shadow-elevation transition-shadow duration-300 border-primary/5',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/40 bg-muted/10">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            Acelerômetro de Rendimento
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Performance em tempo real (Máx 100%)
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
          <DialogContent className="max-w-[500px] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" /> Detalhes de Rendimento
              </DialogTitle>
              <DialogDescription>
                Análise aprofundada da eficiência da fábrica em relação à meta
                de {target.toFixed(1)}%. O gráfico é limitado a 100% de escala.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-10 flex items-center justify-center bg-gradient-to-b from-muted/20 to-transparent rounded-xl mt-4 border border-border/50">
              <div className="scale-125 transform origin-center w-full flex justify-center">
                <ChartContent />
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p>
                Este indicador reflete a relação entre a matéria-prima
                processada e o produto final gerado. Mantenha o ponteiro na zona
                verde para garantir a máxima eficiência operacional.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pt-6 pb-6">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
