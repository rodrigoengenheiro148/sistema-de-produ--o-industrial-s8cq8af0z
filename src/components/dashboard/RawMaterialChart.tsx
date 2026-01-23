import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Maximize2,
  Calendar as CalendarIcon,
  Filter,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isSameDay, getMonth, getYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RawMaterialChartViz } from './RawMaterialChartViz'
import { ChartConfig } from '@/components/ui/chart'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface RawMaterialChartProps {
  data: any[] // We accept data prop for compatibility but might override it with useData for local filtering
  className?: string
  isMobile?: boolean
}

export function RawMaterialChart({
  className,
  isMobile = false,
}: RawMaterialChartProps) {
  const { rawMaterials } = useData()

  // State for Filters
  const [filterMode, setFilterMode] = useState<'daily' | 'supplier'>('daily')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM'),
  )
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])

  // Controls state
  const [openSupplier, setOpenSupplier] = useState(false)

  // Available Data Source
  // If we have a specific local date filter, we MUST use the full rawMaterials dataset
  // otherwise we can respect the filtered data passed via props (if consistent) or just use rawMaterials filtered by global range.
  // To avoid confusion, let's derive our working dataset.

  // 1. Determine base dataset and time range
  // If selectedDate is set -> Filter for that day
  // If no selectedDate, use selectedMonth -> Filter for that month

  const workingData = useMemo(() => {
    let filtered = rawMaterials

    // Date Filtering
    if (selectedDate) {
      filtered = filtered.filter((item) => isSameDay(item.date, selectedDate))
    } else if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number)
      filtered = filtered.filter(
        (item) =>
          getYear(item.date) === year && getMonth(item.date) + 1 === month,
      )
    }

    // Supplier Filtering
    if (selectedSuppliers.length > 0) {
      filtered = filtered.filter((item) =>
        selectedSuppliers.includes(item.supplier),
      )
    }

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [rawMaterials, selectedDate, selectedMonth, selectedSuppliers])

  // Get unique lists for controls
  const allSuppliers = useMemo(() => {
    return Array.from(new Set(rawMaterials.map((item) => item.supplier))).sort()
  }, [rawMaterials])

  const allTypes = useMemo(() => {
    return Array.from(new Set(rawMaterials.map((item) => item.type))).sort()
  }, [rawMaterials])

  // Process data for Chart
  const { chartData, chartConfig } = useMemo(() => {
    const config: ChartConfig = {}

    // Assign colors to Types
    allTypes.forEach((type, index) => {
      config[type] = {
        label: type,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }
    })

    if (filterMode === 'daily') {
      // Group by Date
      const dateMap = new Map<string, any>()

      workingData.forEach((item) => {
        const dateKey = format(item.date, 'yyyy-MM-dd')
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            dateKey,
            displayDate: format(item.date, 'dd/MM'),
            fullDate: item.date,
            total: 0,
          })
        }
        const entry = dateMap.get(dateKey)
        entry[item.type] = (entry[item.type] || 0) + item.quantity
        entry.total += item.quantity
      })

      // Fill missing days if showing a month view?
      // For now, show days with data.
      return {
        chartData: Array.from(dateMap.values()).sort((a, b) =>
          a.dateKey.localeCompare(b.dateKey),
        ),
        chartConfig: config,
      }
    } else {
      // Supplier View (Aggregate)
      const supplierMap = new Map<string, any>()

      workingData.forEach((item) => {
        const supplier = item.supplier
        if (!supplierMap.has(supplier)) {
          supplierMap.set(supplier, {
            supplier,
            total: 0,
          })
        }
        const entry = supplierMap.get(supplier)
        entry[item.type] = (entry[item.type] || 0) + item.quantity
        entry.total += item.quantity
      })

      return {
        chartData: Array.from(supplierMap.values()).sort(
          (a, b) => b.total - a.total,
        ),
        chartConfig: config,
      }
    }
  }, [workingData, filterMode, allTypes])

  // Handling Date Selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    // If selecting a date, we might want to ensure the month selector reflects it, but keeping them independent is easier.
  }

  const toggleSupplier = (supplier: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplier)
        ? prev.filter((s) => s !== supplier)
        : [...prev, supplier],
    )
  }

  // Generate Month Options (Last 12 months)
  const monthOptions = useMemo(() => {
    const options = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      options.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy', { locale: ptBR }),
      })
    }
    return options
  }, [])

  const ChartContentWrapper = ({ height }: { height?: string }) => (
    <RawMaterialChartViz
      data={chartData}
      config={chartConfig}
      isMobile={isMobile}
      height={height}
      layout={filterMode}
    />
  )

  return (
    <Card
      className={cn('col-span-full shadow-sm border-primary/10', className)}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Entrada de MP</CardTitle>
            <CardDescription>Volume recebido por tipo e data</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-secondary/50 rounded-md p-1">
              <Button
                variant={filterMode === 'daily' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setFilterMode('daily')}
              >
                Diário
              </Button>
              <Button
                variant={filterMode === 'supplier' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setFilterMode('supplier')}
              >
                Fornecedor
              </Button>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Detalhamento de Entradas</DialogTitle>
                  <DialogDescription>
                    Visualização expandida com filtros aplicados.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 w-full min-h-0 py-4">
                  <ChartContentWrapper height="h-full" />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 items-center pt-1">
          {/* Date Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 text-xs justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {selectedDate
                  ? format(selectedDate, 'dd/MM/yyyy')
                  : 'Filtrar Dia'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Selecione o Mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  <span className="capitalize">{opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Supplier Multi-Select */}
          <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-dashed"
              >
                <Filter className="mr-2 h-3 w-3" />
                Fornecedores
                {selectedSuppliers.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1 text-[10px]"
                  >
                    {selectedSuppliers.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar fornecedor..." />
                <CommandList>
                  <CommandEmpty>Não encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {allSuppliers.map((supplier) => (
                      <CommandItem
                        key={supplier}
                        value={supplier}
                        onSelect={() => toggleSupplier(supplier)}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            selectedSuppliers.includes(supplier)
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible',
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        {supplier}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {selectedSuppliers.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => setSelectedSuppliers([])}
                          className="justify-center text-center"
                        >
                          Limpar filtros
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => setSelectedDate(undefined)}
            >
              Limpar Dia
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {chartData.length > 0 ? (
          <ChartContentWrapper height={isMobile ? 'h-[400px]' : 'h-[350px]'} />
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
            Nenhum dado encontrado para os filtros selecionados.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
