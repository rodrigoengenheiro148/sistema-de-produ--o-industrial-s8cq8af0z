import { useMemo } from 'react'
import { RawMaterialEntry } from '@/lib/types'
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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RawMaterialCompositionChartProps {
  data: RawMaterialEntry[]
  isMobile?: boolean
  className?: string
}

// Fixed set of categories as per requirement
const CATEGORIES = [
  'Barrigada',
  'COURO BOVINO',
  'Despojo',
  'MUXIBA',
  'Misto',
  'Ossos',
  'VISCERAS DE PEIXE',
]

// Colors mapped to match the visual requirement (Green shades mostly)
const CATEGORY_COLORS: Record<string, string> = {
  Barrigada: '#14532d', // green-900
  'COURO BOVINO': '#15803d', // green-700
  Despojo: '#22c55e', // green-500
  MUXIBA: '#eab308', // yellow-500
  Misto: '#f97316', // orange-500
  Ossos: '#0f172a', // slate-900 (Dark Grey)
  'VISCERAS DE PEIXE': '#3b82f6', // blue-500
}

export function RawMaterialCompositionChart({
  data,
  isMobile = false,
  className,
}: RawMaterialCompositionChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const groupedData = new Map<string, any>()

    data.forEach((item) => {
      // Normalize date to YYYY-MM-DD
      const dateKey = format(item.date, 'yyyy-MM-dd')
      const displayDate = format(item.date, 'dd/MM')
      const fullDate = format(item.date, "dd 'de' MMMM", { locale: ptBR })

      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          dateKey,
          displayDate,
          fullDate,
          originalDate: item.date,
          // Initialize all categories to 0
          ...CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
        })
      }

      const entry = groupedData.get(dateKey)
      // Normalize item type match (case insensitive if needed, but assuming exact match from DB based on requirements)
      // We check if item.type is one of our categories, otherwise maybe group in 'Outros' or ignore
      // Requirement lists specific categories, so we assume data fits or we stick to exact matches.
      const category = CATEGORIES.find(
        (c) => c.toLowerCase() === item.type.toLowerCase(),
      )

      if (category) {
        entry[category] += item.quantity
      }
    })

    const processedData = Array.from(groupedData.values()).sort(
      (a, b) => a.originalDate.getTime() - b.originalDate.getTime(),
    )

    // Build ChartConfig
    const config: ChartConfig = {}
    CATEGORIES.forEach((cat) => {
      config[cat] = {
        label: cat,
        color: CATEGORY_COLORS[cat] || '#cccccc',
      }
    })

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Composição de Matéria-Prima</CardTitle>
          <CardDescription>Volume diário por tipo</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="displayDate"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={30}
          fontSize={isMobile ? 10 : 12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 35 : 50}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          fontSize={isMobile ? 10 : 12}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) => payload[0]?.payload?.fullDate}
            />
          }
        />
        <ChartLegend
          content={<ChartLegendContent />}
          className="flex-wrap gap-2 pt-4"
        />

        {CATEGORIES.map((category) => (
          <Bar
            key={category}
            dataKey={category}
            stackId="a"
            fill={CATEGORY_COLORS[category]}
            maxBarSize={50}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Composição de Matéria-Prima
          </CardTitle>
          <CardDescription>Volume diário por tipo</CardDescription>
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
              <DialogTitle>Composição de Matéria-Prima</DialogTitle>
              <DialogDescription>
                Visualização detalhada dos tipos de matéria-prima processada.
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
