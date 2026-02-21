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
  // Red: Below Target | Green: Equal or Above Target
  const getStatus = (val: number, tgt: number) => {
    if (val >= tgt)
      return {
        color: '#10b981', // emerald-500
        label: 'SUPEROU A META',
        gradient: 'url(#gradient-success)',
        textClass: 'text-[#16a34a]', // dark green text for center
        bgClass: 'bg-[#eefcf2] text-[#16a34a] border border-[#d1fadf]', // matching screenshot styling for badge
      }
    return {
      color: '#ef4444', // red-500
      label: 'ABAIXO DA META',
      gradient: 'url(#gradient-danger)',
      textClass: 'text-red-600',
      bgClass: 'bg-red-50 text-red-600 border border-red-100',
    }
  }

  // Use raw value for status comparison
  const status = getStatus(value, target)

  // Chart Data Layers
  const data = useMemo(
    () => [
      { name: 'Atual', value: safeValue },
      { name: 'Restante', value: MAX_VALUE - safeValue },
    ],
    [safeValue],
  )

  // Background Track
  const trackData = [{ name: 'Track', value: 100 }]

  // Angles for absolute positioning (-90deg to 90deg scale)
  const calculateAngle = (val: number) => (val / MAX_VALUE) * 180 - 90

  const needleAngle = calculateAngle(safeValue)
  const targetAngle = calculateAngle(safeTarget)

  const chartConfig = {
    yield: {
      label: 'Rendimento',
      color: status.color,
    },
  } satisfies ChartConfig

  const ChartContent = () => (
    <div className="relative flex flex-col items-center justify-center pt-6 w-full">
      {/* Gauge Visual */}
      <div className="relative w-full max-w-[240px] aspect-[2/1]">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full absolute inset-0"
        >
          <PieChart>
            <defs>
              <linearGradient id="gradient-success" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="gradient-danger" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            {/* Track Layer */}
            <Pie
              data={trackData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="#f3f4f6" />
            </Pie>
            {/* Value Layer */}
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              cornerRadius={0}
              paddingAngle={0}
            >
              <Cell fill={status.color} />
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

        {/* Target Indicator Triangle */}
        <div
          className="absolute bottom-0 left-1/2 w-[2px] h-[115%] bg-transparent pointer-events-none origin-bottom flex flex-col items-center justify-start transition-transform duration-700 ease-out z-20"
          style={{ transform: `rotate(${targetAngle}deg)` }}
        >
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#6b7280]" />
        </div>

        {/* Target Line */}
        <div
          className="absolute bottom-0 left-1/2 w-[1px] h-[100%] bg-transparent pointer-events-none origin-bottom flex flex-col items-center justify-start transition-transform duration-700 ease-out z-10"
          style={{ transform: `rotate(${targetAngle}deg)` }}
        >
          <div className="w-[1px] h-full bg-[#9ca3af]/40 border-r border-dashed" />
        </div>

        {/* Black Needle Line */}
        <div
          className="absolute bottom-0 left-1/2 h-[98%] w-[2px] pointer-events-none origin-bottom flex items-end justify-center transition-transform duration-1000 ease-out z-30"
          style={{ transform: `rotate(${needleAngle}deg)` }}
        >
          <div className="h-full w-[3px] bg-[#111827] rounded-full shadow-sm" />
        </div>

        {/* Needle Center Pivot */}
        <div className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 bg-[#111827] rounded-full shadow-sm z-40 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-[#4b5563] rounded-full" />
        </div>

        <div className="absolute bottom-[-10px] left-[-20px] text-xs font-medium text-muted-foreground/60 select-none">
          0%
        </div>
        <div className="absolute bottom-[-10px] right-[-30px] text-xs font-medium text-muted-foreground/60 select-none">
          100%
        </div>
      </div>

      {/* Center Text Stats */}
      <div className="mt-12 flex flex-col items-center z-10 text-center animate-fade-in-up">
        <span
          className={cn(
            'text-5xl font-bold tracking-tight transition-colors duration-500',
            status.textClass,
          )}
        >
          {value.toFixed(2)}%
        </span>

        <div className="flex items-center gap-1.5 mt-3 bg-transparent px-3 py-1 rounded-full border border-border text-muted-foreground shadow-sm">
          <Target className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">
            Meta:{' '}
            <span className="text-foreground font-bold">
              {target.toFixed(1)}%
            </span>
          </span>
        </div>

        <div
          className={cn(
            'mt-3 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-sm',
            status.bgClass,
          )}
        >
          {status.label}
        </div>
      </div>
    </div>
  )

  return (
    <Card className={cn('flex flex-col shadow-sm border-border', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Gauge className="h-4 w-4 text-[#166534]" />
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
                processada e o produto final gerado.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pt-2 pb-6">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
