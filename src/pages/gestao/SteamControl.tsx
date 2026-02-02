import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Flame, Info } from 'lucide-react'
import { SteamControlForm } from '@/components/steam/SteamControlForm'
import { SteamControlTable } from '@/components/steam/SteamControlTable'
import { SteamCharts } from '@/components/steam/SteamCharts'
import { useIsMobile } from '@/hooks/use-mobile'

export default function SteamControl() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const isMobile = useIsMobile()

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

      <SteamCharts />
      <SteamControlTable />
    </div>
  )
}
