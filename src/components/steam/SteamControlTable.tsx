import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useData } from '@/context/DataContext'
import { SteamControlEntry } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SteamControlForm } from './SteamControlForm'
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
import { useToast } from '@/hooks/use-toast'
import { formatNumber } from '@/lib/utils'

export function SteamControlTable() {
  const { steamControlRecords, deleteSteamControlRecord } = useData()
  const { toast } = useToast()

  const [editingItem, setEditingItem] = useState<SteamControlEntry | undefined>(
    undefined,
  )
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const tableData = useMemo(() => {
    // We want to display records sorted by date descending
    const sortedRecords = [...steamControlRecords].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )

    return sortedRecords.map((record) => {
      const totalFuel =
        record.soyWaste + record.firewood + record.riceHusk + record.woodChips
      const consumoVap = record.meterEnd - record.meterStart

      // Ratios Calculation
      // CAVACO VS TONS VAPOR: CONSUMO VAP / TOTAL
      const cavacoVsVapor = totalFuel > 0 ? consumoVap / totalFuel : 0

      return {
        ...record,
        totalFuel,
        consumoVap,
        cavacoVsVapor,
      }
    })
  }, [steamControlRecords])

  const handleDelete = () => {
    if (deleteId) {
      deleteSteamControlRecord(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'O registro foi removido com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleEdit = (item: SteamControlEntry) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[100px]">Data</TableHead>
              <TableHead className="text-right min-w-[100px]">
                Res. Soja
              </TableHead>
              <TableHead className="text-right min-w-[80px]">Lenha</TableHead>
              <TableHead className="text-right min-w-[100px]">
                Palha Arroz
              </TableHead>
              <TableHead className="text-right min-w-[80px]">Cavaco</TableHead>
              <TableHead className="text-right min-w-[100px] font-bold">
                Total Comb.
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                Início PR
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                Término PR
              </TableHead>
              <TableHead className="text-right min-w-[100px] font-bold">
                Consumo Vap
              </TableHead>
              {/* Efficiency Ratios columns */}
              <TableHead className="text-right min-w-[100px] bg-blue-50/50 dark:bg-blue-950/20">
                Cavaco vs Vapor
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center h-24 text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(row.date, 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.soyWaste)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.firewood)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.riceHusk)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.woodChips)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(row.totalFuel)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(row.meterStart)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(row.meterEnd)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatNumber(row.consumoVap)}
                  </TableCell>

                  {/* Ratios Display */}
                  <TableCell className="text-right bg-blue-50/30 dark:bg-blue-950/10 font-mono text-xs">
                    {row.totalFuel > 0 ? formatNumber(row.cavacoVsVapor) : '-'}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(row.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Atualize os dados de controle de vapor.
            </DialogDescription>
          </DialogHeader>
          <SteamControlForm
            initialData={editingItem}
            onSuccess={() => setIsEditDialogOpen(false)}
            onCancel={() => setIsEditDialogOpen(false)}
          />
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
