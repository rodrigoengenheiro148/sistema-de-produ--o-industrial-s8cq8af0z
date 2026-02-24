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
import { MAR_RECICLAGEM_TYPES, RAW_MATERIAL_TYPES } from '@/lib/constants'

interface RawMaterialCompositionChartProps {
  data: RawMaterialEntry[]
  isMobile?: boolean
  className?: string
}

const TYPE_COLORS: Record<string, string> = {
  Barrigada: '#14532d',
  'COURO BOVINO': '#15803d',
  'Couros Bovinos': '#15803d',
  Despojo: '#22c55e',
  MUXIBA: '#eab308',
  Misto: '#f97316',
  Ossos: '#0f172a',
  'VISCERAS DE PEIXE': '#3b82f6',
  Sangue: '#dc2626',
  'Óleo Saturado': '#8b5cf6',
  'Oleo Saturado': '#8b5cf6',
  Peixe: '#0ea5e9',
  Bovino: '#7f1d1d',
  Aves: '#fbbf24',
  Pena: '#71717a',
  Vísceras: '#f43f5e',
  Visceras: '#f43f5e',
  'RESIDUOS INDUSTRIAIS': '#84cc16',
  'Resíduos Industriais': '#84cc16',
}

const FALLBACK_COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#9333ea',
  '#db2777',
  '#0891b2',
]

export function RawMaterialCompositionChart({
  data: initialData,
  isMobile = false,
  className,
}: RawMaterialCompositionChartProps) {
  const { currentFactoryId, factories } = useData()
  const [excludedMaterials, setExcludedMaterials] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [openMaterialFilter, setOpenMaterialFilter] = useState(false)
  const [chartType, setChartType] = useState<'stacked' | 'grouped'>('stacked')

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [fetchedData, setFetchedData] = useState<RawMaterialEntry[] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (dateRange?.from) {
      const toDate = dateRange.to || dateRange.from
      const isSingleDay = isSameDay(dateRange.from, toDate)
      setChartType(isSingleDay ? 'grouped' : 'stacked')
    }
  }, [dateRange])

  const data = useMemo(() => {
    if (dateRange?.from && fetchedData) {
      return fetchedData
    }
    return initialData
  }, [dateRange, fetchedData, initialData])

  useEffect(() => {
    async function fetchData() {
      if (!dateRange?.from || !currentFactoryId) {
        setFetchedData(null)
        return
      }

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
            supplier: item.supplier || '',
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

  const baseTypes = useMemo(() => {
    const currentFactory = factories.find((f) => f.id === currentFactoryId)
    const isMarReciclagem = currentFactory?.name
      ?.trim()
      .toLowerCase()
      .includes('reciclagem')
    return isMarReciclagem ? MAR_RECICLAGEM_TYPES : RAW_MATERIAL_TYPES
  }, [factories, currentFactoryId])

  const { materialOptions, supplierOptions, categoryColors } = useMemo(() => {
    const suppliers = new Set<string>()
    const materials = new Set<string>()

    baseTypes.forEach((t) => materials.add(t))

    if (data) {
      data.forEach((item) => {
        if (item.type) materials.add(item.type)
        if (item.supplier) suppliers.add(item.supplier)
      })
    }

    const sortedMaterials = Array.from(materials).sort()
    const computedColors: Record<string, string> = { ...TYPE_COLORS }

    sortedMaterials.forEach((mat, idx) => {
      if (!computedColors[mat]) {
        computedColors[mat] = FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
      }
    })

    return {
      materialOptions: sortedMaterials,
      supplierOptions: Array.from(suppliers).sort(),
      categoryColors: computedColors,
    }
  }, [data, baseTypes])

  const selectedMaterials = useMemo(
    () => materialOptions.filter((m) => !excludedMaterials.includes(m)),
    [materialOptions, excludedMaterials],
  )

  const filteredData = useMemo(() => {
    if (!data) return []
    return data.filter((item) => {
      const matchMaterial = !excludedMaterials.includes(item.type)
      const matchSupplier =
        selectedSupplier === 'all' || item.supplier === selectedSupplier
      return matchMaterial && matchSupplier
    })
  }, [data, excludedMaterials, selectedSupplier])

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
        })
      }

      const entry = dailyMap.get(dateKey)
      if (entry[item.type] === undefined) {
        entry[item.type] = 0
      }

      let quantity = item.quantity
      const unit = item.unit?.toLowerCase() || ''

      if (unit.includes('bag')) {
        quantity = quantity * 1400
      } else if (unit.includes('ton')) {
        quantity = quantity * 1000
      }

      entry[item.type] += quantity
      entry.total += quantity
    })

    return Array.from(dailyMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    )
  }, [filteredData])

  const activeCategories = useMemo(() => {
    const active = new Set<string>()
    chartData.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (
          key !== 'dateKey' &&
          key !== 'displayDate' &&
          key !== 'fullDateLabel' &&
          key !== 'timestamp' &&
          key !== 'total' &&
          entry[key] > 0
        ) {
          active.add(key)
        }
      })
    })
    return Array.from(active).sort()
  }, [chartData])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    materialOptions.forEach((cat) => {
      config[cat] = {
        label: cat,
        color: categoryColors[cat] || '#cccccc',
      }
    })
    return config
  }, [materialOptions, categoryColors])

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k'
    }
    return value.toString()
  }

  const toggleMaterial = (material: string) => {
    setExcludedMaterials((current) =>
      current.includes(material)
        ? current.filter((item) => item !== material)
        : [...current, material],
    )
  }

  const toggleAllMaterials = () => {
    if (excludedMaterials.length > 0) {
      setExcludedMaterials([])
    } else {
      setExcludedMaterials(materialOptions)
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
            fill={categoryColors[category] || '#cccccc'}
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
          <div className="w-full sm:w-auto">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              className="w-full sm:w-[240px]"
            />
          </div>

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
                          excludedMaterials.length === 0
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
                      const isSelected = !excludedMaterials.includes(material)
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
