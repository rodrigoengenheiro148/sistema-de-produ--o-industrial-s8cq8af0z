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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ClipboardCheck,
  MoreVertical,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { QualityForm } from '@/components/QualityForm'
import { QualityChart } from '@/components/dashboard/QualityChart'
import { QualityEntry } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { canEditRecord } from '@/lib/security'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function Quality() {
  const { qualityRecords, deleteQualityRecord, dateRange } = useData()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<QualityEntry | undefined>(
    undefined,
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (item: QualityEntry) => {
    setEditingItem(item)
    setIsOpen(true)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteQualityRecord(deleteId)
      toast({
        title: 'Registro excluído',
        description: 'A análise foi removida com sucesso.',
      })
      setDeleteId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) setEditingItem(undefined)
  }

  const filteredRecords = qualityRecords
    .filter((item) => {
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return (
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.responsible.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  // Calculate statistics and prepare data for the chart
  const chartData = [...filteredRecords]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item, index, array) => {
      const val = item.acidity
      // Simple 3-point moving average
      let ma = val
      if (index >= 2) {
        ma =
          (array[index].acidity +
            array[index - 1].acidity +
            array[index - 2].acidity) /
          3
      }
      return {
        ...item,
        dateStr: format(item.date, 'dd/MM'),
        value: val,
        valueMA: ma,
      }
    })

  const acidityValues = chartData.map((d) => d.acidity)
  const meanAcidity =
    acidityValues.length > 0
      ? acidityValues.reduce((a, b) => a + b, 0) / acidityValues.length
      : 0
  const variance =
    acidityValues.length > 0
      ? acidityValues.reduce((a, b) => a + Math.pow(b - meanAcidity, 2), 0) /
        acidityValues.length
      : 0
  const stdDevAcidity = Math.sqrt(variance)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Gestão de Qualidade
          </h2>
          <p className="text-muted-foreground">
            Monitoramento de Acidez e Proteína (Farinha/Farinheta).
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => setEditingItem(undefined)}
              size={isMobile ? 'sm' : 'default'}
            >
              <Plus className="h-4 w-4" /> {isMobile ? 'Nova' : 'Nova Análise'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Análise' : 'Registrar Análise'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Atualize os dados da amostra selecionada.'
                  : 'Insira os resultados dos testes de qualidade.'}
              </DialogDescription>
            </DialogHeader>
            <QualityForm
              initialData={editingItem}
              onSuccess={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <QualityChart
        title="Controle de Acidez"
        data={chartData}
        mean={meanAcidity}
        stdDev={stdDevAcidity}
        unit="%"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="hidden sm:block">
              Histórico de Análises
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto ou resp..."
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
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma análise encontrada.
                </div>
              ) : (
                filteredRecords.map((entry) => {
                  const isEditable = canEditRecord(entry.createdAt)
                  return (
                    <Card key={entry.id} className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={
                                entry.product === 'Farinha'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }
                            >
                              {entry.product}
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              {format(entry.date, 'dd/MM/yyyy')}
                              {!isEditable && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Lock className="h-3 w-3 text-muted-foreground/50" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Bloqueado (excedeu 5 min)</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              disabled={!isEditable && !isMobile}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={!isEditable}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(entry)}
                                disabled={!isEditable}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(entry.id)}
                                className="text-red-600 focus:text-red-600"
                                disabled={!isEditable}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-border/50 mb-3 bg-secondary/20 rounded px-2">
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">
                              Acidez
                            </span>
                            <span className="font-mono font-bold">
                              {entry.acidity.toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-center border-l border-border/50">
                            <span className="text-xs text-muted-foreground block">
                              Proteína
                            </span>
                            <span className="font-mono font-bold">
                              {entry.protein.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Resp:{' '}
                          <span className="font-medium text-foreground">
                            {entry.responsible}
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
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Acidez (%)</TableHead>
                  <TableHead className="text-right">Proteína (%)</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhuma análise encontrada no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((entry) => {
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
                                  <p>Bloqueado (excedeu 5 min)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.product === 'Farinha'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }
                          >
                            {entry.product}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.acidity.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.protein.toFixed(2)}%
                        </TableCell>
                        <TableCell>{entry.responsible}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {entry.notes || '-'}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={
                              isEditable
                                ? 'h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                                : 'h-8 w-8 text-muted-foreground'
                            }
                            onClick={() => handleEdit(entry)}
                            disabled={!isEditable}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={
                              isEditable
                                ? 'h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50'
                                : 'h-8 w-8 text-muted-foreground'
                            }
                            onClick={() => setDeleteId(entry.id)}
                            disabled={!isEditable}
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
              Tem certeza que deseja remover esta análise de qualidade?
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
