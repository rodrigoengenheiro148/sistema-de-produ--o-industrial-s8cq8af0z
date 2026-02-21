import { useState } from 'react'
import { Flame, Plus, Table as TableIcon, ChartBar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BoilerControlForm } from '@/components/boiler/BoilerControlForm'
import { BoilerControlTable } from '@/components/boiler/BoilerControlTable'
import { BoilerControlCharts } from '@/components/boiler/BoilerControlCharts'
import { usePcp } from '@/context/PcpContext'
import { PcpGate } from '@/components/PcpGate'

export default function BoilerControl() {
  const [isOpen, setIsOpen] = useState(false)
  const { checkPcpAuth } = usePcp()
  const [isPcpGateOpen, setIsPcpGateOpen] = useState(false)
  const [pcpPendingAction, setPcpPendingAction] = useState<(() => void) | null>(
    null,
  )

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
            <Flame className="h-8 w-8 text-primary" />
            Controle Caldeira
          </h2>
          <p className="text-muted-foreground">
            Resíduo Madeira Consumo x Entrada
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={handleNewRecord}>
            <Plus className="h-4 w-4" /> Novo Registro
          </Button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Controle Caldeira</DialogTitle>
              <DialogDescription>
                Insira os dados de consumo de lenha, entrada e estoque inicial.
              </DialogDescription>
            </DialogHeader>
            <BoilerControlForm
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
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
          <BoilerControlTable />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <BoilerControlCharts />
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
