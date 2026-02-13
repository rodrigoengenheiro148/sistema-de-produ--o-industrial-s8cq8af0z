import { useMemo, useState, useEffect } from 'react'
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
import {
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Maximize2,
  BarChart3,
  Filter,
  Check,
  ChevronsUpDown,
  Loader2,
  Layers,
} from 'lucide-react'
import { cn, parseAsLocalNoon } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DatePickerWithRange } from '@/components/DateRangePicker'
import { DateRange } from 'react-day-picker'
import { useData } from '@/context/DataContext'
import { supabase } from '@/lib/supabase/client'

interface RawMaterialCompositionChartProps {
  data: RawMaterialEntry[]
  isMobile?: boolean
  className?: string
}

// Updated set of categories including 'Sangue' and 'Óleo Saturado'
const CATEGORIES = [
  'Barrigada',
  'COURO BOVINO',
  'Despojo',
  'MUXIBA',
  'Misto',
  'Ossos',
  'VISCERAS DE PEIXE',
  'Sangue',
  'Óleo Saturado',
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
  'Óleo Saturado': '#8b5cf6', // violet-500
}

export function RawMaterialCompositionChart({
  data: initialData,
  isMobile = false,
  className,
}: RawMaterialCompositionChartProps) {
  const { currentFactoryId } = useData()
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [isFilterInitialized, setIsFilterInitialized] = useState(false)
  const [openMaterialFilter, setOpenMaterialFilter] = useState(false)
  const [chartType, setChartType] = useState<'stacked' | 'grouped'>('stacked')

  // State for date range filtering
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [fetchedData, setFetchedData] = useState<RawMaterialEntry[] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)

  // Determine if a single day is selected to toggle chart layout
  useEffect(() => {
    if (dateRange?.from) {
      const toDate = dateRange.to || dateRange.from
      const isSingleDay = isSameDay(dateRange.from, toDate)
      // Automatically toggle to grouped if single day, otherwise stacked
      setChartType(isSingleDay ? 'grouped' : 'stacked')
    }
  }, [dateRange])

  // Determine active dataset (props or fetched)
  const data = useMemo(() => {
    if (dateRange?.from && fetchedData) {
      return fetchedData
    }
    return initialData
  }, [dateRange, fetchedData, initialData])

  // Fetch data when date range changes
  useEffect(() => {
    async function fetchData() {
      if (!dateRange?.from || !currentFactoryId) {
        setFetchedData(null)
        return
      }

      // If "to" is missing, we might typically wait, but DatePicker often sets "from" first.
      // We'll require both for a valid range fetch, or single day if "to" is undefined (treated as single day filter)
      const fromDate = dateRange.from
      const toDate = dateRange.to || dateRange.from

      setIsLoading(true)
      try {
        const fromStr = format(fromDate, 'yyyy-MM-dd')
        const toStr = format(toDate, 'yyyy-MM-dd')

        const { data: result, error } = await supabase
          .from('raw_materials')
          .select('*')
          .eq('factory_id', currentFactoryId)
          .gte('date', fromStr)
          .lte('date', toStr)
          .order('date', { ascending: true })

        if (error) {
          console.error('Error fetching raw materials:', error)
          return
        }

        if (result) {
          const mappedData: RawMaterialEntry[] = result.map((item) => ({
            id: item.id,
            date: parseAsLocalNoon(item.date),
            supplier: item.supplier,
            type: item.type,
            quantity: Number(item.quantity),
            unit: item.unit,
            notes: item.notes,
            factoryId: item.factory_id || undefined,
            createdAt: item.created_at ? new Date(item.created_at) : undefined,
          }))
          setFetchedData(mappedData)
        }
      } catch (err) {
        console.error('Unexpected error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (dateRange?.from) {
      fetchData()
    } else {
      setFetchedData(null)
    }
  }, [dateRange, currentFactoryId])

  // Extract unique options for filters from the provided data and fixed categories
  const { materialOptions, supplierOptions } = useMemo(() => {
    const suppliers = new Set<string>()
    // Start with predefined categories to ensure they appear in filter
    const materials = new Set<string>(CATEGORIES)

    if (data) {
      data.forEach((item) => {
        if (item.type) materials.add(item.type)
        if (item.supplier) suppliers.add(item.supplier)
      })
    }

    return {
      materialOptions: Array.from(materials).sort(),
      supplierOptions: Array.from(suppliers).sort(),
    }
  }, [data])

  // Initialize selectedMaterials with all options on first load
  useEffect(() => {
    if (!isFilterInitialized && materialOptions.length > 0) {
      setSelectedMaterials(materialOptions)
      setIsFilterInitialized(true)
    }
  }, [materialOptions, isFilterInitialized])

  // Filter the data based on selection
  const filteredData = useMemo(() => {
    if (!data) return []
    return data.filter((item) => {
      const matchMaterial = selectedMaterials.includes(item.type)
      const matchSupplier =
        selectedSupplier === 'all' || item.supplier === selectedSupplier
      return matchMaterial && matchSupplier
    })
  }, [data, selectedMaterials, selectedSupplier])

  // Process data for Chart (Group by Date)
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
          total: 0,
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
        if (unit.includes('bag')) {
          quantity = quantity * 1400
        } else if (unit.includes('ton')) {
          quantity = quantity * 1000
        }

        entry[category] += quantity
        entry.total += quantity
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

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k'
    }
    return value.toString()
  }

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((current) =>
      current.includes(material)
        ? current.filter((item) => item !== material)
        : [...current, material],
    )
  }

  const toggleAllMaterials = () => {
    if (selectedMaterials.length === materialOptions.length) {
      setSelectedMaterials([])
    } else {
      setSelectedMaterials(materialOptions)
    }
  }

  const toggleChartType = () => {
    setChartType((current) => (current === 'stacked' ? 'grouped' : 'stacked'))
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
      <ComposedChart
        data={chartData}
        margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
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
          tickFormatter={formatValue}
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
            fill={`var(--color-${category})`}
            radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            maxBarSize={50}
            stackId={chartType === 'stacked' ? 'a' : undefined}
          >
            {chartType === 'grouped' && (
              <LabelList
                dataKey={category}
                position="top"
                offset={10}
                className="fill-foreground font-bold"
                fontSize={isMobile ? 8 : 10}
                formatter={(value: number) => {
                  if (value === 0) return ''
                  return formatValue(value)
                }}
              />
            )}
          </Bar>
        ))}

        {/* Total Label Line (Visible only in Stacked mode) */}
        {chartType === 'stacked' && (
          <Line
            type="monotone"
            dataKey="total"
            stroke="none"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          >
            <LabelList
              position="top"
              offset={10}
              className="fill-foreground font-bold"
              fontSize={isMobile ? 8 : 10}
              formatter={(value: number) => {
                if (value >= 1000) return (value / 1000).toFixed(0) + 'k'
                return value
              }}
            />
          </Line>
        )}
      </ComposedChart>
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
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto items-center">
          {/* New Date Range Picker Filter */}
          <div className="w-full sm:w-auto">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              className="w-full sm:w-[240px]"
            />
          </div>

          {/* Multi-select Material Filter */}
          <Popover
            open={openMaterialFilter}
            onOpenChange={setOpenMaterialFilter}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openMaterialFilter}
                className="w-full sm:w-[200px] h-10 sm:h-8 text-xs justify-between"
              >
                <div className="flex items-center truncate">
                  <Filter className="mr-2 h-3 w-3 text-muted-foreground" />
                  {selectedMaterials.length === 0
                    ? 'Selecione...'
                    : selectedMaterials.length === materialOptions.length
                      ? 'Todos os Materiais'
                      : `${selectedMaterials.length} selecionados`}
                </div>
                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Filtrar materiais..."
                  className="h-8 text-xs"
                />
                <CommandList>
                  <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={toggleAllMaterials}
                      className="text-xs cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          selectedMaterials.length === materialOptions.length
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <Check className={cn('h-4 w-4')} />
                      </div>
                      <span>Todos os Materiais</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {materialOptions.map((material) => {
                      const isSelected = selectedMaterials.includes(material)
                      return (
                        <CommandItem
                          key={material}
                          onSelect={() => toggleMaterial(material)}
                          className="text-xs cursor-pointer"
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className={cn('h-4 w-4')} />
                          </div>
                          <span>{material}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-8 text-xs">
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

          {/* Toggle Stacked/Grouped View */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleChartType}
            title={
              chartType === 'stacked'
                ? 'Mudar para Agrupado'
                : 'Mudar para Empilhado'
            }
          >
            {chartType === 'stacked' ? (
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Layers className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {chartType === 'stacked'
                ? 'Mudar para Agrupado'
                : 'Mudar para Empilhado'}
            </span>
          </Button>

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
        {isLoading ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        ) : selectedMaterials.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md bg-muted/10">
            Selecione pelo menos um tipo de material para visualizar.
          </div>
        ) : chartData.length > 0 ? (
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
