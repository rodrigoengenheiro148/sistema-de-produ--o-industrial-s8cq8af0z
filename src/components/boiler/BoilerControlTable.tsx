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
import { format, getMonth, getYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useData } from '@/context/DataContext'
import { BoilerControlRecord } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BoilerControlForm } from './BoilerControlForm'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function BoilerControlTable() {
  const { boilerControlRecords, deleteBoilerControlRecord } = useData()
  const { toast } = useToast()

  const [editingItem, setEditingItem] = useState<
    BoilerControlRecord | undefined
  >(undefined)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(currentDate),
  )
  const [selectedYear, setSelectedYear] = useState<number>(getYear(currentDate))

  const handleDelete = () => {
    if (deleteId) {
      deleteBoilerControlRecord(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'O registro foi removido com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleEdit = (item: BoilerControlRecord) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const tableData = useMemo(() => {
    const sortedRecords = [...boilerControlRecords]
      .filter((r) => {
        return (
          getMonth(r.date) === selectedMonth && getYear(r.date) === selectedYear
        )
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Running calculations for stock
    let runningPct = 0
    let runningM3 = 0

    return sortedRecords.map((record, index) => {
      // If it's the first record of the month, or if the user explicitly set an initial stock, use it.
      // Otherwise, carry over from the previous day's calculation
      const startPct =
        index === 0 || record.initialStockPct > 0
          ? record.initialStockPct
          : runningPct
      const startM3 =
        index === 0 || record.initialStockM3 > 0
          ? record.initialStockM3
          : runningM3

      const currentStockPct =
        startPct + record.woodEntryPct - (record.cald01Pct + record.cald02Pct)
      const currentStockM3 =
        startM3 + record.woodEntryM3 - (record.cald01M3 + record.cald02M3)
      const consumoDiarioM3 = record.cald01M3 + record.cald02M3

      // Update running totals for next iteration
      runningPct = currentStockPct
      runningM3 = currentStockM3

      return {
        ...record,
        day: format(record.date, 'd'),
        monthName: format(record.date, 'MMMM', { locale: ptBR }).toUpperCase(),
        startPct,
        startM3,
        currentStockPct,
        currentStockM3,
        consumoDiarioM3,
      }
    })
  }, [boilerControlRecords, selectedMonth, selectedYear])

  const initialMonthStock = tableData.length > 0 ? tableData[0].startPct : 0
  const initialMonthStockM3 = tableData.length > 0 ? tableData[0].startM3 : 0

  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i)

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 mb-4">
        <Select
          value={selectedMonth.toString()}
          onValueChange={(val) => setSelectedMonth(Number(val))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, idx) => (
              <SelectItem key={idx} value={idx.toString()}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            {/* Header Row 1 */}
            <TableRow className="bg-primary/5 hover:bg-primary/5">
              <TableHead
                colSpan={8}
                className="text-center font-bold text-lg border-r border-b text-primary"
              >
                RESÍDUO MADEIRA CONSUMO X ENTRADA
              </TableHead>
              <TableHead colSpan={3} className="text-center border-b">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                  ESTOQUE INICIAL PCT/M³
                </div>
                <div className="grid grid-cols-2 gap-2 text-primary font-bold">
                  <div>{formatNumber(initialMonthStock)}</div>
                  <div>{formatNumber(initialMonthStockM3)}</div>
                </div>
              </TableHead>
              <TableHead className="w-[50px] border-b"></TableHead>
            </TableRow>
            {/* Header Row 2 */}
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead colSpan={2} className="text-center font-bold border-r">
                DATA
              </TableHead>
              <TableHead colSpan={2} className="text-center font-bold border-r">
                CALDEIRA PCT
              </TableHead>
              <TableHead colSpan={2} className="text-center font-bold border-r">
                CALDEIRA M³
              </TableHead>
              <TableHead colSpan={2} className="text-center font-bold border-r">
                ENTRADA DE LENHA
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-center font-bold align-bottom pb-4 border-r"
              >
                ESTOQUE PCT
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-center font-bold align-bottom pb-4 border-r"
              >
                ESTOQUE M³
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-center font-bold align-bottom pb-4"
              >
                Consumo Diario M³ CALDEIRA
              </TableHead>
              <TableHead rowSpan={2} className="w-[50px]"></TableHead>
            </TableRow>
            {/* Header Row 3 */}
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-center font-semibold text-xs border-r">
                DATA
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                MÊS
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                Cald 01
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                Cald 02
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                Cald 01
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                Cald 02
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                PCT
              </TableHead>
              <TableHead className="text-center font-semibold text-xs border-r">
                M³
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center h-24 text-muted-foreground"
                >
                  Nenhum registro encontrado para este mês.
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="text-center font-medium border-r">
                    {row.day}
                  </TableCell>
                  <TableCell className="text-center text-xs font-medium border-r">
                    {row.monthName}
                  </TableCell>
                  <TableCell className="text-center border-r">
                    {row.cald01Pct > 0 ? formatNumber(row.cald01Pct) : ''}
                  </TableCell>
                  <TableCell className="text-center border-r">
                    {row.cald02Pct > 0 ? formatNumber(row.cald02Pct) : ''}
                  </TableCell>
                  <TableCell className="text-center border-r text-primary font-medium">
                    {row.cald01M3 > 0 ? formatNumber(row.cald01M3) : ''}
                  </TableCell>
                  <TableCell className="text-center border-r font-medium">
                    {row.cald02M3 > 0 ? formatNumber(row.cald02M3) : ''}
                  </TableCell>
                  <TableCell className="text-center border-r">
                    {row.woodEntryPct > 0 ? formatNumber(row.woodEntryPct) : ''}
                  </TableCell>
                  <TableCell className="text-center border-r">
                    {row.woodEntryM3 > 0 ? formatNumber(row.woodEntryM3) : ''}
                  </TableCell>
                  <TableCell className="text-center border-r font-semibold">
                    {formatNumber(row.currentStockPct)}
                  </TableCell>
                  <TableCell className="text-center border-r font-semibold">
                    {formatNumber(row.currentStockM3)}
                  </TableCell>
                  <TableCell className="text-center font-bold text-primary">
                    {row.consumoDiarioM3 > 0
                      ? formatNumber(row.consumoDiarioM3)
                      : ''}
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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>
              Atualize os dados de controle da caldeira.
            </DialogDescription>
          </DialogHeader>
          <BoilerControlForm
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
              Tem certeza que deseja remover este registro? Isso pode afetar o
              cálculo de estoque dos dias seguintes.
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
