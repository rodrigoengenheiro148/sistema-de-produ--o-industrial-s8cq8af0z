import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, FlaskConical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AcidityChart } from '@/components/dashboard/AcidityChart'
import { AcidityForm } from '@/components/dashboard/AcidityForm'
import { AcidityTable } from '@/components/dashboard/AcidityTable'
import { AcidityEntry } from '@/lib/types'

export default function DailyAcidity() {
  const { acidityRecords, addAcidityRecord, updateAcidityRecord, dateRange } =
    useData()
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AcidityEntry | undefined>(
    undefined,
  )
  const [searchTerm, setSearchTerm] = useState('')

  function handleCreate(data: Omit<AcidityEntry, 'id'>) {
    addAcidityRecord(data)
    toast({
      title: 'Sucesso',
      description: 'Registro de acidez salvo com sucesso!',
    })
    setIsCreateOpen(false)
  }

  function handleUpdate(data: Omit<AcidityEntry, 'id'>) {
    if (editingRecord) {
      updateAcidityRecord({ ...data, id: editingRecord.id })
      toast({
        title: 'Sucesso',
        description: 'Registro atualizado com sucesso!',
      })
      setIsEditOpen(false)
      setEditingRecord(undefined)
    }
  }

  function handleEditClick(entry: AcidityEntry) {
    setEditingRecord(entry)
    setIsEditOpen(true)
  }

  const filteredRecords = acidityRecords
    .filter((item) => {
      // Apply global date filter if exists, else show all
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return (
        item.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tank.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          Acidez Diária
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Medição de Acidez</DialogTitle>
              <DialogDescription>
                Preencha os dados da análise de acidez do tanque.
              </DialogDescription>
            </DialogHeader>
            <AcidityForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <AcidityChart data={filteredRecords} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Medições</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar responsável ou tanque..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AcidityTable data={filteredRecords} onEdit={handleEditClick} />
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Atualize as informações do registro selecionado.
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <AcidityForm
              initialData={editingRecord}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
