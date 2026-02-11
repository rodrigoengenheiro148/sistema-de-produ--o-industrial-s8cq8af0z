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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SteamChartCard, BarConfig } from '@/components/steam/SteamChartCard'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle } from 'lucide-react'

interface ChartDefinition {
  id: string
  title: string
  description: string
  showLegend: boolean
  bars: BarConfig[]
}

// Colors from Tailwind
const COLORS = {
  emerald700: '#047857', // Vapor
  amber500: '#f59e0b', // Cavaco
  green500: '#22c55e', // Matéria-Prima
  blue500: '#3b82f6', // Produção
}

export function SteamCharts() {
  const {
    steamRecords,
    production,
    rawMaterials,
    dateRange,
    deleteSteamRecordsRange,
  } = useData()
  const [expandedChartId, setExpandedChartId] = useState<string | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const { toast } = useToast()

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

    const getEntry = (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd')
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: date,
          dateStr: dateKey,
          displayDate: format(date, 'dd/MM', { locale: ptBR }),
          steamConsumption: 0,
          woodChips: 0,
          mpUsed: 0,
          totalProduction: 0,
        })
      }
      return dataMap.get(dateKey)!
    }

    // Helper to normalize quantity to kg
    const normalizeToKg = (quantity: number, unit?: string) => {
      const u = unit?.toLowerCase() || ''
      if (u.includes('bag')) return quantity * 1400
      if (u.includes('ton')) return quantity * 1000
      return quantity
    }

    // Process Steam Records
    steamRecords.forEach((record) => {
      if (
        dateRange.from &&
        (record.date < dateRange.from ||
          (dateRange.to && record.date > dateRange.to))
      ) {
        return
      }

      const entry = getEntry(record.date)
      entry.steamConsumption += record.steamConsumption || 0
      entry.woodChips += record.woodChips || 0
    })

    // Process Raw Materials (Correct Source for MP)
    rawMaterials.forEach((rm) => {
      // Exclude 'Sangue' as it is not part of the main steam efficiency metric usually
      if (rm.type === 'Sangue') return

      if (
        dateRange.from &&
        (rm.date < dateRange.from || (dateRange.to && rm.date > dateRange.to))
      ) {
        return
      }

      const entry = getEntry(rm.date)
      entry.mpUsed += normalizeToKg(rm.quantity, rm.unit)
    })

    // Process Production Records (Correct Source for Output)
    production.forEach((prod) => {
      if (
        dateRange.from &&
        (prod.date < dateRange.from ||
          (dateRange.to && prod.date > dateRange.to))
      ) {
        return
      }

      const entry = getEntry(prod.date)
      // Aggregate industrial production
      entry.totalProduction +=
        (prod.seboProduced || 0) +
        (prod.fcoProduced || 0) +
        (prod.farinhetaProduced || 0)
    })

    return Array.from(dataMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )
  }, [steamRecords, production, rawMaterials, dateRange])

  // Check if there are any steam records in the current range
  const hasSteamRecordsInRange = useMemo(() => {
    return steamRecords.some((r) => {
      if (dateRange.from && r.date < dateRange.from) return false
      if (dateRange.to && r.date > dateRange.to) return false
      return true
    })
  }, [steamRecords, dateRange])

  const handleDeleteConfirm = async () => {
    try {
      await deleteSteamRecordsRange(dateRange.from, dateRange.to)
      toast({
        title: 'Dados excluídos com sucesso',
        description: 'Os registros de vapor foram removidos.',
      })
    } catch (error) {
      console.error('Error deleting steam records:', error)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir os dados.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleteAlertOpen(false)
    }
  }

  const chartConfig: ChartConfig = {
    steamConsumption: {
      label: 'Vapor (t)',
      color: COLORS.emerald700,
    },
    woodChips: {
      label: 'Cavaco (m³)',
      color: COLORS.amber500,
    },
    mpUsed: {
      label: 'Matéria-Prima (kg)',
      color: COLORS.green500,
    },
    totalProduction: {
      label: 'Produção (kg)',
      color: COLORS.blue500,
    },
  }

  const charts: ChartDefinition[] = [
    {
      id: 'steam',
      title: 'Consumo de Vapor',
      description: 'Total diário (t)',
      showLegend: false,
      bars: [{ dataKey: 'steamConsumption', fill: COLORS.emerald700 }],
    },
    {
      id: 'cavacoVsVapor',
      title: 'Cavacos vs. Toneladas Vapor',
      description: 'Comparativo Diário',
      showLegend: true,
      bars: [
        { dataKey: 'woodChips', fill: COLORS.amber500 },
        { dataKey: 'steamConsumption', fill: COLORS.emerald700 },
      ],
    },
    {
      id: 'mpVsCavaco',
      title: 'MPs vs. m³ Cavaco',
      description: 'Relação MP e Combustível',
      showLegend: true,
      bars: [
        { dataKey: 'mpUsed', fill: COLORS.green500 },
        { dataKey: 'woodChips', fill: COLORS.amber500 },
      ],
    },
    {
      id: 'mpVsVapor',
      title: 'MPs vs. Vapor',
      description: 'Relação MP e Consumo de Vapor',
      showLegend: true,
      bars: [
        { dataKey: 'mpUsed', fill: COLORS.green500 },
        { dataKey: 'steamConsumption', fill: COLORS.emerald700 },
      ],
    },
    {
      id: 'vaporVsMp',
      title: 'Vapor vs MPs',
      description: 'Eficiência Vapor/Matéria-Prima',
      showLegend: true,
      bars: [
        { dataKey: 'steamConsumption', fill: COLORS.emerald700 },
        { dataKey: 'mpUsed', fill: COLORS.green500 },
      ],
    },
    {
      id: 'tonsVsMp',
      title: 'Tons vs. MPs',
      description: 'Produção Total vs Matéria-Prima',
      showLegend: true,
      bars: [
        {
          dataKey: 'totalProduction',
          name: 'Tons (Produção)',
          fill: COLORS.blue500,
        },
        { dataKey: 'mpUsed', name: 'MPs (Entrada)', fill: COLORS.green500 },
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
            onDelete={() => setIsDeleteAlertOpen(true)}
            disableDelete={!hasSteamRecordsInRange}
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir os registros de controle de vapor para a
              fábrica e o período selecionados? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
