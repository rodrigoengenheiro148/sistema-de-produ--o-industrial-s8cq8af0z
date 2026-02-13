import { useState } from 'react'
import {
  Gauge,
  Plus,
  Table as TableIcon,
  ChartBar,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { SteamControlForm } from '@/components/steam/SteamControlForm'
import { SteamControlTable } from '@/components/steam/SteamControlTable'
import { SteamControlCharts } from '@/components/steam/SteamControlCharts'
import { CookingMetricsCard } from '@/components/steam/CookingMetricsCard'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function SteamControl() {
  const [isOpen, setIsOpen] = useState(false)
  const { checkPcpAuth } = usePcp()
  const [isPcpGateOpen, setIsPcpGateOpen] = useState(false)
  const [pcpPendingAction, setPcpPendingAction] = useState<(() => void) | null>(
    null,
  )
  const [date, setDate] = useState<Date>(new Date())

  const handleNewRecord = () => {
    checkPcpAuth(
      () => {
        setIsOpen(true)
      },
      () => {
        setPcpPendingAction(() => () => {
          setIsOpen(true)
        })
        setIsPcpGateOpen(true)
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-8 w-8 text-primary" />
            Controle de Vapor
          </h2>
          <p className="text-muted-foreground">
            Monitoramento de consumo de combustível, geração de vapor e relação
            com MP processada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal w-[240px]',
                  !date && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button className="gap-2" onClick={handleNewRecord}>
            <Plus className="h-4 w-4" /> Novo Registro
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Registrar Controle de Vapor</DialogTitle>
              <DialogDescription>
                Insira os dados de consumo de combustível e leituras do medidor.
              </DialogDescription>
            </DialogHeader>
            <SteamControlForm
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CookingMetricsCard date={date} />
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="records" className="gap-2">
            <TableIcon className="h-4 w-4" /> Registros
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <ChartBar className="h-4 w-4" /> Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <SteamControlTable />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <SteamControlCharts />
        </TabsContent>
      </Tabs>

      <PcpGate
        isOpen={isPcpGateOpen}
        onOpenChange={setIsPcpGateOpen}
        onSuccess={() => {
          if (pcpPendingAction) pcpPendingAction()
          setPcpPendingAction(null)
        }}
      />
    </div>
  )
}
