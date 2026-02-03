import { useMemo, useState } from 'react'
import { ShippingEntry, ProductionEntry, RawMaterialEntry } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  Line,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  LabelList,
} from 'recharts'
import { format, isSameDay } from 'date-fns'
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
import {
  Maximize2,
  TrendingUp,
  DollarSign,
  Layers,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RevenueChartProps {
  data: ShippingEntry[]
  productionData?: ProductionEntry[]
  rawMaterials?: RawMaterialEntry[]
  timeScale?: 'daily' | 'monthly'
  isMobile?: boolean
  className?: string
  forecastMetrics?: {
    total: number
    previous: number
    percentage: number
  }
  activeFilter?: string[]
  onFilterChange?: (filters: string[]) => void
  clientFilter?: string[]
  onClientFilterChange?: (clients: string[]) => void
  allClients?: string[]
}

const PRODUCT_COLORS: Record<string, string> = {
  Sebo: 'hsl(var(--chart-1))',
  FCO: 'hsl(var(--chart-2))',
  'Farinha Especial': 'hsl(var(--chart-5))',
  Farinha: 'hsl(var(--chart-2))',
  Farinheta: 'hsl(var(--chart-3))',
  'Matéria-Prima': 'hsl(var(--chart-4))',
}

const DEFAULT_FILTERS = ['Sebo', 'FCO', 'Farinheta', 'Farinha Especial']

export function RevenueChart({
  data,
  productionData = [],
  rawMaterials = [],
  timeScale = 'daily',
  isMobile = false,
  className,
  forecastMetrics,
  activeFilter = DEFAULT_FILTERS,
  onFilterChange,
  clientFilter = [],
  onClientFilterChange,
  allClients = [],
}: RevenueChartProps) {
  const [groupBy, setGroupBy] = useState<'product' | 'client'>('product')

  // Local state for filter if not controlled
  const [localFilter, setLocalFilter] = useState<string[]>(DEFAULT_FILTERS)
  const currentFilter = onFilterChange ? activeFilter : localFilter

  const handleFilterChange = (val: string) => {
    const newFilter = currentFilter.includes(val)
      ? currentFilter.filter((f) => f !== val)
      : [...currentFilter, val]

    if (onFilterChange) {
      onFilterChange(newFilter)
    } else {
      setLocalFilter(newFilter)
    }
  }

  const handleClientFilterChange = (val: string) => {
    if (!onClientFilterChange) return
    const newFilter = clientFilter.includes(val)
      ? clientFilter.filter((f) => f !== val)
      : [...clientFilter, val]
    onClientFilterChange(newFilter)
  }

  const normalizeToKg = (quantity: number, unit?: string) => {
    const u = unit?.toLowerCase() || ''
    if (u.includes('bag')) return quantity * 1400
    if (u.includes('ton')) return quantity * 1000
    return quantity
  }

  const {
    chartData,
    chartConfig,
    keys,
    averageRevenue,
    maxRevenue,
    maxDate,
    totalForecast,
    calculatedForecastTotal,
  } = useMemo(() => {
    // 1. Calculate Average Unit Prices from Shipping Data
    const prices: Record<string, number> = {}
    const counts: Record<string, number> = {}

    data.forEach((s) => {
      const product = s.product
      if (!prices[product]) {
        prices[product] = 0
        counts[product] = 0
      }
      prices[product] += s.unitPrice * s.quantity
      counts[product] += s.quantity
    })

    const avgPrices: Record<string, number> = {}
    Object.keys(prices).forEach((p) => {
      avgPrices[p] = counts[p] > 0 ? prices[p] / counts[p] : 0
    })

    // 2. Calculate Historical Yields from Production Data
    let totalMp = 0
    let totalSebo = 0
    let totalFco = 0
    let totalFarinheta = 0

    productionData.forEach((p) => {
      totalMp += p.mpUsed
      totalSebo += p.seboProduced
      totalFco += p.fcoProduced
      totalFarinheta += p.farinhetaProduced
    })

    const yields: Record<string, number> = {
      Sebo: totalMp > 0 ? totalSebo / totalMp : 0.15,
      FCO: totalMp > 0 ? totalFco / totalMp : 0.2,
      Farinheta: totalMp > 0 ? totalFarinheta / totalMp : 0.05,
      'Farinha Especial': 0.1, // Default as per requirements (no tracking col yet)
    }

    const uniqueKeys = new Set<string>()
    const dateMap = new Map<string, any>()
    let globalTotal = 0
    let globalForecast = 0

    // 3. Process Shipping Data (Realized Revenue)
    data.forEach((s) => {
      if (!s.date) return
      if (!currentFilter.includes(s.product)) return

      let dateKey: string
      let displayDate: string
      let fullDate: string

      if (timeScale === 'monthly') {
        dateKey = format(s.date, 'yyyy-MM')
        displayDate = format(s.date, 'MMM', { locale: ptBR })
        fullDate = format(s.date, 'MMMM yyyy', { locale: ptBR })
      } else {
        dateKey = format(s.date, 'yyyy-MM-dd')
        displayDate = format(s.date, 'dd/MM')
        fullDate = format(s.date, "dd 'de' MMMM", { locale: ptBR })
      }

      const revenue = s.quantity * s.unitPrice
      const groupKey = groupBy === 'product' ? s.product : s.client

      uniqueKeys.add(groupKey)
      globalTotal += revenue

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          dateKey,
          displayDate,
          fullDate,
          originalDate: s.date,
          totalRevenue: 0,
          forecastRevenue: 0,
        })
      }

      const entry = dateMap.get(dateKey)
      entry[groupKey] = (entry[groupKey] || 0) + revenue
      entry.totalRevenue += revenue
    })

    // 4. Process Raw Materials for Forecast (Projected Revenue)
    // We iterate through all raw materials to ensure we have forecast even for days without sales
    const rawMaterialDates = new Set<string>()
    rawMaterials.forEach((r) => {
      if (!r.date) return
      // Exclude Blood from main line projection
      if (r.type?.toLowerCase() === 'sangue') return

      let dateKey: string
      if (timeScale === 'monthly') {
        dateKey = format(r.date, 'yyyy-MM')
      } else {
        dateKey = format(r.date, 'yyyy-MM-dd')
      }
      rawMaterialDates.add(dateKey)

      if (!dateMap.has(dateKey)) {
        let displayDate: string
        let fullDate: string
        if (timeScale === 'monthly') {
          displayDate = format(r.date, 'MMM', { locale: ptBR })
          fullDate = format(r.date, 'MMMM yyyy', { locale: ptBR })
        } else {
          displayDate = format(r.date, 'dd/MM')
          fullDate = format(r.date, "dd 'de' MMMM", { locale: ptBR })
        }

        dateMap.set(dateKey, {
          dateKey,
          displayDate,
          fullDate,
          originalDate: r.date,
          totalRevenue: 0,
          forecastRevenue: 0,
        })
      }

      const entry = dateMap.get(dateKey)
      const quantityKg = normalizeToKg(r.quantity, r.unit)

      // Calculate potential value based strictly on filtered products
      // Formula: MP * Yield * AvgPrice
      let dailyForecast = 0

      if (currentFilter.includes('Sebo')) {
        dailyForecast += quantityKg * yields['Sebo'] * (avgPrices['Sebo'] || 0)
      }
      if (currentFilter.includes('FCO')) {
        dailyForecast +=
          quantityKg *
          yields['FCO'] *
          (avgPrices['FCO'] || avgPrices['Farinha'] || 0)
      }
      if (currentFilter.includes('Farinheta')) {
        dailyForecast +=
          quantityKg * yields['Farinheta'] * (avgPrices['Farinheta'] || 0)
      }
      if (currentFilter.includes('Farinha Especial')) {
        dailyForecast +=
          quantityKg *
          yields['Farinha Especial'] *
          (avgPrices['Farinha Especial'] || 0)
      }

      entry.forecastRevenue += dailyForecast
      globalForecast += dailyForecast
    })

    const processedData = Array.from(dateMap.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    )

    const avg =
      processedData.length > 0 ? globalTotal / processedData.length : 0

    // Find peak
    let max = 0
    let mDate = ''
    processedData.forEach((d) => {
      if (d.totalRevenue > max) {
        max = d.totalRevenue
        mDate = d.fullDate
      }
    })

    const sortedKeys = Array.from(uniqueKeys).sort()
    const config: ChartConfig = {
      forecastRevenue: {
        label: 'Projeção (Produção)',
        color: 'hsl(var(--muted-foreground))',
      },
    }

    // Assign colors
    sortedKeys.forEach((key, index) => {
      if (groupBy === 'product' && PRODUCT_COLORS[key]) {
        config[key] = {
          label: key,
          color: PRODUCT_COLORS[key],
        }
      } else {
        config[key] = {
          label: key,
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        }
      }
    })

    if (sortedKeys.length === 0) {
      config['empty'] = { label: 'Sem dados', color: 'transparent' }
    }

    return {
      chartData: processedData,
      chartConfig: config,
      keys: sortedKeys,
      totalRevenue: globalTotal,
      averageRevenue: avg,
      maxRevenue: max,
      maxDate: mDate,
      totalForecast: globalForecast,
      calculatedForecastTotal: globalForecast,
    }
  }, [data, productionData, rawMaterials, groupBy, timeScale, currentFilter])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)

  const formatCompact = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 1,
    }).format(value)

  const displayTotalForecast = forecastMetrics?.total ?? calculatedForecastTotal

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
        />
        <XAxis
          dataKey="displayDate"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 35 : 60}
          tickFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              compactDisplay: 'short',
              style: 'currency',
              currency: 'BRL',
            }).format(value)
          }
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          content={
            <ChartTooltipContent
              labelFormatter={(value, payload) => {
                return payload[0]?.payload?.fullDate || value
              }}
              formatter={(value, name, item) => (
                <div className="flex items-center gap-2 w-full min-w-[150px]">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground flex-1 text-xs">
                    {name}
                  </span>
                  <span className="font-semibold text-foreground text-xs font-mono">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />

        {/* Actual Revenue Bars */}
        {keys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={`var(--color-${key})`}
            radius={[0, 0, 0, 0]}
            maxBarSize={60}
          >
            <LabelList
              dataKey={key}
              position="inside"
              className="fill-white font-bold"
              style={{
                textShadow: '0px 1px 2px rgba(0,0,0,0.6)',
                pointerEvents: 'none',
              }}
              fontSize={isMobile ? 9 : 10}
              formatter={(value: number) => {
                if (value === 0) return ''
                return formatCompact(value)
              }}
            />
          </Bar>
        ))}

        {/* Forecast Line */}
        <Line
          type="monotone"
          dataKey="forecastRevenue"
          name="Projeção (Produção)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: 'hsl(var(--muted-foreground))' }}
        />

        <ReferenceLine
          y={averageRevenue}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="3 3"
          label={{
            position: 'insideBottomRight',
            value: 'Média',
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 10,
          }}
        />
      </ComposedChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="pb-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Receita {timeScale === 'monthly' ? 'Mensal' : 'Diária'}
            </CardTitle>
            <CardDescription>
              Realizado (Expedição) vs Projetado (Produção)
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Client Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden xs:inline text-xs">Clientes</span>
                  {clientFilter.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1 text-[10px]">
                      {clientFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filtrar Clientes</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[200px]">
                  {allClients.length > 0 ? (
                    allClients.map((client) => (
                      <DropdownMenuCheckboxItem
                        key={client}
                        checked={clientFilter.includes(client)}
                        onCheckedChange={() => handleClientFilterChange(client)}
                      >
                        {client}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      Nenhum cliente disponível
                    </div>
                  )}
                </ScrollArea>
                {clientFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => onClientFilterChange?.([])}
                    >
                      Limpar Filtro
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Material Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden xs:inline text-xs">Materiais</span>
                  {currentFilter.length < 4 && (
                    <Badge variant="secondary" className="h-5 px-1 text-[10px]">
                      {currentFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar Materiais</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={currentFilter.includes('Sebo')}
                  onCheckedChange={() => handleFilterChange('Sebo')}
                >
                  Sebo
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilter.includes('FCO')}
                  onCheckedChange={() => handleFilterChange('FCO')}
                >
                  FCO
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilter.includes('Farinheta')}
                  onCheckedChange={() => handleFilterChange('Farinheta')}
                >
                  Farinheta
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentFilter.includes('Farinha Especial')}
                  onCheckedChange={() => handleFilterChange('Farinha Especial')}
                >
                  Farinha Especial
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tabs
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as 'product' | 'client')}
              className="w-[180px]"
            >
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="product" className="text-xs px-2 h-6">
                  <Layers className="h-3 w-3 mr-1" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="client" className="text-xs px-2 h-6">
                  <Users className="h-3 w-3 mr-1" />
                  Clientes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted"
                >
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Expandir</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    Detalhamento de Receita{' '}
                    {timeScale === 'monthly' ? 'Mensal' : 'Diária'}
                  </DialogTitle>
                  <DialogDescription>
                    Visualização expandida do faturamento.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 w-full min-h-0 py-4">
                  <ChartContent height="h-full" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                  <div>
                    Média Real:{' '}
                    <span className="font-medium text-foreground">
                      {formatCurrency(averageRevenue)}
                    </span>
                  </div>
                  <div>
                    Projeção Total (Período):{' '}
                    <span className="font-medium text-foreground">
                      {formatCurrency(displayTotalForecast)}
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Forecast Summary Section */}
        {forecastMetrics && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/20 rounded-lg p-3 border border-border/50 gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Previsão de Faturamento
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {formatCurrency(displayTotalForecast)}
                </span>
                {forecastMetrics.previous > 0 && (
                  <Badge
                    variant={
                      forecastMetrics.percentage >= 0
                        ? 'default'
                        : 'destructive'
                    }
                    className={cn(
                      'px-1.5 py-0.5 h-auto text-[10px] font-bold',
                      forecastMetrics.percentage >= 0
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400',
                    )}
                  >
                    {forecastMetrics.percentage >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(forecastMetrics.percentage).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">
                Baseado em MP + Rendimentos (Filtro:{' '}
                {currentFilter.join(', ') || 'Nenhum'}
                {clientFilter.length > 0
                  ? ` | Clientes: ${clientFilter.length}`
                  : ''}
                )
              </span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-muted-foreground">
                Período Anterior
              </span>
              <span className="font-mono text-sm">
                {formatCurrency(forecastMetrics.previous)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2 flex-1 min-h-0">
        {chartData.length > 0 || totalForecast > 0 ? (
          <ChartContent />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
            Selecione ao menos um material para visualizar os dados.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t bg-muted/5 pt-4">
        {maxRevenue > 0 ? (
          <div className="flex w-full items-start gap-2 leading-none">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            <div className="grid gap-1">
              <span className="font-medium text-foreground">
                Pico de Faturamento: {formatCurrency(maxRevenue)}
              </span>
              <span className="text-muted-foreground text-xs">
                Registrado em {maxDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Sem faturamento registrado para os filtros selecionados.
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
