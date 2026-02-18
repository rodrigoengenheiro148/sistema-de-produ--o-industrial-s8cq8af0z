import { useState, useEffect } from 'react'
import { useData } from '@/context/DataContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { deleteSeboInventoryRecord } from '@/services/seboInventory'
import { useToast } from '@/hooks/use-toast'
import { formatNumber } from '@/lib/utils'
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

interface ManualEntryHistoryProps {
  refreshTrigger: number
}

export function ManualEntryHistory({
  refreshTrigger,
}: ManualEntryHistoryProps) {
  const { latestInventory, refreshOperationalData } = useData()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Force refresh if trigger changes
  useEffect(() => {
    refreshOperationalData()
  }, [refreshTrigger, refreshOperationalData])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSeboInventoryRecord(deleteId)
      toast({
        title: 'Registro Excluído',
        description: 'O apontamento foi removido com sucesso.',
      })
      refreshOperationalData()
    } catch (error) {
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível remover o registro.',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Apontamentos</CardTitle>
        <CardDescription>Últimos registros manuais realizados.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Unidade</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestInventory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                latestInventory.map((record) => {
                  const qty =
                    record.quantityLt > 0
                      ? record.quantityLt
                      : record.quantityKg
                  const unit = record.quantityLt > 0 ? 'Litros' : 'kg'

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(record.date, 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{record.category}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(qty)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {unit}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => record.id && setDeleteId(record.id)}
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
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Apontamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de estoque? Esta ação
              não pode ser desfeita.
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
    </Card>
  )
}
