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
import { Plus, Search, FlaskConical, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AcidityChart } from '@/components/dashboard/AcidityChart'
import { AcidityForm } from '@/components/dashboard/AcidityForm'
import { AcidityEntry } from '@/lib/types'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

export default function DailyAcidity() {
  const {
    acidityRecords,
    addAcidityRecord,
    updateAcidityRecord,
    deleteAcidityRecord,
    dateRange,
    isDeveloperMode,
    isViewerMode,
  } = useData()
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AcidityEntry | undefined>(
    undefined,
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

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

  function handleDelete() {
    if (deleteId) {
      deleteAcidityRecord(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A medição foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const filteredRecords = acidityRecords
    .filter((item) => {
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
        {!isViewerMode && (
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
        )}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Tanque</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right">Volume (L)</TableHead>
                <TableHead>Horários Real.</TableHead>
                <TableHead>Observações</TableHead>
                {!isViewerMode && (
                  <TableHead className="w-[80px]">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={!isViewerMode ? 9 : 8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium">
                      {format(entry.date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">
                        {entry.tank}
                      </span>
                    </TableCell>
                    <TableCell>{entry.responsible}</TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.weight.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.volume.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.performedTimes}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {entry.notes || '-'}
                    </TableCell>
                    {!isViewerMode && (
                      <TableCell className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(entry)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isDeveloperMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este registro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
