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
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

export default function Production() {
  const {
    production,
    deleteProduction,
    dateRange,
    isDeveloperMode,
    isViewerMode,
  } = useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductionEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
        {!isViewerMode && (
          <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => setEditingItem(undefined)}
              >
                <Plus className="h-4 w-4" /> Novo Registro
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-md">
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diário de Produção</CardTitle>
        </CardHeader>
        <CardContent>
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
                {isDeveloperMode && !isViewerMode && (
                  <TableHead className="w-[80px]">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProduction.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isDeveloperMode && !isViewerMode ? 8 : 7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProduction.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium">
                      {format(entry.date, 'dd/MM/yyyy')}
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
                    {isDeveloperMode && !isViewerMode && (
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
    </div>
  )
}
