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

export function SteamControlTable() {
  const {
    steamRecords,
    rawMaterials,
    production,
    deleteSteamRecord,
    dateRange,
  } = useData()
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
      // Entrada MP: Sum of raw materials for the day (excluding 'Sangue')
      const mpEntry = rawMaterials
        .filter((rm) => isSameDay(rm.date, record.date) && rm.type !== 'Sangue')
        .reduce((acc, curr) => acc + curr.quantity, 0)

      // Total Production: Sum of all production outputs for the day
      const dailyProduction = production
        .filter((prod) => isSameDay(prod.date, record.date))
        .reduce((acc, curr) => {
          return (
            acc +
            (curr.seboProduced || 0) +
            (curr.fcoProduced || 0) +
            (curr.farinhetaProduced || 0) +
            (curr.bloodMealProduced || 0)
          )
        }, 0)

      // Total Ajustado (Biomass Total): Sum of fuels
      const biomassTotal =
        (record.soyWaste || 0) +
        (record.firewood || 0) +
        (record.riceHusk || 0) +
        (record.woodChips || 0)

      // Steam Consumption Calculation based on Meters
      // Formula: Medidor Fim - Medidor Início
      const meterStart = record.meterStart || 0
      const meterEnd = record.meterEnd || 0

      // Calculate consumption based on meters if present, otherwise fallback to stored record
      const steamConsumption =
        record.meterEnd !== undefined && record.meterStart !== undefined
          ? meterEnd - meterStart
          : record.steamConsumption || 0

      // Wood Chips
      const woodChips = record.woodChips || 0

      // CALCULATIONS

      // 1. MPs VS VAPOR: (Total MP / Steam Consumption)
      const mpVsVapor = steamConsumption > 0 ? mpEntry / steamConsumption : 0

      // 2. MPs m³ CAVACO: (Total MP / wood_chips)
      const mpVsCavaco = woodChips > 0 ? mpEntry / woodChips : 0

      // 3. TONELADAS VAPOR VS MPs: (Steam Consumption / Total MP)
      // Multiplied by 1000 to convert MP kg to Tons (Steam is Tons, MP is Kg)
      const vaporVsMp = mpEntry > 0 ? (steamConsumption / mpEntry) * 1000 : 0

      // 4. TONS VS MPs: (Total Production / Total MP)
      const tonsVsMp = mpEntry > 0 ? dailyProduction / mpEntry : 0

      // Extra: Cavaco vs Vapor
      const cavacoVsVapor =
        biomassTotal > 0 ? steamConsumption / biomassTotal : 0

      return {
        ...record,
        mpEntry,
        dailyProduction,
        biomassTotal,
        steamConsumption,
        woodChips,
        mpVsVapor,
        mpVsCavaco,
        vaporVsMp,
        tonsVsMp,
        cavacoVsVapor,
      }
    })
  }, [steamRecords, rawMaterials, production, dateRange])

  // Calculate Footer Totals
  const totals = useMemo(() => {
    const sums = tableData.reduce(
      (acc, curr) => ({
        mpEntry: acc.mpEntry + curr.mpEntry,
        dailyProduction: acc.dailyProduction + curr.dailyProduction,
        soyWaste: acc.soyWaste + (curr.soyWaste || 0),
        firewood: acc.firewood + (curr.firewood || 0),
        riceHusk: acc.riceHusk + (curr.riceHusk || 0),
        woodChips: acc.woodChips + (curr.woodChips || 0),
        biomassTotal: acc.biomassTotal + curr.biomassTotal,
        steamConsumption: acc.steamConsumption + curr.steamConsumption,
      }),
      {
        mpEntry: 0,
        dailyProduction: 0,
        soyWaste: 0,
        firewood: 0,
        riceHusk: 0,
        woodChips: 0,
        biomassTotal: 0,
        steamConsumption: 0,
      },
    )

    // Ratios based on the sums
    return {
      ...sums,
      cavacoVsVapor: sums.biomassTotal
        ? sums.steamConsumption / sums.biomassTotal
        : 0,
      mpVsVapor: sums.steamConsumption
        ? sums.mpEntry / sums.steamConsumption
        : 0,
      mpVsCavaco: sums.woodChips ? sums.mpEntry / sums.woodChips : 0,
      vaporVsMp: sums.mpEntry
        ? (sums.steamConsumption / sums.mpEntry) * 1000
        : 0,
      tonsVsMp: sums.mpEntry ? sums.dailyProduction / sums.mpEntry : 0,
    }
  }, [tableData])

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '-'
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatRatio = (num: number) =>
    !isFinite(num) || num === 0
      ? '-'
      : num.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-green-100 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/30">
              <TableHead className="font-bold text-green-900 dark:text-green-100 min-w-[100px]">
                DATA
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                MEDIDOR INÍCIO
              </TableHead>
              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right">
                MEDIDOR FIM
              </TableHead>
              <TableHead
                className="font-bold text-green-900 dark:text-green-100 text-right"
                title="Medidor Fim - Medidor Início"
              >
                CONSUMO VAPOR
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

              <TableHead
                className="font-bold text-green-900 dark:text-green-100 text-right bg-green-200/50 dark:bg-green-800/30"
                title="Soma de todos os combustíveis"
              >
                TOTAL (AJUSTADO)
              </TableHead>

              <TableHead className="font-bold text-green-900 dark:text-green-100 text-right text-xs">
                CAVACOS VS TONELADAS VAPOR
              </TableHead>
              <TableHead
                className="font-bold text-green-900 dark:text-green-100 text-right text-xs"
                title="Total MP / Consumo Vapor"
              >
                MPs VS VAPOR
              </TableHead>
              <TableHead
                className="font-bold text-green-900 dark:text-green-100 text-right text-xs"
                title="Total MP / Cavaco"
              >
                MPs m³ CAVACO
              </TableHead>
              <TableHead
                className="font-bold text-green-900 dark:text-green-100 text-right text-xs"
                title="Consumo Vapor / Total MP"
              >
                TONELADAS VAPOR VS MPs
              </TableHead>
              <TableHead
                className="font-bold text-green-900 dark:text-green-100 text-right text-xs"
                title="Produção Total / Total MP"
              >
                TONS VS MPs
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={15}
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

                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatNumber(row.meterStart)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatNumber(row.meterEnd)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatNumber(row.steamConsumption)}
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

                    {/* Total Ajustado */}
                    <TableCell className="text-right font-mono font-bold text-blue-600 dark:text-blue-400 bg-green-50/50 dark:bg-green-950/10">
                      {formatNumber(row.biomassTotal)}
                    </TableCell>

                    {/* Ratios */}
                    <TableCell className="text-right font-mono text-xs">
                      {formatRatio(row.cavacoVsVapor)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRatio(row.mpVsVapor)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRatio(row.mpVsCavaco)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRatio(row.vaporVsMp)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRatio(row.tonsVsMp)}
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
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">
                  {formatNumber(totals.steamConsumption)}
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

                {/* Total Ajustado */}
                <TableCell className="text-right text-blue-600 dark:text-blue-400">
                  {formatNumber(totals.biomassTotal)}
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
                  {formatRatio(totals.vaporVsMp)}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {formatRatio(totals.tonsVsMp)}
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
