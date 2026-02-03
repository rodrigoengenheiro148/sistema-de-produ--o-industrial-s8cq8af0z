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
import { PieChart, Pie, Cell, Label } from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, PieChart as PieChartIcon, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const { chartData, chartConfig, totalWeight } = useMemo(() => {
    const categoryMap = new Map<string, number>()
    let total = 0

    // Initialize categories with 0
    CATEGORIES.forEach((cat) => categoryMap.set(cat, 0))

    filteredData.forEach((item) => {
      // Normalize item type match
      const category = CATEGORIES.find(
        (c) => c.toLowerCase() === item.type.toLowerCase(),
      )

      if (category) {
        let quantity = item.quantity
        const unit = item.unit?.toLowerCase() || ''

        // Conversion logic for 'Sangue' (Bag -> kg)
        // Also handling 'ton' for robustness
        if (category === 'Sangue' && unit.includes('bag')) {
          quantity = quantity * 1400
        } else if (unit.includes('ton')) {
          quantity = quantity * 1000
        }

        categoryMap.set(category, (categoryMap.get(category) || 0) + quantity)
        total += quantity
      }
    })

    const processedData = Array.from(categoryMap.entries())
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name] || '#cccccc',
      }))
      .sort((a, b) => b.value - a.value)

    // Build ChartConfig
    const config: ChartConfig = {}
    CATEGORIES.forEach((cat) => {
      config[cat] = {
        label: cat,
        color: CATEGORY_COLORS[cat] || '#cccccc',
      }
    })

    return { chartData: processedData, chartConfig: config, totalWeight: total }
  }, [filteredData])

  const formatWeight = (value: number) => {
    if (value >= 1000) {
      return (
        (value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) +
        'k'
      )
    }
    return value.toLocaleString('pt-BR')
  }

  // If no data is passed at all (regardless of filters)
  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Composição de Matéria-Prima</CardTitle>
          <CardDescription>Distribuição total por tipo (kg)</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer
      config={chartConfig}
      className={cn('mx-auto aspect-square max-h-[350px]', height)}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {formatWeight(totalWeight)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground text-xs"
                    >
                      Total (kg)
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Composição de Matéria-Prima
          </CardTitle>
          <CardDescription>Distribuição total por tipo (kg)</CardDescription>
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
                  Visualização detalhada dos tipos de matéria-prima processada.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full min-h-0 py-4 flex items-center justify-center">
                <ChartContent height="h-[500px]" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-0">
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
