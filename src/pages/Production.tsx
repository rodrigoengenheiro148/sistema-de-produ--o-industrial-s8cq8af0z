import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  CalendarIcon,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
import { ProductionForm } from '@/components/ProductionForm'
import { ProductionEntry } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
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
import { isRecordLocked } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'

export default function Production() {
  const { production, deleteProduction, dateRange } = useData()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductionEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Security Gate State
  const [securityOpen, setSecurityOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const handleProtectedAction = (
    date: Date | undefined,
    action: () => void,
  ) => {
    if (isRecordLocked(date)) {
      setPendingAction(() => action)
      setSecurityOpen(true)
    } else {
      action()
    }
  }

  const handleSecuritySuccess = () => {
    setSecurityOpen(false)
    if (pendingAction) pendingAction()
    setPendingAction(null)
  }

  const handleEdit = (item: ProductionEntry) => {
    setEditingItem(item)
    setIsOpen(true)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteProduction(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A produção foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setEditingItem(undefined)
  }

  const filteredProduction = production
    .filter((item) => {
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return true
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Produção Diária</h2>
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => setEditingItem(undefined)}
              size={isMobile ? 'sm' : 'default'}
            >
              <Plus className="h-4 w-4" /> {isMobile ? 'Novo' : 'Novo Registro'}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-md w-full">
            <SheetHeader>
              <SheetTitle>
                {editingItem ? 'Editar Produção' : 'Registrar Produção'}
              </SheetTitle>
              <SheetDescription>
                {editingItem
                  ? 'Atualize os dados de processamento.'
                  : 'Informe os dados de processamento do turno. O cálculo de perdas será automático.'}
              </SheetDescription>
            </SheetHeader>
            <ProductionForm
              initialData={editingItem}
              onSuccess={() => setIsOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diário de Produção</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
          {isMobile ? (
            <div className="space-y-4">
              {filteredProduction.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </div>
              ) : (
                filteredProduction.map((entry) => {
                  const isLocked = isRecordLocked(entry.date)
                  return (
                    <Card key={entry.id} className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <span className="font-semibold text-lg text-primary flex items-center gap-2">
                              {format(entry.date, 'dd/MM/yyyy')}
                              {isLocked && (
                                <Lock className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </span>
                            <div className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded w-fit">
                              Turno: {entry.shift}
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
                                onClick={() =>
                                  handleProtectedAction(entry.date, () =>
                                    handleEdit(entry),
                                  )
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProtectedAction(entry.date, () =>
                                    setDeleteId(entry.id),
                                  )
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                            <span className="text-xs text-muted-foreground block">
                              MP Proc.
                            </span>
                            <span className="font-mono font-bold">
                              {entry.mpUsed.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                            <span className="text-xs text-red-500 block">
                              Perdas
                            </span>
                            <span className="font-mono font-bold text-red-600">
                              {entry.losses.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sebo:</span>
                            <span className="font-mono">
                              {entry.seboProduced.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">FCO:</span>
                            <span className="font-mono">
                              {entry.fcoProduced.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Farinheta:
                            </span>
                            <span className="font-mono">
                              {entry.farinhetaProduced.toLocaleString('pt-BR')}{' '}
                              kg
                            </span>
                          </div>
                        </div>
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
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-right">MP Proc. (kg)</TableHead>
                  <TableHead className="text-right">Sebo (kg)</TableHead>
                  <TableHead className="text-right">FCO (kg)</TableHead>
                  <TableHead className="text-right">Farinheta (kg)</TableHead>
                  <TableHead className="text-right text-red-500">
                    Perdas (kg)
                  </TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProduction.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum registro encontrado no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProduction.map((entry) => {
                    const isLocked = isRecordLocked(entry.date)
                    return (
                      <TableRow
                        key={entry.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {format(entry.date, 'dd/MM/yyyy')}
                            {isLocked && (
                              <Lock className="h-3 w-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{entry.shift}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.mpUsed.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {entry.seboProduced.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {entry.fcoProduced.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {entry.farinhetaProduced.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-500 font-medium">
                          {entry.losses.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() =>
                              handleProtectedAction(entry.date, () =>
                                handleEdit(entry),
                              )
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() =>
                              handleProtectedAction(entry.date, () =>
                                setDeleteId(entry.id),
                              )
                            }
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este registro de produção?
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
        isOpen={securityOpen}
        onOpenChange={setSecurityOpen}
        onSuccess={handleSecuritySuccess}
      />
    </div>
  )
}
