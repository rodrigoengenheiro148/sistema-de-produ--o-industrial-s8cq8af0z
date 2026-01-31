import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import { format, isSameDay } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Lock } from 'lucide-react'
import { shouldRequireAuth } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SteamControlForm } from './SteamControlForm'
import { SteamControlRecord } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function SteamControlTable() {
  const { steamRecords, rawMaterials, deleteSteamRecord, dateRange } = useData()
  const { toast } = useToast()

  const [editingRecord, setEditingRecord] = useState<SteamControlRecord | null>(
    null,
  )
  const [securityOpen, setSecurityOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const handleProtectedAction = (
    createdAt: Date | undefined,
    action: () => void,
  ) => {
    if (shouldRequireAuth(createdAt)) {
      setPendingAction(() => action)
      setSecurityOpen(true)
    } else {
      action()
    }
  }

  const handleSecuritySuccess = () => {
    setSecurityOpen(false)
    if (pendingAction) pendingAction()
    setPendingAction(null)
  }

  const handleDelete = (id: string) => {
    deleteSteamRecord(id)
    toast({
      title: 'Registro excluído',
      description: 'O registro foi removido com sucesso.',
    })
  }

  const tableData = useMemo(() => {
    // Filter by date range
    const filtered = steamRecords
      .filter((record) => {
        if (!dateRange.from || !dateRange.to) return true
        return record.date >= dateRange.from && record.date <= dateRange.to
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Map to include calculated fields
    return filtered.map((record) => {
      const mpEntry = rawMaterials
        .filter((rm) => isSameDay(rm.date, record.date))
        .reduce((acc, curr) => acc + curr.quantity, 0)

      const biomassTotal =
        record.soyWaste + record.firewood + record.riceHusk + record.woodChips

      return {
        ...record,
        mpEntry,
        biomassTotal,
        // Ratios (handling division by zero)
        cavacoVsVapor: record.steamConsumption
          ? record.woodChips / record.steamConsumption
          : 0,
        mpVsVapor: record.steamConsumption
          ? mpEntry / record.steamConsumption
          : 0,
        mpVsCavaco: record.woodChips ? mpEntry / record.woodChips : 0,
        cavacoVsMp: mpEntry ? record.woodChips / mpEntry : 0, // M3 vs MP's
        vaporVsMp: mpEntry ? record.steamConsumption / mpEntry : 0,
      }
    })
  }, [steamRecords, rawMaterials, dateRange])

  // Calculate Footer Totals
  const totals = useMemo(() => {
    const sums = tableData.reduce(
      (acc, curr) => ({
        mpEntry: acc.mpEntry + curr.mpEntry,
        soyWaste: acc.soyWaste + curr.soyWaste,
        firewood: acc.firewood + curr.firewood,
        riceHusk: acc.riceHusk + curr.riceHusk,
        woodChips: acc.woodChips + curr.woodChips,
        biomassTotal: acc.biomassTotal + curr.biomassTotal,
        steamConsumption: acc.steamConsumption + curr.steamConsumption,
      }),
      {
        mpEntry: 0,
        soyWaste: 0,
        firewood: 0,
        riceHusk: 0,
        woodChips: 0,
        biomassTotal: 0,
        steamConsumption: 0,
      },
    )

    // Weighted averages for ratios based on the sums
    return {
      ...sums,
      cavacoVsVapor: sums.steamConsumption
        ? sums.woodChips / sums.steamConsumption
        : 0,
      mpVsVapor: sums.steamConsumption
        ? sums.mpEntry / sums.steamConsumption
        : 0,
      mpVsCavaco: sums.woodChips ? sums.mpEntry / sums.woodChips : 0,
      cavacoVsMp: sums.mpEntry ? sums.woodChips / sums.mpEntry : 0,
      vaporVsMp: sums.mpEntry ? sums.steamConsumption / sums.mpEntry : 0,
    }
  }, [tableData])

  const formatNumber = (num: number) =>
    num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  const formatRatio = (num: number) =>
    num === 0
      ? '#DIV/0!'
      : num.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) // Or 0,00 based on preference, user story mentioned #DIV/0!

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-green-100 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/30">
              <TableHead className="font-bold text-green-900 dark:text-green-100 min-w-[100px]">
                DATA
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                ENTRADA MP
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                RESIDUOS DE SOJA
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                LENHA
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                PALHA ARROZ
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                CAVACO
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right bg-green-200/50 dark:bg-green-800/30">
                TOTAL
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                CONSUMO VAPOR
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right text-xs">
                CAVACO VS TONS VAPOR
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right text-xs">
                MP'S VS TONS VAPOR
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right text-xs">
                MP'S VS M³ CAVACO
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right text-xs">
                M³ VS MP'S
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right text-xs">
                TONS VAPOR VS MP'S
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="text-center h-24 text-muted-foreground"
                >
                  Nenhum registro encontrado no período.
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => {
                const isLocked = shouldRequireAuth(row.createdAt)
                return (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium bg-green-50/50 dark:bg-green-950/10">
                      <div className="flex items-center gap-2">
                        {format(row.date, 'dd/MM/yyyy')}
                        {isLocked && (
                          <Lock className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(row.mpEntry)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatNumber(row.soyWaste)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatNumber(row.firewood)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatNumber(row.riceHusk)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatNumber(row.woodChips)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold bg-green-50/50 dark:bg-green-950/10">
                      {formatNumber(row.biomassTotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(row.steamConsumption)}
                    </TableCell>

                    {/* Ratios */}
                    <TableCell className="text-right font-mono text-xs">
                      {formatRatio(row.cavacoVsVapor)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatRatio(row.mpVsVapor)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatRatio(row.mpVsCavaco)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatRatio(row.cavacoVsMp)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatRatio(row.vaporVsMp)}
                    </TableCell>

                    <TableCell className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() =>
                          handleProtectedAction(row.createdAt, () =>
                            setEditingRecord(row),
                          )
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() =>
                          handleProtectedAction(row.createdAt, () =>
                            handleDelete(row.id),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
          {tableData.length > 0 && (
            <tfoot className="bg-green-100 dark:bg-green-900/30 font-bold border-t-2 border-green-200">
              <TableRow>
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.mpEntry)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.soyWaste)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.firewood)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.riceHusk)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.woodChips)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.biomassTotal)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.steamConsumption)}
                </TableCell>

                <TableCell className="text-right text-xs">
                  {formatRatio(totals.cavacoVsVapor)}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {formatRatio(totals.mpVsVapor)}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {formatRatio(totals.mpVsCavaco)}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {formatRatio(totals.cavacoVsMp)}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {formatRatio(totals.vaporVsMp)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>

      <Dialog
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Registro de Vapor</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <SteamControlForm
              initialData={editingRecord}
              onSuccess={() => setEditingRecord(null)}
              onCancel={() => setEditingRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <SecurityGate
        isOpen={securityOpen}
        onOpenChange={setSecurityOpen}
        onSuccess={handleSecuritySuccess}
      />
    </div>
  )
}
