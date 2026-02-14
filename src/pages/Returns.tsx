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
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Undo2,
  AlertOctagon,
  Lock,
} from 'lucide-react'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { ReturnEntry } from '@/lib/types'
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
import { ReturnForm } from '@/components/ReturnForm'
import { canEditRecord } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function Returns() {
  const { returns, deleteReturn, dateRange } = useData()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<ReturnEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Security Gate State
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)
  const [securityAction, setSecurityAction] = useState<{
    type: 'edit' | 'delete'
    item: ReturnEntry
  } | null>(null)

  const handleNewRecord = () => {
    setEditingItem(undefined)
    setIsOpen(true)
  }

  const handleEditClick = (item: ReturnEntry) => {
    if (canEditRecord(item.createdAt)) {
      setEditingItem(item)
      setIsOpen(true)
    } else {
      setSecurityAction({ type: 'edit', item })
      setIsSecurityOpen(true)
    }
  }

  const handleDeleteClick = (item: ReturnEntry) => {
    if (canEditRecord(item.createdAt)) {
      setDeleteId(item.id)
    } else {
      setSecurityAction({ type: 'delete', item })
      setIsSecurityOpen(true)
    }
  }

  const handleSecuritySuccess = () => {
    setIsSecurityOpen(false)
    if (securityAction) {
      if (securityAction.type === 'edit') {
        setEditingItem(securityAction.item)
        setIsOpen(true)
      } else if (securityAction.type === 'delete') {
        setDeleteId(securityAction.item.id)
      }
      setSecurityAction(null)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteReturn(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A devolução foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const filteredReturns = returns
    .filter((item) => {
      // Date Filter
      if (dateRange.from) {
        const start = startOfDay(dateRange.from)
        const end = dateRange.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from)
        if (!isWithinInterval(item.date, { start, end })) return false
      }

      // Search Filter
      return (
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const totalQuantity = filteredReturns.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  )
  const totalValue = filteredReturns.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Undo2 className="h-6 w-6 text-red-600" />
            Devoluções
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento de produtos devolvidos e perdas.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={handleNewRecord}
          size={isMobile ? 'default' : 'default'}
        >
          <Plus className="h-4 w-4" /> Nova Devolução
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Devolução' : 'Registrar Devolução'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Atualize os detalhes do registro selecionado.'
                  : 'Insira os detalhes da devolução de produto.'}
              </DialogDescription>
            </DialogHeader>
            <ReturnForm
              initialData={editingItem}
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Total Quantidade Devolvida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(totalQuantity)} kg
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Valor Total de Devoluções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Histórico de Devoluções</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? 'p-4 pt-0' : 'p-6 pt-0'}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Quantidade (kg)</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhuma devolução registrada no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((entry) => {
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
                      <TableCell>{entry.supplier}</TableCell>
                      <TableCell className="text-right font-mono text-red-600 font-medium">
                        -{formatNumber(entry.quantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        -{formatCurrency(entry.value)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {entry.description}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={
                            isEditable
                              ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-muted-foreground'
                          }
                          onClick={() => handleEditClick(entry)}
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
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta devolução? Esta ação não pode
              ser desfeita.
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
