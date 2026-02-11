import { useState } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Droplet,
  Plus,
  Pencil,
  Trash2,
  CalendarIcon,
  Factory,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { BloodProductionForm } from '@/components/BloodProductionForm'
import { ProductionEntry } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { SecurityGate } from '@/components/SecurityGate'
import { canEditRecord } from '@/lib/security'

export default function BloodProduction() {
  const { production, deleteProduction, factories } = useData()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductionEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Security Gate
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)
  const [securityAction, setSecurityAction] = useState<{
    type: 'edit' | 'delete'
    item: ProductionEntry
  } | null>(null)

  const handleEditClick = (item: ProductionEntry) => {
    if (canEditRecord(item.createdAt)) {
      setEditingItem(item)
      setIsOpen(true)
    } else {
      setSecurityAction({ type: 'edit', item })
      setIsSecurityOpen(true)
    }
  }

  const handleDeleteClick = (item: ProductionEntry) => {
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

  // Filter only blood meal entries (> 0)
  const filteredRecords = production
    .filter(
      (item) =>
        item.bloodMealProduced > 0 ||
        (item.bloodMealBags && item.bloodMealBags > 0),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const getFactoryName = (id?: string) => {
    if (!id) return '-'
    const factory = factories.find((f) => f.id === id)
    return factory ? factory.name : 'Desconhecida'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Droplet className="h-6 w-6 text-red-600" />
            Produção de Sangue
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento de produção de farinha de sangue.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={() => setEditingItem(undefined)}
            >
              <Plus className="h-4 w-4" /> Nova Produção
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Produção' : 'Registrar Produção'}
              </DialogTitle>
              <DialogDescription>
                Informe os dados de processamento de sangue.
              </DialogDescription>
            </DialogHeader>
            <BloodProductionForm
              initialData={editingItem}
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Histórico de Produção</CardTitle>
          </div>
          <CardDescription>
            Registros recentes de farinha de sangue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="text-right">MP Utilizada (kg)</TableHead>
                <TableHead className="text-right">Produção (kg)</TableHead>
                <TableHead className="text-right">Sacos</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-white bg-white/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        {format(entry.date, 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{entry.shift}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {entry.mpUsed.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {entry.bloodMealProduced.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {entry.bloodMealBags || '0'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEditClick(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
              Tem certeza que deseja remover este registro? Esta ação não pode
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
      />
    </div>
  )
}
