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
import { Plus, Search, Trash2, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { RawMaterialForm } from '@/components/RawMaterialForm'
import { RawMaterialEntry } from '@/lib/types'
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

export default function RawMaterial() {
  const { rawMaterials, deleteRawMaterial, dateRange, isDeveloperMode } =
    useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<RawMaterialEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (item: RawMaterialEntry) => {
    setEditingItem(item)
    setIsOpen(true)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteRawMaterial(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A entrada foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setEditingItem(undefined)
  }

  const filteredMaterials = rawMaterials
    .filter((item) => {
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return (
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Entrada de Matéria-Prima
        </h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingItem(undefined)}>
              <Plus className="h-4 w-4" /> Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Entrada' : 'Registrar Entrada'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Atualize os detalhes do registro selecionado.'
                  : 'Insira os detalhes do recebimento de matéria-prima.'}
              </DialogDescription>
            </DialogHeader>
            <RawMaterialForm
              initialData={editingItem}
              onSuccess={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Entradas</CardTitle>
            <div className="relative w-64">
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade (kg)</TableHead>
                <TableHead>Observações</TableHead>
                {isDeveloperMode && (
                  <TableHead className="w-[80px]">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isDeveloperMode ? 6 : 5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium">
                      {format(entry.date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{entry.supplier}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
                        {entry.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.quantity.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {entry.notes || '-'}
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
              Tem certeza que deseja remover esta entrada? Esta ação não pode
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
    </div>
  )
}
