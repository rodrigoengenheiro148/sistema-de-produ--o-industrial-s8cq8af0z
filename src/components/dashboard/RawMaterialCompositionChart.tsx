import { useMemo, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, BarChart3, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RawMaterialCompositionChartProps {
  data: RawMaterialEntry[]
  isMobile?: boolean
  className?: string
}

// Updated set of categories including 'Sangue'
const CATEGORIES = [
  'Barrigada',
  'COURO BOVINO',
  'Despojo',
  'MUXIBA',
  'Misto',
  'Ossos',
  'VISCERAS DE PEIXE',
  'Sangue',
]

// Colors mapped to match the visual requirement
const CATEGORY_COLORS: Record<string, string> = {
  Barrigada: '#14532d', // green-900
  'COURO BOVINO': '#15803d', // green-700
  Despojo: '#22c55e', // green-500
  MUXIBA: '#eab308', // yellow-500
  Misto: '#f97316', // orange-500
  Ossos: '#0f172a', // slate-900 (Dark Grey)
  'VISCERAS DE PEIXE': '#3b82f6', // blue-500
  Sangue: '#dc2626', // red-600
}

export function RawMaterialCompositionChart({
  data,
  isMobile = false,
  className,
}: RawMaterialCompositionChartProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')

  // Extract unique options for filters from the provided data
  const { materialOptions, supplierOptions } = useMemo(() => {
    if (!data || data.length === 0) {
      return { materialOptions: [], supplierOptions: [] }
    }
    const materials = new Set<string>()
    const suppliers = new Set<string>()

    data.forEach((item) => {
      if (item.type) materials.add(item.type)
      if (item.supplier) suppliers.add(item.supplier)
    })

    return {
      materialOptions: Array.from(materials).sort(),
      supplierOptions: Array.from(suppliers).sort(),
    }
  }, [data])

  // Filter the data based on selection
  const filteredData = useMemo(() => {
    if (!data) return []
    return data.filter((item) => {
      const matchMaterial =
        selectedMaterial === 'all' || item.type === selectedMaterial
      const matchSupplier =
        selectedSupplier === 'all' || item.supplier === selectedSupplier
      return matchMaterial && matchSupplier
    })
  }, [data, selectedMaterial, selectedSupplier])

  // Process data for Stacked Bar Chart (Group by Date)
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, any>()

    filteredData.forEach((item) => {
      const dateKey = format(item.date, 'yyyy-MM-dd')
      const displayDate = format(item.date, 'dd/MM')
      const fullDateLabel = format(item.date, "dd 'de' MMMM", { locale: ptBR })

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          dateKey,
          displayDate,
          fullDateLabel,
          timestamp: item.date.getTime(),
          // Initialize categories to 0
          ...CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}),
        })
      }

      const entry = dailyMap.get(dateKey)

      // Find category matching the item type (case insensitive)
      const category = CATEGORIES.find(
        (c) => c.toLowerCase() === item.type.toLowerCase(),
      )

      if (category) {
        let quantity = item.quantity
        const unit = item.unit?.toLowerCase() || ''

        // Conversion logic (Bag -> kg)
        // Applies to all types as per AC, if unit is bag
        if (unit.includes('bag')) {
          quantity = quantity * 1400
        } else if (unit.includes('ton')) {
          quantity = quantity * 1000
        }

        entry[category] += quantity
      }
    })

    // Return sorted by date
    return Array.from(dailyMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    )
  }, [filteredData])

  // Determine which categories have data > 0 to filter the legend/bars
  const activeCategories = useMemo(() => {
    const active = new Set<string>()
    chartData.forEach((entry) => {
      CATEGORIES.forEach((cat) => {
        if (entry[cat] > 0) active.add(cat)
      })
    })
    // Maintain the original order for consistency in colors/stacking
    return CATEGORIES.filter((cat) => active.has(cat))
  }, [chartData])

  // Build ChartConfig
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    CATEGORIES.forEach((cat) => {
      config[cat] = {
        label: cat,
        color: CATEGORY_COLORS[cat] || '#cccccc',
      }
    })
    return config
  }, [])

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k'
    }
    return value.toString()
  }

  // If no data is passed at all (regardless of filters)
  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Composição de Matéria-Prima</CardTitle>
          <CardDescription>Volume diário por tipo (kg)</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
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
          width={isMobile ? 35 : 45}
          tickFormatter={formatYAxis}
          fontSize={isMobile ? 10 : 12}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          content={
            <ChartTooltipContent
              hideZero
              labelFormatter={(value, payload) => {
                return payload[0]?.payload?.fullDateLabel || value
              }}
              formatter={(value, name, item) => (
                <div className="flex items-center gap-2 w-full text-xs">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground flex-1">{name}</span>
                  <span className="font-mono font-medium">
                    {Number(value).toLocaleString('pt-BR')} kg
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />

        {activeCategories.map((category) => (
          <Bar
            key={category}
            dataKey={category}
            stackId="a"
            fill={`var(--color-${category})`}
            radius={[0, 0, 0, 0]}
            maxBarSize={50}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Composição de Matéria-Prima
          </CardTitle>
          <CardDescription>Volume diário por tipo (kg)</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Materiais</SelectItem>
              {materialOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Fornecedores</SelectItem>
              {supplierOptions.map((supplier) => (
                <SelectItem key={supplier} value={supplier}>
                  {supplier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden sm:flex"
              >
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Expandir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Composição de Matéria-Prima</DialogTitle>
                <DialogDescription>
                  Visualização detalhada dos tipos de matéria-prima processada
                  por dia.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full min-h-0 py-4 flex items-center justify-center">
                <ChartContent height="h-[500px]" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        {chartData.length > 0 ? (
          <ChartContent />
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md bg-muted/10">
            Nenhum dado encontrado para os filtros selecionados.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
