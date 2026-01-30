import { useState, useEffect } from 'react'
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
import {
  Plus,
  Search,
  FlaskConical,
  Pencil,
  Trash2,
  CalendarIcon,
  Clock,
  User,
  MoreVertical,
  Lock,
} from 'lucide-react'
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
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { canEditRecord } from '@/lib/security'
import { supabase } from '@/lib/supabase/client'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SecurityGate } from '@/components/SecurityGate'

export default function DailyAcidity() {
  const {
    acidityRecords,
    addAcidityRecord,
    updateAcidityRecord,
    deleteAcidityRecord,
    dateRange,
    refreshOperationalData,
    currentFactoryId,
  } = useData()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AcidityEntry | undefined>(
    undefined,
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Security Gate State
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)
  const [securityAction, setSecurityAction] = useState<{
    type: 'edit' | 'delete'
    item: AcidityEntry
  } | null>(null)

  // Realtime subscription for Acidity Records
  useEffect(() => {
    if (!currentFactoryId) return

    const channel = supabase
      .channel(`daily-acidity-${currentFactoryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acidity_records',
          filter: `factory_id=eq.${currentFactoryId}`,
        },
        () => {
          refreshOperationalData()
        },
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error (Acidity):', err)
          toast({
            title: 'Erro de Conexão',
            description:
              'Falha ao conectar com o servidor de tempo real. Atualize a página.',
            variant: 'destructive',
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentFactoryId, refreshOperationalData, toast])

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
    if (canEditRecord(entry.createdAt)) {
      setEditingRecord(entry)
      setIsEditOpen(true)
    } else {
      setSecurityAction({ type: 'edit', item: entry })
      setIsSecurityOpen(true)
    }
  }

  function handleDeleteClick(entry: AcidityEntry) {
    if (canEditRecord(entry.createdAt)) {
      setDeleteId(entry.id)
    } else {
      setSecurityAction({ type: 'delete', item: entry })
      setIsSecurityOpen(true)
    }
  }

  const handleSecuritySuccess = () => {
    setIsSecurityOpen(false)
    if (securityAction) {
      if (securityAction.type === 'edit') {
        setEditingRecord(securityAction.item)
        setIsEditOpen(true)
      } else if (securityAction.type === 'delete') {
        setDeleteId(securityAction.item.id)
      }
      setSecurityAction(null)
    }
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" size={isMobile ? 'sm' : 'default'}>
              <Plus className="h-4 w-4" />{' '}
              <span className="hidden sm:inline">Novo Registro</span>
              <span className="sm:hidden">Novo</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Histórico de Medições</CardTitle>
            <div className="relative w-full sm:w-64">
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
        <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
          {isMobile ? (
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado no período.
                </div>
              ) : (
                filteredRecords.map((entry) => {
                  const isEditable = canEditRecord(entry.createdAt)
                  return (
                    <Card key={entry.id} className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-primary">
                                {entry.tank}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {entry.performedTimes}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {format(entry.date, 'dd/MM/yyyy')}
                              {!isEditable && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Lock className="h-3 w-3 text-muted-foreground/50" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edição requer senha</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Clock className="h-3 w-3 ml-1" />
                              {entry.time}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditClick(entry)}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(entry)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 border-t border-b mb-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Peso
                            </p>
                            <p className="font-semibold text-base sm:text-lg">
                              {entry.weight.toLocaleString('pt-BR')} kg
                            </p>
                          </div>
                          <div className="text-center border-l">
                            <p className="text-xs text-muted-foreground">
                              Volume
                            </p>
                            <p className="font-semibold text-base sm:text-lg">
                              {entry.volume.toLocaleString('pt-BR')} L
                            </p>
                          </div>
                          <div className="text-center border-l">
                            <p className="text-xs text-muted-foreground">
                              Acidez
                            </p>
                            <p className="font-semibold text-base sm:text-lg">
                              {entry.acidity !== undefined
                                ? entry.acidity.toLocaleString('pt-BR')
                                : '-'}
                              %
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-3.5 w-3.5" />
                          {entry.responsible}
                        </div>

                        {entry.notes && (
                          <p className="text-xs text-muted-foreground italic mt-2 bg-secondary/50 p-2 rounded">
                            "{entry.notes}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tanque</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Peso (kg)</TableHead>
                  <TableHead className="text-right">Volume (L)</TableHead>
                  <TableHead className="text-right">Acidez</TableHead>
                  <TableHead>Horários Real.</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum registro encontrado no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((entry) => {
                    const isEditable = canEditRecord(entry.createdAt)
                    return (
                      <TableRow
                        key={entry.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {format(entry.date, 'dd/MM/yyyy')}
                            {!isEditable && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lock className="h-3 w-3 text-muted-foreground/50" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edição requer senha</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
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
                        <TableCell className="text-right font-mono">
                          {entry.acidity !== undefined
                            ? entry.acidity.toLocaleString('pt-BR')
                            : '-'}
                          %
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.performedTimes}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {entry.notes || '-'}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(entry)}
                            title={
                              isEditable ? 'Editar' : 'Edição requer senha'
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={
                              isEditable
                                ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-muted-foreground'
                            }
                            onClick={() => handleDeleteClick(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
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

      <SecurityGate
        isOpen={isSecurityOpen}
        onOpenChange={setIsSecurityOpen}
        onSuccess={handleSecuritySuccess}
        title="Proteção de Registro"
        description="Esta ação requer senha de supervisor para registros com mais de 5 minutos."
      />
    </div>
  )
}
