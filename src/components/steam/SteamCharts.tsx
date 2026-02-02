import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartConfig } from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SteamChartCard, BarConfig } from '@/components/steam/SteamChartCard'

interface ChartDefinition {
  id: string
  title: string
  description: string
  showLegend: boolean
  bars: BarConfig[]
}

export function SteamCharts() {
  const { steamRecords, production, dateRange } = useData()
  const [expandedChartId, setExpandedChartId] = useState<string | null>(null)

  const processedData = useMemo(() => {
    const dataMap = new Map<
      string,
      {
        date: Date
        dateStr: string
        displayDate: string
        steamConsumption: number
        woodChips: number
        mpUsed: number
        totalProduction: number
      }
    >()

    // Filter and Process Steam Records
    steamRecords.forEach((record) => {
      if (
        dateRange.from &&
        (record.date < dateRange.from ||
          (dateRange.to && record.date > dateRange.to))
      ) {
        return
      }

      const dateKey = format(record.date, 'yyyy-MM-dd')
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: record.date,
          dateStr: dateKey,
          displayDate: format(record.date, 'dd/MM', { locale: ptBR }),
          steamConsumption: 0,
          woodChips: 0,
          mpUsed: 0,
          totalProduction: 0,
        })
      }
      const entry = dataMap.get(dateKey)!
      entry.steamConsumption += record.steamConsumption || 0
      entry.woodChips += record.woodChips || 0
    })

    // Filter and Process Production Records
    production.forEach((prod) => {
      if (
        dateRange.from &&
        (prod.date < dateRange.from ||
          (dateRange.to && prod.date > dateRange.to))
      ) {
        return
      }

      const dateKey = format(prod.date, 'yyyy-MM-dd')
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: prod.date,
          dateStr: dateKey,
          displayDate: format(prod.date, 'dd/MM', { locale: ptBR }),
          steamConsumption: 0,
          woodChips: 0,
          mpUsed: 0,
          totalProduction: 0,
        })
      }
      const entry = dataMap.get(dateKey)!
      entry.mpUsed += prod.mpUsed || 0
      entry.totalProduction +=
        (prod.seboProduced || 0) +
        (prod.fcoProduced || 0) +
        (prod.farinhetaProduced || 0)
    })

    return Array.from(dataMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )
  }, [steamRecords, production, dateRange])

  const chartConfig: ChartConfig = {
    steamConsumption: {
      label: 'Vapor (t)',
      color: 'hsl(var(--chart-1))',
    },
    woodChips: {
      label: 'Cavaco (m³)',
      color: 'hsl(var(--chart-2))',
    },
    mpUsed: {
      label: 'Matéria-Prima (kg)',
      color: 'hsl(var(--chart-3))',
    },
    totalProduction: {
      label: 'Produção (kg)',
      color: 'hsl(var(--chart-4))',
    },
  }

  const charts: ChartDefinition[] = [
    {
      id: 'steam',
      title: 'Consumo de Vapor',
      description: 'Total diário (t)',
      showLegend: false,
      bars: [{ dataKey: 'steamConsumption' }],
    },
    {
      id: 'cavacoVsVapor',
      title: 'Cavacos vs. Toneladas Vapor',
      description: 'Comparativo Diário',
      showLegend: true,
      bars: [{ dataKey: 'woodChips' }, { dataKey: 'steamConsumption' }],
    },
    {
      id: 'mpVsVapor',
      title: 'MPs vs. Vapor',
      description: 'Relação MP e Consumo de Vapor',
      showLegend: true,
      bars: [{ dataKey: 'mpUsed' }, { dataKey: 'steamConsumption' }],
    },
    {
      id: 'mpVsCavaco',
      title: 'MPs vs. m³ Cavaco',
      description: 'Relação MP e Combustível',
      showLegend: true,
      bars: [{ dataKey: 'mpUsed' }, { dataKey: 'woodChips' }],
    },
    {
      id: 'vaporVsMp',
      title: 'Vapor vs MPs',
      description: 'Eficiência Vapor/Matéria-Prima',
      showLegend: true,
      bars: [{ dataKey: 'steamConsumption' }, { dataKey: 'mpUsed' }],
    },
    {
      id: 'tonsVsMp',
      title: 'Tons vs. MPs',
      description: 'Produção Total vs Matéria-Prima',
      showLegend: true,
      bars: [
        { dataKey: 'totalProduction', name: 'Tons (Produção)' },
        { dataKey: 'mpUsed', name: 'MPs (Entrada)' },
      ],
    },
  ]

  const expandedChart = charts.find((c) => c.id === expandedChartId)

  if (processedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
        <p>Nenhum dado encontrado para o período selecionado.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {charts.map((chart) => (
          <SteamChartCard
            key={chart.id}
            title={chart.title}
            description={chart.description}
            data={processedData}
            config={chartConfig}
            bars={chart.bars}
            showLegend={chart.showLegend}
            onExpand={() => setExpandedChartId(chart.id)}
          />
        ))}
      </div>

      <Dialog
        open={!!expandedChartId}
        onOpenChange={(open) => !open && setExpandedChartId(null)}
      >
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col sm:rounded-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl">
              {expandedChart?.title}
            </DialogTitle>
            <DialogDescription>{expandedChart?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 w-full pt-2">
            {expandedChart && (
              <SteamChartCard
                title={expandedChart.title}
                description={expandedChart.description}
                data={processedData}
                config={chartConfig}
                bars={expandedChart.bars}
                showLegend={expandedChart.showLegend}
                chartHeight="h-full"
                className="h-full border-none shadow-none bg-transparent"
                hideHeader
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
