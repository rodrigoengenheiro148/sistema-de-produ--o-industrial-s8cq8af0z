import { useState, useEffect, useRef } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  TrendingUp,
  Factory as FactoryIcon,
  PieChart,
  DollarSign,
  FlaskConical,
  ClipboardCheck,
  Droplets,
  Bone,
  Wheat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RawMaterialChart } from '@/components/dashboard/RawMaterialChart'
import { ProductionPerformanceChart } from '@/components/dashboard/ProductionPerformanceChart'
import { LossAnalysisChart } from '@/components/dashboard/LossAnalysisChart'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { YieldHistoryChart } from '@/components/dashboard/YieldHistoryChart'
import { YieldGaugeChart } from '@/components/dashboard/YieldGaugeChart'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExportOptions } from '@/components/dashboard/ExportOptions'
import { SyncDeviceDialog } from '@/components/dashboard/SyncDeviceDialog'

export default function Dashboard() {
  const {
    rawMaterials,
    production,
    shipping,
    acidityRecords,
    qualityRecords,
    dateRange,
    setDateRange,
    factories,
    currentFactoryId,
    yieldTargets,
  } = useData()
  const isMobile = useIsMobile()

  const currentFactory = factories.find((f) => f.id === currentFactoryId)

  // Visual feedback state
  const [highlight, setHighlight] = useState(false)
  const isFirstRender = useRef(true)

  // Trigger visual highlight when data updates
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setHighlight(true)
    const timer = setTimeout(() => setHighlight(false), 2000)

    return () => clearTimeout(timer)
  }, [
    rawMaterials,
    production,
    shipping,
    acidityRecords,
    qualityRecords,
    yieldTargets,
  ])

  // Filter data based on date range
  const filterByDate = (date: Date) => {
    if (!dateRange.from || !dateRange.to) return true
    return isWithinInterval(date, {
      start: dateRange.from,
      end: dateRange.to,
    })
  }

  const filteredProduction = production
    .filter((p) => filterByDate(p.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const filteredRawMaterials = rawMaterials.filter((r) => filterByDate(r.date))
  const filteredShipping = shipping
    .filter((s) => filterByDate(s.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  const filteredAcidity = acidityRecords.filter((a) => filterByDate(a.date))
  const filteredQuality = qualityRecords.filter((q) => filterByDate(q.date))

  // KPIs General
  const totalEntradaMP = filteredRawMaterials.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  )
  const totalProducao = filteredProduction.reduce(
    (acc, curr) =>
      acc + curr.seboProduced + curr.fcoProduced + curr.farinhetaProduced,
    0,
  )
  const totalMPUsada = filteredProduction.reduce(
    (acc, curr) => acc + curr.mpUsed,
    0,
  )
  const rendimentoGeral =
    totalMPUsada > 0 ? (totalProducao / totalMPUsada) * 100 : 0

  const totalRevenue = filteredShipping.reduce(
    (acc, curr) => acc + curr.quantity * curr.unitPrice,
    0,
  )

  // Acidity KPI (Total processed volume checked)
  const totalAcidityVolume = filteredAcidity.reduce(
    (acc, curr) => acc + curr.volume,
    0,
  )

  // Quality KPIs (Averages)
  const farinhaQuality = filteredQuality.filter((q) => q.product === 'Farinha')
  const avgFarinhaAcidity =
    farinhaQuality.length > 0
      ? farinhaQuality.reduce((acc, curr) => acc + curr.acidity, 0) /
        farinhaQuality.length
      : 0
  const avgFarinhaProtein =
    farinhaQuality.length > 0
      ? farinhaQuality.reduce((acc, curr) => acc + curr.protein, 0) /
        farinhaQuality.length
      : 0

  const farinhetaQuality = filteredQuality.filter(
    (q) => q.product === 'Farinheta',
  )
  const avgFarinhetaAcidity =
    farinhetaQuality.length > 0
      ? farinhetaQuality.reduce((acc, curr) => acc + curr.acidity, 0) /
        farinhetaQuality.length
      : 0
  const avgFarinhetaProtein =
    farinhetaQuality.length > 0
      ? farinhetaQuality.reduce((acc, curr) => acc + curr.protein, 0) /
        farinhetaQuality.length
      : 0

  // Individual Yields Totals
  const totalSebo = filteredProduction.reduce(
    (acc, curr) => acc + curr.seboProduced,
    0,
  )
  const totalFCO = filteredProduction.reduce(
    (acc, curr) => acc + curr.fcoProduced,
    0,
  )
  const totalFarinheta = filteredProduction.reduce(
    (acc, curr) => acc + curr.farinhetaProduced,
    0,
  )

  const yieldSebo = totalMPUsada > 0 ? (totalSebo / totalMPUsada) * 100 : 0
  const yieldFCO = totalMPUsada > 0 ? (totalFCO / totalMPUsada) * 100 : 0
  const yieldFarinheta =
    totalMPUsada > 0 ? (totalFarinheta / totalMPUsada) * 100 : 0

  // Helper for conditional coloring based on targets
  const getYieldColorClass = (value: number, target: number) => {
    // If no data (0), stay neutral or handle as needed. Assuming 0 is bad if target > 0.
    if (value === 0 && target > 0) return 'text-destructive'
    return value >= target
      ? 'text-green-600 dark:text-green-500'
      : 'text-destructive'
  }

  // Dynamic classes for visual feedback
  const highlightClass = highlight
    ? 'ring-2 ring-primary bg-primary/5 shadow-md scale-[1.01] transition-all duration-300'
    : 'transition-all duration-700'

  return (
    <div id="dashboard-content" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            {currentFactory?.name || 'Visão Geral da Produção'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 no-print">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[240px] justify-start text-left font-normal border-primary/20 hover:bg-secondary/50',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                      {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range)}
                numberOfMonths={isMobile ? 1 : 2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 w-full sm:w-auto">
            <SyncDeviceDialog />
            <ExportOptions className="flex-1 sm:flex-none" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="no-print overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-muted/50 w-full sm:w-auto flex">
            <TabsTrigger
              value="overview"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Qualidade
            </TabsTrigger>
            <TabsTrigger
              value="yields"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Rendimentos Detalhados
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          {/* Main KPIs */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <Card
              className={cn(
                'border-l-4 border-l-chart-2 shadow-sm hover:shadow-md transition-shadow',
                highlightClass,
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entrada MP
                </CardTitle>
                <FactoryIcon className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalEntradaMP.toLocaleString('pt-BR')} kg
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow',
                highlightClass,
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produção
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalProducao.toLocaleString('pt-BR')} kg
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'border-l-4 border-l-chart-3 shadow-sm hover:shadow-md transition-shadow',
                highlightClass,
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rendimento Geral
                </CardTitle>
                <PieChart className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rendimentoGeral.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow',
                highlightClass,
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faturamento
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                  }).format(totalRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card
              className={cn(
                'border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-4 xl:col-span-1',
                highlightClass,
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vol. Acidez Analisado
                </CardTitle>
                <FlaskConical className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalAcidityVolume.toLocaleString('pt-BR')} L
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Yields Summary Cards for Overview */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="shadow-sm border-primary/10 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Rendimento Sebo
                </CardTitle>
                <Droplets
                  className="h-3.5 w-3.5"
                  style={{ color: 'hsl(var(--chart-1))' }}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-xl font-bold',
                    getYieldColorClass(yieldSebo, yieldTargets.sebo),
                  )}
                >
                  {yieldSebo.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Rendimento FCO
                </CardTitle>
                <Bone
                  className="h-3.5 w-3.5"
                  style={{ color: 'hsl(var(--chart-2))' }}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-xl font-bold',
                    getYieldColorClass(yieldFCO, yieldTargets.fco),
                  )}
                >
                  {yieldFCO.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Rendimento Farinheta
                </CardTitle>
                <Wheat
                  className="h-3.5 w-3.5"
                  style={{ color: 'hsl(var(--chart-3))' }}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-xl font-bold',
                    getYieldColorClass(yieldFarinheta, yieldTargets.farinheta),
                  )}
                >
                  {yieldFarinheta.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Row: Gauge + Raw Material */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
            <YieldGaugeChart
              value={rendimentoGeral}
              target={yieldTargets.total}
              className="col-span-1 md:col-span-1 lg:col-span-2 min-h-[400px]"
            />
            <RawMaterialChart
              data={filteredRawMaterials}
              className="col-span-1 md:col-span-2 lg:col-span-5"
              isMobile={isMobile}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ProductionPerformanceChart
              data={filteredProduction}
              isMobile={isMobile}
              className="col-span-1 md:col-span-2 lg:col-span-4"
            />
            <LossAnalysisChart
              data={filteredProduction}
              className="col-span-1 md:col-span-2 lg:col-span-3"
            />
          </div>

          <RevenueChart data={filteredShipping} isMobile={isMobile} />
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Qualidade Farinha
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Acidez Média
                  </div>
                  <div className="text-2xl font-bold">
                    {avgFarinhaAcidity.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Proteína Média
                  </div>
                  <div className="text-2xl font-bold">
                    {avgFarinhaProtein.toFixed(2)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-amber-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-700 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Qualidade Farinheta
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Acidez Média
                  </div>
                  <div className="text-2xl font-bold">
                    {avgFarinhetaAcidity.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Proteína Média
                  </div>
                  <div className="text-2xl font-bold">
                    {avgFarinhetaProtein.toFixed(2)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yields" className="space-y-4">
          <YieldHistoryChart data={filteredProduction} isMobile={isMobile} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
