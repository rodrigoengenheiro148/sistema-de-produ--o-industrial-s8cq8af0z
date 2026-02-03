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
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
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
  headerControls?: React.ReactNode
}

export function SeboInventoryChart({
  data,
  startDate,
  endDate,
  className,
  isLoading = false,
  headerControls,
}: SeboInventoryChartProps) {
  const { chartData, chartConfig, uniqueTanks, hasExtras } = useMemo(() => {
    if (!data)
      return {
        chartData: [],
        chartConfig: {},
        uniqueTanks: [],
        hasExtras: false,
      }

    // 1. Identify all unique tank numbers from the dataset
    const tankSet = new Set<string>()
    data.forEach((record) => {
      if (record.category === 'tank' && record.tankNumber) {
        tankSet.add(record.tankNumber)
      }
    })

    // Sort tanks: Numeric sort if possible, otherwise alphabetic
    const sortedTanks = Array.from(tankSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    )

    // 2. Generate Colors and Config for each tank
    const config: ChartConfig = {}

    // We can cycle through chart CSS variables for colors
    const tankColors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]

    sortedTanks.forEach((tank, index) => {
      config[`tank_${tank}`] = {
        label: `Tanque ${tank}`,
        color: tankColors[index % tankColors.length],
      }
    })

    // Check if we have extras to display
    const extrasExist = data.some(
      (r) => r.category === 'extra' || (r.category === 'tank' && !r.tankNumber),
    )

    if (extrasExist) {
      config['extras'] = {
        label: 'Outros/Extras',
        color: 'hsl(var(--muted-foreground))',
      }
    }

    // 3. Build Data Rows grouped by day
    let dateRange: Date[] = []
    if (startDate && endDate) {
      try {
        dateRange = eachDayOfInterval({ start: startDate, end: endDate })
      } catch (e) {
        console.error('Invalid interval', e)
        dateRange = []
      }
    } else {
      // If no range, find unique days in data
      // This is a fallback, usually startDate and endDate are provided
      const uniqueDates = Array.from(
        new Set(data.map((r) => format(r.date, 'yyyy-MM-dd'))),
      )
      dateRange = uniqueDates.map((d) => {
        const [y, m, da] = d.split('-').map(Number)
        return new Date(y, m - 1, da)
      })
      dateRange.sort((a, b) => a.getTime() - b.getTime())
    }

    const formattedData = dateRange.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const dayRecords = data.filter(
        (r) => format(r.date, 'yyyy-MM-dd') === dateKey,
      )

      const row: any = {
        date: format(day, 'dd/MM'),
        fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
        originalDate: day,
      }

      // Sum for each tank
      sortedTanks.forEach((tank) => {
        const tankRecs = dayRecords.filter(
          (r) => r.category === 'tank' && r.tankNumber === tank,
        )
        const total = tankRecs.reduce(
          (sum, r) => sum + (Number(r.quantityKg) || 0),
          0,
        )
        // Store as number (even if 0, so stacks align correctly if needed, though recharts handles gaps)
        row[`tank_${tank}`] = total
      })

      // Sum for extras
      if (extrasExist) {
        const extraRecs = dayRecords.filter(
          (r) =>
            r.category === 'extra' || (r.category === 'tank' && !r.tankNumber),
        )
        const totalExtra = extraRecs.reduce(
          (sum, r) => sum + (Number(r.quantityKg) || 0),
          0,
        )
        row['extras'] = totalExtra
      }

      return row
    })

    return {
      chartData: formattedData,
      chartConfig: config,
      uniqueTanks: sortedTanks,
      hasExtras: extrasExist,
    }
  }, [data, startDate, endDate])

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => {
    // Determine if we should show chart or empty state inside content
    const hasData = chartData && chartData.length > 0
    const isEmpty =
      !hasData ||
      chartData.every((d) => {
        const values = Object.values(d).filter((v) => typeof v === 'number')
        return values.reduce((a: any, b: any) => a + b, 0) === 0
      })

    if (isEmpty && !isLoading) {
      return (
        <div
          className={`flex items-center justify-center text-muted-foreground ${height}`}
        >
          Nenhum dado encontrado para o período.
        </div>
      )
    }

    return (
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
            content={<ChartTooltipContent indicator="dashed" />}
          />
          <ChartLegend content={<ChartLegendContent />} />

          {/* Dynamic Bars for each Tank */}
          {uniqueTanks.map((tank) => (
            <Bar
              key={tank}
              dataKey={`tank_${tank}`}
              stackId="a"
              fill={`var(--color-tank_${tank})`}
              radius={[0, 0, 0, 0]}
              maxBarSize={60}
            />
          ))}

          {/* Bar for Extras if they exist */}
          {hasExtras && (
            <Bar
              dataKey="extras"
              stackId="a"
              fill="var(--color-extras)"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          )}
        </BarChart>
      </ChartContainer>
    )
  }

  if (isLoading) {
    return (
      <Card className={cn('shadow-sm flex flex-col', className)}>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
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

  return (
    <Card className={cn('shadow-sm flex flex-col', className)}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução do Estoque
          </CardTitle>
          <CardDescription>
            Quantidade total de sebo (Kg) por dia, detalhado por tanque
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {headerControls}
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
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 min-h-[300px]">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
