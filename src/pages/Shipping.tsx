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
import { Send, Search, Pencil, Trash2 } from 'lucide-react'
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

export default function Shipping() {
  const { shipping, deleteShipping, dateRange, isDeveloperMode } = useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<ShippingEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
            <Button className="gap-2" onClick={() => setEditingItem(undefined)}>
              <Send className="h-4 w-4" /> Nova Expedição
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
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
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Expedição e Faturamento</CardTitle>
            <div className="relative w-64">
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
        <CardContent>
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
                {isDeveloperMode && (
                  <TableHead className="w-[80px]">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipping.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isDeveloperMode ? 8 : 7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipping.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium">
                      {format(entry.date, 'dd/MM/yyyy')}
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
                    {isDeveloperMode && (
                      <TableCell className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
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
    </div>
  )
}
