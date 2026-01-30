import { useData } from '@/context/DataContext'
import { format, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon, ClipboardCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { YieldHistoryChart } from '@/components/dashboard/YieldHistoryChart'
import { YieldBarChart } from '@/components/dashboard/YieldBarChart'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExportOptions } from '@/components/dashboard/ExportOptions'
import { SyncDeviceDialog } from '@/components/dashboard/SyncDeviceDialog'
import { HourlyThroughput } from '@/components/dashboard/HourlyThroughput'
import { ProductivityCard } from '@/components/dashboard/ProductivityCard'
import { HourlyProductionChart } from '@/components/dashboard/HourlyProductionChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const {
    production,
    qualityRecords,
    dateRange,
    setDateRange,
    factories,
    currentFactoryId,
  } = useData()
  const isMobile = useIsMobile()

  const currentFactory = factories.find((f) => f.id === currentFactoryId)

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

  const filteredQuality = qualityRecords.filter((q) => filterByDate(q.date))

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
              value="yields"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Rendimentos Detalhados
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Qualidade
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold tracking-tight">
              Monitoramento em Tempo Real
            </h3>
          </div>
          <HourlyProductionChart className="min-h-[500px]" />
          <div className="grid gap-4 md:grid-cols-2">
            <ProductivityCard />
            <HourlyThroughput />
          </div>
        </TabsContent>

        <TabsContent value="yields" className="space-y-4">
          <YieldBarChart data={filteredProduction} isMobile={isMobile} />
          <YieldHistoryChart data={filteredProduction} isMobile={isMobile} />
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
      </Tabs>
    </div>
  )
}
