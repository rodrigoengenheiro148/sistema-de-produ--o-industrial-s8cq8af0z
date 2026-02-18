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
import { MoreVertical, Pencil, Trash2, AlertTriangle } from 'lucide-react'
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
import { formatNumber, isBloodRecord, cn, formatCurrency } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SteamControlTable() {
  const {
    steamControlRecords,
    deleteSteamControlRecord,
    production,
    notificationSettings,
    factories,
    currentFactoryId,
  } = useData()
  const { toast } = useToast()

  const [editingItem, setEditingItem] = useState<SteamControlEntry | undefined>(
    undefined,
  )
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const currentFactory = useMemo(
    () => factories.find((f) => f.id === currentFactoryId),
    [factories, currentFactoryId],
  )
  const isFarinorte =
    currentFactory?.name.toLowerCase().includes('farinorte') ?? false

  // Determine efficiency threshold (Ton Steam / Ton MP)
  const efficiencyThreshold =
    notificationSettings.yieldThreshold > 0 &&
    notificationSettings.yieldThreshold < 10
      ? notificationSettings.yieldThreshold
      : 0.24

  const tableData = useMemo(() => {
    // Optimization: Create a map of daily production totals using the PRODUCTION table.
    // Filter out blood records (secondary processing) to match main line logic.
    const productionMap = new Map<string, number>()

    production.forEach((p) => {
      // Exclude blood records to focus on Main Plant processing
      if (!isBloodRecord(p)) {
        const dateKey = format(p.date, 'yyyy-MM-dd')
        const current = productionMap.get(dateKey) || 0
        productionMap.set(dateKey, current + (p.mpUsed || 0))
      }
    })

    // We want to display records sorted by date descending
    const sortedRecords = [...steamControlRecords].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )

    return sortedRecords.map((record) => {
      const dateKey = format(record.date, 'yyyy-MM-dd')
      const mpProcessed = productionMap.get(dateKey) || 0

      const totalFuel =
        record.soyWaste + record.firewood + record.riceHusk + record.woodChips
      const consumoVap = record.meterEnd - record.meterStart

      // Ratios Calculation
      const cavacoVsVapor = totalFuel > 0 ? consumoVap / totalFuel : 0
      const mpProcessedTons = mpProcessed / 1000
      const vaporVsMp = mpProcessedTons > 0 ? consumoVap / mpProcessedTons : 0

      return {
        ...record,
        mpProcessed,
        totalFuel,
        consumoVap,
        cavacoVsVapor,
        vaporVsMp,
        isInefficient: vaporVsMp > efficiencyThreshold,
      }
    })
  }, [steamControlRecords, production, efficiencyThreshold])

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
              {isFarinorte ? (
                <>
                  <TableHead className="text-right min-w-[120px]">
                    Entrada Kg
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    Entrada Pacotes
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    Entrada m³
                  </TableHead>
                  <TableHead className="text-left min-w-[150px]">
                    Fornecedor
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    Valor
                  </TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-right min-w-[120px] font-bold">
                    Entrada de MP (kg)
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    Res. Soja
                  </TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Lenha
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    Palha Arroz
                  </TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    Cavaco
                  </TableHead>
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
                    Vapor / MP (t/t)
                  </TableHead>
                  <TableHead className="text-right min-w-[100px] bg-blue-50/50 dark:bg-blue-950/20">
                    Cavaco vs Vapor
                  </TableHead>
                </>
              )}

              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isFarinorte ? 7 : 13}
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
                  {isFarinorte ? (
                    <>
                      <TableCell className="text-right">
                        {formatNumber(row.weightKg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.packageCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.volumeM3)}
                      </TableCell>
                      <TableCell className="text-left">
                        {row.supplier || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.value ? formatCurrency(row.value) : '-'}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(row.mpProcessed)}
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
                        {row.mpProcessed > 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            {row.isInefficient && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Eficiência abaixo do esperado (&gt;
                                    {efficiencyThreshold})
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span
                              className={cn(
                                row.isInefficient && 'text-red-600 font-bold',
                              )}
                            >
                              {formatNumber(row.vaporVsMp)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right bg-blue-50/30 dark:bg-blue-950/10 font-mono text-xs">
                        {row.totalFuel > 0
                          ? formatNumber(row.cavacoVsVapor)
                          : '-'}
                      </TableCell>
                    </>
                  )}

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
