import { useState, useEffect, useRef } from 'react'
import { useData } from '@/context/DataContext'
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
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
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
  Droplets,
  Bone,
  Wheat,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RawMaterialChart } from '@/components/dashboard/RawMaterialChart'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExportOptions } from '@/components/dashboard/ExportOptions'

export default function Dashboard() {
  const {
    rawMaterials,
    production,
    shipping,
    dateRange,
    setDateRange,
    factories,
    currentFactoryId,
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
  }, [rawMaterials, production, shipping])

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

  // Chart Data Preparation - General
  const productionChartData = filteredProduction.map((p) => ({
    date: format(p.date, 'dd/MM'),
    producao: p.seboProduced + p.fcoProduced + p.farinhetaProduced,
    mp: p.mpUsed,
  }))

  const lossesChartData = filteredProduction.map((p) => ({
    date: format(p.date, 'dd/MM'),
    perdas: p.losses,
  }))

  // Chart Data Preparation - Revenue
  const revenueMap = new Map<string, number>()
  filteredShipping.forEach((s) => {
    const key = format(s.date, 'dd/MM')
    revenueMap.set(key, (revenueMap.get(key) || 0) + s.quantity * s.unitPrice)
  })
  const revenueChartData = Array.from(revenueMap.entries())
    .map(([date, value]) => ({ date, revenue: value }))
    .sort((a, b) => {
      const [da, ma] = a.date.split('/').map(Number)
      const [db, mb] = b.date.split('/').map(Number)
      return ma - mb || da - db
    })

  // Chart Data Preparation - Yields
  const yieldChartData = filteredProduction.map((p) => ({
    date: format(p.date, 'dd/MM'),
    sebo: p.mpUsed > 0 ? (p.seboProduced / p.mpUsed) * 100 : 0,
    fco: p.mpUsed > 0 ? (p.fcoProduced / p.mpUsed) * 100 : 0,
    farinheta: p.mpUsed > 0 ? (p.farinhetaProduced / p.mpUsed) * 100 : 0,
  }))

  const chartConfig = {
    producao: { label: 'Produção Total', color: 'hsl(var(--chart-1))' },
    mp: { label: 'MP Processada', color: 'hsl(var(--chart-2))' },
    perdas: { label: 'Perdas', color: 'hsl(var(--destructive))' },
    revenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  }

  const yieldChartConfig = {
    sebo: { label: 'Sebo', color: 'hsl(var(--chart-1))' },
    fco: { label: 'FCO', color: 'hsl(var(--chart-2))' },
    farinheta: { label: 'Farinheta', color: 'hsl(var(--chart-3))' },
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

        <div className="flex items-center gap-2 no-print">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-[240px] justify-start text-left font-normal border-primary/20 hover:bg-secondary/50',
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
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <ExportOptions />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="no-print">
          <TabsList className="bg-muted/50">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="yields"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Rendimentos Individuais
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  Rendimento
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
                  Faturamento Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalRevenue)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <RawMaterialChart data={filteredRawMaterials} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm border-primary/10">
              <CardHeader>
                <CardTitle>Desempenho de Produção</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={chartConfig}
                  className="h-[300px] w-full"
                >
                  <LineChart data={productionChartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="producao"
                      stroke="var(--color-producao)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="mp"
                      stroke="var(--color-mp)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3 shadow-sm border-primary/10">
              <CardHeader>
                <CardTitle>Análise de Perdas</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart data={lossesChartData} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="perdas"
                      fill="var(--color-perdas)"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList
                        dataKey="perdas"
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={12}
                        formatter={(value: any) =>
                          value > 0 ? `${value.toLocaleString('pt-BR')} kg` : ''
                        }
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle>Faturamento Diário</CardTitle>
              <CardDescription>
                Receita consolidada por dia de expedição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={revenueChartData} margin={{ top: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(value))
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="revenue"
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={12}
                      formatter={(value: any) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(value))
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="yields" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rendimento Sebo
                </CardTitle>
                <Droplets
                  className="h-4 w-4"
                  style={{ color: 'hsl(var(--chart-1))' }}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {yieldSebo.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rendimento FCO
                </CardTitle>
                <Bone
                  className="h-4 w-4"
                  style={{ color: 'hsl(var(--chart-2))' }}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{yieldFCO.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rendimento Farinheta
                </CardTitle>
                <Wheat
                  className="h-4 w-4"
                  style={{ color: 'hsl(var(--chart-3))' }}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {yieldFarinheta.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle>Histórico de Rendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={yieldChartConfig}
                className="h-[350px] w-full"
              >
                <LineChart
                  data={yieldChartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="sebo"
                    stroke="var(--color-sebo)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-sebo)' }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      position="top"
                      offset={12}
                      fill="var(--color-sebo)"
                      fontSize={isMobile ? 9 : 12}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </Line>
                  <Line
                    type="monotone"
                    dataKey="fco"
                    stroke="var(--color-fco)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-fco)' }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      position="top"
                      offset={12}
                      fill="var(--color-fco)"
                      fontSize={isMobile ? 9 : 12}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </Line>
                  <Line
                    type="monotone"
                    dataKey="farinheta"
                    stroke="var(--color-farinheta)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-farinheta)' }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      position="top"
                      offset={12}
                      fill="var(--color-farinheta)"
                      fontSize={isMobile ? 9 : 12}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </Line>
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
