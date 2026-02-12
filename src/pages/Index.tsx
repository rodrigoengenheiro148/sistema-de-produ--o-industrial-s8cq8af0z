import { useData } from '@/context/DataContext'
import {
  format,
  isWithinInterval,
  parse,
  isValid,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ClipboardCheck } from 'lucide-react'
import { cn, isBloodRecord } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { YieldHistoryChart } from '@/components/dashboard/YieldHistoryChart'
import { YieldBarChart } from '@/components/dashboard/YieldBarChart'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExportOptions } from '@/components/dashboard/ExportOptions'
import { SyncDeviceDialog } from '@/components/dashboard/SyncDeviceDialog'
import { OverviewCards } from '@/components/dashboard/OverviewCards'
import { LoadForecast } from '@/components/dashboard/LoadForecast'
import { ProductionPerformanceChart } from '@/components/dashboard/ProductionPerformanceChart'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { LossAnalysisChart } from '@/components/dashboard/LossAnalysisChart'
import { YieldGaugeChart } from '@/components/dashboard/YieldGaugeChart'
import { RawMaterialCompositionChart } from '@/components/dashboard/RawMaterialCompositionChart'
import { BloodYieldBarChart } from '@/components/dashboard/BloodYieldBarChart'
import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Dashboard() {
  const {
    production,
    rawMaterials,
    shipping,
    cookingTimeRecords,
    downtimeRecords,
    qualityRecords,
    acidityRecords,
    dateRange,
    setDateRange,
    factories,
    currentFactoryId,
    notificationSettings,
  } = useData()
  const isMobile = useIsMobile()

  const currentFactory = factories.find((f) => f.id === currentFactoryId)

  // Track current day to auto-update context when day changes
  const [today, setToday] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      if (now.getDate() !== today.getDate()) {
        setToday(now)
      }
    }, 60000) // Check every minute
    return () => clearInterval(timer)
  }, [today])

  // Determine effective date for forecast (and now for D-1 efficiency context)
  // If the selected range includes Today, we prioritize Today for the forecast
  // Otherwise we use the end date of the range
  const effectiveForecastDate = useMemo(() => {
    if (dateRange.from && dateRange.to) {
      if (
        isWithinInterval(today, { start: dateRange.from, end: dateRange.to })
      ) {
        return today
      }
      return dateRange.to
    }
    return dateRange.to || today
  }, [dateRange, today])

  // Filter data based on date range
  const filterByDate = (date: Date) => {
    if (!dateRange.from || !dateRange.to) return true
    return isWithinInterval(date, {
      start: dateRange.from,
      end: dateRange.to,
    })
  }

  // Memoize filtered data to prevent unnecessary re-renders
  const {
    filteredProduction,
    filteredRawMaterials,
    filteredShipping,
    filteredCookingTime,
    filteredDowntime,
    filteredQuality,
    filteredAcidity,
    uniqueClients,
  } = useMemo(() => {
    // Extract unique clients from ALL shipping data (not just filtered) to populate the filter list
    const clients = new Set<string>()
    shipping.forEach((s) => {
      if (s.client) clients.add(s.client)
    })
    const uniqueClientsList = Array.from(clients).sort()

    return {
      filteredProduction: production
        .filter((p) => filterByDate(p.date))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
      filteredRawMaterials: rawMaterials
        .filter((r) => filterByDate(r.date))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
      filteredShipping: shipping
        .filter((s) => filterByDate(s.date))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
      filteredCookingTime: cookingTimeRecords.filter((c) =>
        filterByDate(c.date),
      ),
      filteredDowntime: downtimeRecords.filter((d) => filterByDate(d.date)),
      filteredQuality: qualityRecords.filter((q) => filterByDate(q.date)),
      filteredAcidity: acidityRecords.filter((a) => filterByDate(a.date)),
      uniqueClients: uniqueClientsList,
    }
  }, [
    production,
    rawMaterials,
    shipping,
    cookingTimeRecords,
    downtimeRecords,
    qualityRecords,
    acidityRecords,
    dateRange,
  ])

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

  // Calculate Yield for Gauge (Industrial Only)
  const { currentYield, yieldTarget } = useMemo(() => {
    // Filter out blood records
    const industrialRecords = filteredProduction.filter(
      (p) => !isBloodRecord(p),
    )

    const totalMp = industrialRecords.reduce(
      (acc, curr) => acc + curr.mpUsed,
      0,
    )
    const totalProduced = industrialRecords.reduce(
      (acc, curr) =>
        acc + curr.seboProduced + curr.fcoProduced + curr.farinhetaProduced,
      0,
    )
    const yieldVal = totalMp > 0 ? (totalProduced / totalMp) * 100 : 0
    const target = notificationSettings.yieldThreshold || 58.0

    return { currentYield: yieldVal, yieldTarget: target }
  }, [filteredProduction, notificationSettings])

  // Input state for manual date entry
  const [dateInput, setDateInput] = useState('')
  const [inputError, setInputError] = useState(false)

  // Sync input with dateRange.from on mount or when context updates
  useEffect(() => {
    if (dateRange?.from) {
      setDateInput(format(dateRange.from, 'dd/MM/yyyy'))
    }
  }, [dateRange.from])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    // Allow only numbers and slash
    if (/[^0-9/]/.test(val)) return

    setDateInput(val)

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    if (dateRegex.test(val)) {
      const parsedDate = parse(val, 'dd/MM/yyyy', new Date())
      // Check if valid date and also if it round-trips correctly (handles invalid days like 32/01)
      if (isValid(parsedDate) && format(parsedDate, 'dd/MM/yyyy') === val) {
        setInputError(false)
        setDateRange({
          from: startOfDay(parsedDate),
          to: endOfDay(parsedDate),
        })
      } else {
        setInputError(true)
      }
    } else {
      // If full length but regex mismatch or incomplete
      if (val.length === 10) setInputError(true)
      else setInputError(false)
    }
  }

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
          <div className="relative w-full sm:w-[240px]">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              type="text"
              placeholder="DD/MM/AAAA"
              value={dateInput}
              onChange={handleDateChange}
              className={cn(
                'pl-9 border-primary/20 focus-visible:ring-primary',
                inputError && 'border-red-500 focus-visible:ring-red-500',
              )}
              maxLength={10}
            />
          </div>

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

        <TabsContent value="overview" className="space-y-6">
          <OverviewCards
            rawMaterials={filteredRawMaterials}
            production={filteredProduction}
            shipping={filteredShipping}
            cookingTimeRecords={filteredCookingTime}
            downtimeRecords={filteredDowntime}
            acidityRecords={filteredAcidity}
            notificationSettings={notificationSettings}
            fullProductionHistory={production}
            fullCookingTimeRecords={cookingTimeRecords}
            referenceDate={effectiveForecastDate}
          />

          <LoadForecast referenceDate={effectiveForecastDate} />

          <div className="grid gap-4 md:grid-cols-3">
            <YieldGaugeChart
              value={currentYield}
              target={yieldTarget}
              className="h-full"
            />
            <div className="md:col-span-2">
              <ProductionPerformanceChart
                data={filteredProduction}
                isMobile={isMobile}
                timeScale="daily"
                className="h-full"
              />
            </div>
          </div>

          <RawMaterialCompositionChart
            data={filteredRawMaterials}
            isMobile={isMobile}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <RevenueChart
              data={filteredShipping}
              productionData={filteredProduction}
              rawMaterials={filteredRawMaterials}
              allData={shipping}
              allProductionData={production}
              allRawMaterials={rawMaterials}
              isMobile={isMobile}
              timeScale="daily"
              allClients={uniqueClients}
            />
            <LossAnalysisChart
              data={filteredProduction}
              isMobile={isMobile}
              timeScale="daily"
            />
          </div>
        </TabsContent>

        <TabsContent value="yields" className="space-y-4">
          <YieldBarChart data={filteredProduction} isMobile={isMobile} />
          <YieldHistoryChart data={filteredProduction} isMobile={isMobile} />
          <BloodYieldBarChart
            productionData={filteredProduction}
            rawMaterialData={filteredRawMaterials}
            isMobile={isMobile}
          />
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
