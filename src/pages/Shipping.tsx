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
  Send,
  Search,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
import { ShippingForm } from '@/components/ShippingForm'
import { ShippingEntry } from '@/lib/types'
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

export default function Shipping() {
  const { shipping, deleteShipping, dateRange } = useData()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<ShippingEntry | undefined>(
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

  const handleEdit = (item: ShippingEntry) => {
    setEditingItem(item)
    setIsOpen(true)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteShipping(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A expedição foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setEditingItem(undefined)
  }

  const filteredShipping = shipping
    .filter((item) => {
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return (
        item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.docRef.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Expedição</h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => setEditingItem(undefined)}
              size={isMobile ? 'sm' : 'default'}
            >
              <Send className="h-4 w-4" />{' '}
              {isMobile ? 'Nova' : 'Nova Expedição'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Saída' : 'Registrar Saída'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Atualize os dados da carga e valores.'
                  : 'Informe os dados da carga e valores para faturamento.'}
              </DialogDescription>
            </DialogHeader>
            <ShippingForm
              initialData={editingItem}
              onSuccess={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="hidden sm:block">
              Histórico de Expedição e Faturamento
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou NF..."
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
              {filteredShipping.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado.
                </div>
              ) : (
                filteredShipping.map((entry) => {
                  const isLocked = isRecordLocked(entry.date)
                  return (
                    <Card key={entry.id} className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1 max-w-[70%]">
                            <span className="font-semibold text-lg line-clamp-1">
                              {entry.client}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(entry.date, 'dd/MM/yyyy')}</span>
                              {isLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground/50" />
                              )}
                              <span className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                                {entry.docRef}
                              </span>
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

                        <div className="flex items-center justify-between py-2 border-t border-b border-border/50 mb-3 bg-secondary/20 rounded px-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Produto
                            </span>
                            <span className="font-medium">{entry.product}</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs text-muted-foreground">
                              Quantidade
                            </span>
                            <span className="font-mono font-bold">
                              {entry.quantity.toLocaleString('pt-BR')} kg
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm text-muted-foreground">
                            Total
                          </span>
                          <span className="font-bold text-lg text-green-600">
                            {formatCurrency(entry.quantity * entry.unitPrice)}
                          </span>
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Qtd (kg)</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Total (R$)</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipping.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum registro encontrado no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipping.map((entry) => {
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
                        <TableCell>{entry.client}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-900 hover:bg-slate-100/80">
                            {entry.product}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.docRef}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.quantity.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(entry.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-green-600">
                          {formatCurrency(entry.quantity * entry.unitPrice)}
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
              Tem certeza que deseja remover esta expedição?
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
