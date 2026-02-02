import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Download, Loader2, FileSpreadsheet } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useToast } from '@/hooks/use-toast'
import { exportProcessReport } from '@/services/process-export'

export function ProcessExportMenu() {
  const [loading, setLoading] = useState(false)
  const { currentFactoryId } = useData()
  const { toast } = useToast()

  const handleExport = async (reportType: string) => {
    if (!currentFactoryId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Fábrica não selecionada.',
      })
      return
    }

    setLoading(true)
    try {
      await exportProcessReport(reportType, currentFactoryId)
      toast({
        title: 'Exportação Concluída',
        description: 'O download do arquivo CSV foi iniciado.',
      })
    } catch (error: any) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro na Exportação',
        description: error.message || 'Falha ao gerar relatório.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar Dados
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Selecione o Relatório</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('yield_performance')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Performance de Rendimentos</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('yield_history')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Histórico de Rendimentos</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('daily_acidity')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Acidez Diária</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('measurement_evolution')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Evolução das Medições</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('sebo_stock_evolution')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Evolução Estoque de Sebo</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('hourly_production')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Produção por Hora</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('process_status')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Estado de Processo</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('steam_control')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Gráficos Controle de Vapor</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
