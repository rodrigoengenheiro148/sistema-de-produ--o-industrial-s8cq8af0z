import { useState } from 'react'
import { Gauge, Plus, Table as TableIcon, ChartBar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SteamControlForm } from '@/components/steam/SteamControlForm'
import { SteamControlTable } from '@/components/steam/SteamControlTable'
import { SteamControlCharts } from '@/components/steam/SteamControlCharts'

export default function SteamControl() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-8 w-8 text-primary" />
            Controle de Vapor
          </h2>
          <p className="text-muted-foreground">
            Monitoramento de consumo de combustível e geração de vapor.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Registro
            </Button>
          </DialogTrigger>
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
    </div>
  )
}
