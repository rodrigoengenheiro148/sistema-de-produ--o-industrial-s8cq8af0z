import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Flame, Info, Trash2 } from 'lucide-react'
import { SteamControlForm } from '@/components/steam/SteamControlForm'
import { SteamControlTable } from '@/components/steam/SteamControlTable'
import { SteamCharts } from '@/components/steam/SteamCharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { useData } from '@/context/DataContext'
import { SecurityGate } from '@/components/SecurityGate'
import { useToast } from '@/hooks/use-toast'

export default function SteamControl() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isClearDataOpen, setIsClearDataOpen] = useState(false)
  const isMobile = useIsMobile()
  const { clearSteamRecords } = useData()
  const { toast } = useToast()

  const handleClearDataSuccess = async () => {
    setIsClearDataOpen(false)
    try {
      await clearSteamRecords()
      toast({
        title: 'Dados limpos',
        description: 'Todos os registros de vapor foram excluídos com sucesso.',
      })
    } catch (error) {
      console.error('Error clearing steam records:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao limpar dados.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            Controle de Vapor
          </h2>
          <p className="text-muted-foreground">
            Monitoramento de eficiência de caldeira e consumo de biomassa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="O 'Entrada MP' é calculado automaticamente baseado na soma das matérias-primas do dia."
          >
            <Info className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            size={isMobile ? 'sm' : 'default'}
            onClick={() => setIsClearDataOpen(true)}
            title="Limpar todos os dados"
          >
            <Trash2 className="h-4 w-4" />
            {isMobile ? '' : 'Limpar Dados'}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size={isMobile ? 'sm' : 'default'}>
                <Plus className="h-4 w-4" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Novo Registro de Vapor</DialogTitle>
              </DialogHeader>
              <SteamControlForm
                onSuccess={() => setIsDialogOpen(false)}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Card removed as requested */}

      <SteamCharts />
      <SteamControlTable />

      <SecurityGate
        isOpen={isClearDataOpen}
        onOpenChange={setIsClearDataOpen}
        onSuccess={handleClearDataSuccess}
        title="Limpar Dados de Vapor"
        description="Esta ação excluirá TODOS os registros de vapor desta fábrica. Digite a senha para confirmar."
      />
    </div>
  )
}
