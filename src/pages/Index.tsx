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
  Download,
  TrendingUp,
  Factory,
  PieChart,
  Droplets,
  Bone,
  Wheat,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Dashboard() {
  const { rawMaterials, production, shipping, dateRange, setDateRange } =
    useData()

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
  // Aggregate revenue by date
  const revenueMap = new Map<string, number>()
  filteredShipping.forEach((s) => {
    const key = format(s.date, 'dd/MM')
    revenueMap.set(key, (revenueMap.get(key) || 0) + s.quantity * s.unitPrice)
  })
  const revenueChartData = Array.from(revenueMap.entries())
    .map(([date, value]) => ({ date, revenue: value }))
    // Sort by date string is tricky for dd/MM, but assuming order from shipping filter
    .sort((a, b) => {
      // Basic approximation for sorting chart display
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
    perdas: { label: 'Perdas', color: 'hsl(var(--chart-3))' },
    revenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
  }

  const yieldChartConfig = {
    sebo: { label: 'Sebo', color: 'hsl(var(--chart-1))' },
    fco: { label: 'FCO', color: 'hsl(var(--chart-2))' },
    farinheta: { label: 'Farinheta', color: 'hsl(var(--chart-3))' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y', { locale: ptBR })} -{' '}
                      {format(dateRange.to, 'LLL dd, y', { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y', { locale: ptBR })
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range: any) => setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar Dados
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="yields">Rendimentos Individuais</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entrada MP
                </CardTitle>
                <Factory className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalEntradaMP.toLocaleString('pt-BR')} kg
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produção
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalProducao.toLocaleString('pt-BR')} kg
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rendimento
                </CardTitle>
                <PieChart className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rendimentoGeral.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-600 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Faturamento Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm">
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
            <Card className="col-span-3 shadow-sm">
              <CardHeader>
                <CardTitle>Análise de Perdas</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[300px] w-full"
                >
                  <BarChart data={lossesChartData}>
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
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Faturamento Diário</CardTitle>
              <CardDescription>
                Receita consolidada por dia de expedição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={revenueChartData}>
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
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="yields" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm">
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
            <Card className="shadow-sm">
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
            <Card className="shadow-sm">
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Histórico de Rendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={yieldChartConfig}
                className="h-[350px] w-full"
              >
                <LineChart data={yieldChartData}>
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
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="fco"
                    stroke="var(--color-fco)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="farinheta"
                    stroke="var(--color-farinheta)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
