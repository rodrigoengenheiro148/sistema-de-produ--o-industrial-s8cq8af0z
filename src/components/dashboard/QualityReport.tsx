import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format, subDays, differenceInDays, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Activity, Sigma, FileBarChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { ExportOptions } from '@/components/dashboard/ExportOptions'
import { Badge } from '@/components/ui/badge'
import { StatCard } from './StatCard'
import { QualityChart } from './QualityChart'

const calculateMean = (data: number[]) => {
  if (!data.length) return 0
  return data.reduce((a, b) => a + b, 0) / data.length
}

const calculateStdDev = (data: number[], mean: number) => {
  if (data.length <= 1) return 0
  const variance =
    data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    (data.length - 1)
  return Math.sqrt(variance)
}

const calculateMovingAverage = (
  data: any[],
  key: string,
  windowSize: number,
) => {
  return data.map((item, index, arr) => {
    const start = Math.max(0, index - windowSize + 1)
    const subset = arr.slice(start, index + 1)
    const sum = subset.reduce((acc, curr) => acc + (curr[key] || 0), 0)
    return {
      ...item,
      [`${key}MA`]: sum / subset.length,
    }
  })
}

export function QualityReport() {
  const { qualityRecords, dateRange, setDateRange } = useData()
  const isMobile = useIsMobile()

  const daysDiff =
    dateRange.from && dateRange.to
      ? differenceInDays(dateRange.to, dateRange.from) + 1
      : 30

  const previousDateRange = useMemo(() => {
    if (!dateRange.from || !dateRange.to)
      return { from: undefined, to: undefined }
    return {
      from: subDays(dateRange.from, daysDiff),
      to: subDays(dateRange.to, daysDiff),
    }
  }, [dateRange, daysDiff])

  const getMetrics = (range: { from?: Date; to?: Date }, product: string) => {
    if (!range.from || !range.to)
      return {
        meanAcidity: 0,
        stdDevAcidity: 0,
        meanProtein: 0,
        stdDevProtein: 0,
        count: 0,
        records: [],
      }

    const records = qualityRecords
      .filter(
        (r) =>
          isWithinInterval(r.date, { start: range.from!, end: range.to! }) &&
          r.product === product,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const acidityValues = records.map((r) => r.acidity)
    const proteinValues = records.map((r) => r.protein)
    const meanAcidity = calculateMean(acidityValues)
    const meanProtein = calculateMean(proteinValues)

    return {
      meanAcidity,
      stdDevAcidity: calculateStdDev(acidityValues, meanAcidity),
      meanProtein,
      stdDevProtein: calculateStdDev(proteinValues, meanProtein),
      count: records.length,
      records,
    }
  }

  const prepareChartData = (records: any[], metric: 'acidity' | 'protein') => {
    const dailyMap = new Map<
      string,
      { date: Date; val: number; count: number }
    >()
    records.forEach((r) => {
      const key = format(r.date, 'yyyy-MM-dd')
      const val = metric === 'acidity' ? r.acidity : r.protein
      if (!dailyMap.has(key))
        dailyMap.set(key, { date: r.date, val: 0, count: 0 })
      const entry = dailyMap.get(key)!
      entry.val += val
      entry.count += 1
    })
    const chartData = Array.from(dailyMap.values())
      .map((entry) => ({
        dateStr: format(entry.date, 'dd/MM'),
        date: entry.date,
        value: entry.val / entry.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    return calculateMovingAverage(chartData, 'value', 3)
  }

  const farinhaCurrent = useMemo(
    () => getMetrics(dateRange, 'Farinha'),
    [dateRange, qualityRecords],
  )
  const farinhaPrev = useMemo(
    () => getMetrics(previousDateRange, 'Farinha'),
    [previousDateRange, qualityRecords],
  )
  const farinhetaCurrent = useMemo(
    () => getMetrics(dateRange, 'Farinheta'),
    [dateRange, qualityRecords],
  )
  const farinhetaPrev = useMemo(
    () => getMetrics(previousDateRange, 'Farinheta'),
    [previousDateRange, qualityRecords],
  )

  const farinhaAcidityData = useMemo(
    () => prepareChartData(farinhaCurrent.records, 'acidity'),
    [farinhaCurrent],
  )
  const farinhaProteinData = useMemo(
    () => prepareChartData(farinhaCurrent.records, 'protein'),
    [farinhaCurrent],
  )
  const farinhetaAcidityData = useMemo(
    () => prepareChartData(farinhetaCurrent.records, 'acidity'),
    [farinhetaCurrent],
  )
  const farinhetaProteinData = useMemo(
    () => prepareChartData(farinhetaCurrent.records, 'protein'),
    [farinhetaCurrent],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <p className="text-muted-foreground text-sm">
          Filtre por período para análise detalhada de qualidade.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
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
          <ExportOptions className="w-full sm:w-auto" />
        </div>
      </div>

      <Tabs defaultValue="farinha" className="space-y-4">
        <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="farinha" className="flex-1 sm:flex-none">
              Farinha Carne/Osso
            </TabsTrigger>
            <TabsTrigger value="farinheta" className="flex-1 sm:flex-none">
              Farinheta
            </TabsTrigger>
          </TabsList>
          {dateRange.from && dateRange.to && (
            <Badge
              variant="outline"
              className="hidden sm:flex ml-2 whitespace-nowrap"
            >
              {differenceInDays(dateRange.to, dateRange.from) + 1} dias
            </Badge>
          )}
        </div>

        <TabsContent
          value="farinha"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Acidez Média"
              value={farinhaCurrent.meanAcidity}
              prevValue={farinhaPrev.meanAcidity}
              unit="%"
              icon={Activity}
            />
            <StatCard
              title="Desvio Padrão (Acidez)"
              value={farinhaCurrent.stdDevAcidity}
              prevValue={farinhaPrev.stdDevAcidity}
              icon={Sigma}
              details="Dispersão"
            />
            <StatCard
              title="Proteína Média"
              value={farinhaCurrent.meanProtein}
              prevValue={farinhaPrev.meanProtein}
              unit="%"
              icon={Activity}
            />
            <StatCard
              title="Total de Análises"
              value={farinhaCurrent.count}
              prevValue={farinhaPrev.count}
              icon={FileBarChart}
              unit=""
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <QualityChart
              title="Tendência de Acidez"
              data={farinhaAcidityData}
              mean={farinhaCurrent.meanAcidity}
              stdDev={farinhaCurrent.stdDevAcidity}
              unit="%"
            />
            <QualityChart
              title="Tendência de Proteína"
              data={farinhaProteinData}
              mean={farinhaCurrent.meanProtein}
              stdDev={farinhaCurrent.stdDevProtein}
              unit="%"
            />
          </div>
        </TabsContent>

        <TabsContent
          value="farinheta"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Acidez Média"
              value={farinhetaCurrent.meanAcidity}
              prevValue={farinhetaPrev.meanAcidity}
              unit="%"
              icon={Activity}
            />
            <StatCard
              title="Desvio Padrão (Acidez)"
              value={farinhetaCurrent.stdDevAcidity}
              prevValue={farinhetaPrev.stdDevAcidity}
              icon={Sigma}
              details="Dispersão"
            />
            <StatCard
              title="Proteína Média"
              value={farinhetaCurrent.meanProtein}
              prevValue={farinhetaPrev.meanProtein}
              unit="%"
              icon={Activity}
            />
            <StatCard
              title="Total de Análises"
              value={farinhetaCurrent.count}
              prevValue={farinhetaPrev.count}
              icon={FileBarChart}
              unit=""
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <QualityChart
              title="Tendência de Acidez"
              data={farinhetaAcidityData}
              mean={farinhetaCurrent.meanAcidity}
              stdDev={farinhetaCurrent.stdDevAcidity}
              unit="%"
            />
            <QualityChart
              title="Tendência de Proteína"
              data={farinhetaProteinData}
              mean={farinhetaCurrent.meanProtein}
              stdDev={farinhetaCurrent.stdDevProtein}
              unit="%"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
