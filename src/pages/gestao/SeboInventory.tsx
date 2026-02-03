import { useState, useEffect, useMemo, useCallback } from 'react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarIcon,
  Save,
  Loader2,
  Database,
  Plus,
  Trash2,
  RefreshCcw,
} from 'lucide-react'
import {
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  setMonth,
  setYear,
  getMonth,
  getYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  fetchSeboInventory,
  fetchSeboInventoryHistory,
  saveSeboInventory,
  deleteSeboInventoryRecord,
} from '@/services/seboInventory'
import { SeboInventoryRecord } from '@/lib/types'
import { SeboInventoryChart } from '@/components/inventory/SeboInventoryChart'

const INITIAL_TANK_ROWS = 5
const INITIAL_EXTRA_ROWS = 3

const MONTHS = [
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

export default function SeboInventory() {
  const { currentFactoryId } = useData()
  const { user } = useAuth()
  const { toast } = useToast()

  // Initialize table date to start of today
  const [date, setDate] = useState<Date>(startOfDay(new Date()))

  // Initialize chart reference month to start of current month
  const [chartMonth, setChartMonth] = useState<Date>(startOfMonth(new Date()))

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Separate states for tank rows and extra rows
  const [tankRows, setTankRows] = useState<SeboInventoryRecord[]>([])
  const [extraRows, setExtraRows] = useState<SeboInventoryRecord[]>([])

  // History Records State for Chart
  const [historyRecords, setHistoryRecords] = useState<SeboInventoryRecord[]>(
    [],
  )

  // Derived dates for the chart view based on selected month
  const chartStartDate = useMemo(() => startOfMonth(chartMonth), [chartMonth])
  const chartEndDate = useMemo(() => endOfMonth(chartMonth), [chartMonth])

  // Generate Year Options dynamically (Current Year +/- 2)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(
      String,
    )
  }, [])

  const createEmptyRecord = useCallback(
    (category: 'tank' | 'extra'): SeboInventoryRecord => ({
      factoryId: currentFactoryId,
      userId: user?.id || '',
      date: date,
      quantityLt: 0,
      quantityKg: 0,
      category,
      tankNumber: category === 'tank' ? '' : undefined,
      description: '',
    }),
    [currentFactoryId, user, date],
  )

  // Load Data for Table
  const loadData = useCallback(async () => {
    if (!currentFactoryId) return

    setLoading(true)
    try {
      // Fetch all records for the factory on the selected date
      const data = await fetchSeboInventory(date, currentFactoryId)

      const fetchedTanks = data.filter((r) => r.category === 'tank')
      const fetchedExtras = data.filter((r) => r.category === 'extra')

      // Ensure minimum rows for tanks
      const newTankRows = [...fetchedTanks]
      if (newTankRows.length < INITIAL_TANK_ROWS) {
        const needed = INITIAL_TANK_ROWS - newTankRows.length
        for (let i = 0; i < needed; i++) {
          newTankRows.push(createEmptyRecord('tank'))
        }
      }
      setTankRows(newTankRows)

      // Ensure minimum rows for extras
      const newExtraRows = [...fetchedExtras]
      if (newExtraRows.length < INITIAL_EXTRA_ROWS) {
        const needed = INITIAL_EXTRA_ROWS - newExtraRows.length
        for (let i = 0; i < needed; i++) {
          newExtraRows.push(createEmptyRecord('extra'))
        }
      }
      setExtraRows(newExtraRows)
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao carregar dados',
        description:
          error.message || 'Não foi possível buscar o estoque de sebo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [date, currentFactoryId, createEmptyRecord, toast])

  // Load History Data for Chart
  const loadHistory = useCallback(async () => {
    if (!currentFactoryId) return

    setHistoryLoading(true)
    try {
      const history = await fetchSeboInventoryHistory(
        chartStartDate,
        chartEndDate,
        currentFactoryId,
      )
      setHistoryRecords(history)
    } catch (error: any) {
      console.error('Failed to load history', error)
      toast({
        title: 'Erro ao carregar histórico',
        description:
          error.message ||
          'Não foi possível atualizar o gráfico de evolução do estoque.',
        variant: 'destructive',
      })
    } finally {
      setHistoryLoading(false)
    }
  }, [chartStartDate, chartEndDate, currentFactoryId, toast])

  // Trigger loads when dependencies change
  // Note: loadData depends on `date`, loadHistory depends on `chartMonth` (via start/end dates)
  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Handlers for Chart Filter
  const handleChartMonthChange = (value: string) => {
    const newDate = setMonth(chartMonth, parseInt(value))
    setChartMonth(newDate)
  }

  const handleChartYearChange = (value: string) => {
    const newDate = setYear(chartMonth, parseInt(value))
    setChartMonth(newDate)
  }

  // Handlers for Tank Inputs
  const handleTankChange = (
    index: number,
    field: keyof SeboInventoryRecord,
    value: any,
  ) => {
    const newRows = [...tankRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setTankRows(newRows)
  }

  const addTankRow = () => {
    setTankRows([...tankRows, createEmptyRecord('tank')])
  }

  const removeTankRow = async (index: number) => {
    const record = tankRows[index]
    if (record.id) {
      try {
        await deleteSeboInventoryRecord(record.id)
        toast({
          title: 'Registro removido',
          description: 'O tanque foi removido do banco de dados.',
        })
        // Immediately update history chart if deleted record is within view
        loadHistory()
      } catch (e: any) {
        console.error('Failed to delete record', e)
        toast({
          title: 'Erro ao remover',
          description: e.message || 'Não foi possível remover o registro.',
          variant: 'destructive',
        })
        return
      }
    }
    const newRows = [...tankRows]
    newRows.splice(index, 1)
    setTankRows(newRows)
  }

  // Handlers for Extra Inputs
  const handleExtraChange = (
    index: number,
    field: keyof SeboInventoryRecord,
    value: any,
  ) => {
    const newRows = [...extraRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setExtraRows(newRows)
  }

  const addExtraRow = () => {
    setExtraRows([...extraRows, createEmptyRecord('extra')])
  }

  const removeExtraRow = async (index: number) => {
    const record = extraRows[index]
    if (record.id) {
      try {
        await deleteSeboInventoryRecord(record.id)
        toast({
          title: 'Registro removido',
          description: 'O registro extra foi removido.',
        })
        // Immediately update history chart
        loadHistory()
      } catch (e: any) {
        console.error('Failed to delete record', e)
        toast({
          title: 'Erro ao remover',
          description: e.message || 'Não foi possível remover o registro.',
          variant: 'destructive',
        })
        return
      }
    }
    const newRows = [...extraRows]
    newRows.splice(index, 1)
    setExtraRows(newRows)
  }

  // Calculations
  const totals = useMemo(() => {
    let tankTotalLt = 0
    let tankTotalKg = 0
    tankRows.forEach((r) => {
      tankTotalLt += Number(r.quantityLt) || 0
      tankTotalKg += Number(r.quantityKg) || 0
    })

    let extraKg = 0
    extraRows.forEach((r) => {
      extraKg += Number(r.quantityKg) || 0
    })

    return {
      tankTotalLt,
      tankTotalKg,
      extraTotalKg: extraKg,
      grandTotalKg: tankTotalKg + extraKg,
    }
  }, [tankRows, extraRows])

  // Save Function
  const handleSave = async () => {
    if (!user || !currentFactoryId) {
      toast({
        title: 'Erro de Autenticação',
        description:
          'Você precisa estar logado e com uma fábrica selecionada para salvar.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // Filter out empty rows to avoid saving garbage
      const validTanks = tankRows.filter(
        (r) =>
          (r.tankNumber && r.tankNumber.trim() !== '') ||
          r.quantityKg > 0 ||
          r.quantityLt > 0,
      )
      const validExtras = extraRows.filter(
        (r) =>
          r.quantityKg > 0 || (r.description && r.description.trim() !== ''),
      )

      const allRecords = [...validTanks, ...validExtras]

      // Ensure current context date/factory is consistent
      const sanitizedRecords = allRecords.map((r) => ({
        ...r,
        date: date,
        factoryId: currentFactoryId,
        // Preserve existing userId if editing another user's record, otherwise default to current user
        userId: r.userId || user.id,
      }))

      if (sanitizedRecords.length > 0) {
        await saveSeboInventory(sanitizedRecords)
        toast({
          title: 'Salvo com sucesso',
          description: 'Os dados do estoque foram atualizados.',
          variant: 'default',
          className: 'bg-green-600 text-white border-none',
        })
      }

      // Reload data to get updated IDs and consistent state
      await loadData()

      // Refresh history immediately
      await loadHistory()
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Falha ao persistir os dados.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Helper for conditional formatting
  const getCellClass = (
    type: 'moisture_impurity' | 'soaps' | 'iodine',
    val1?: number,
    val2?: number,
  ) => {
    if (type === 'moisture_impurity') {
      const sum = (Number(val1) || 0) + (Number(val2) || 0)
      if (sum > 1.0)
        return 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 font-bold'
    }
    if (type === 'soaps') {
      if ((Number(val1) || 0) > 200)
        return 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 font-bold'
    }
    if (type === 'iodine') {
      if ((Number(val1) || 0) > 48)
        return 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 font-bold'
    }
    return ''
  }

  const chartControls = (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block text-sm font-medium text-muted-foreground mr-1">
        Filtrar por Mês:
      </div>
      <Select
        value={String(getMonth(chartMonth))}
        onValueChange={handleChartMonthChange}
      >
        <SelectTrigger className="w-[110px] sm:w-[130px] h-8 text-xs sm:text-sm">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, index) => (
            <SelectItem key={index} value={String(index)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(getYear(chartMonth))}
        onValueChange={handleChartYearChange}
      >
        <SelectTrigger className="w-[80px] sm:w-[90px] h-8 text-xs sm:text-sm">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Estoque de Sebo Bovino
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento de tanques e qualidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-picker" className="text-xs font-semibold">
              Data de Referência (Tabela)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-picker"
                  variant={'outline'}
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(startOfDay(d))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1 justify-end h-full">
            <Label className="text-xs font-semibold opacity-0">Ação</Label>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Inventory Chart */}
        <SeboInventoryChart
          data={historyRecords}
          startDate={chartStartDate}
          endDate={chartEndDate}
          isLoading={historyLoading}
          headerControls={chartControls}
        />

        {/* Inventory Input Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/40 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Estoque de Sebo - {format(date, 'dd/MMM', { locale: ptBR })}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => loadData()}
              disabled={loading}
              title="Recarregar tabela"
            >
              <RefreshCcw
                className={cn('h-3 w-3', loading && 'animate-spin')}
              />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-green-100 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/30">
                      <TableHead className="w-[120px] min-w-[100px] text-center font-bold text-green-900 dark:text-green-100 border-r">
                        TANQUES
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        QTD (LT)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        QTD (KG)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        ACIDEZ (%)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        UMIDADE (%)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        IMPUREZA (%)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        SABÕES (ppm)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r min-w-[80px]">
                        IODO (%)
                      </TableHead>
                      <TableHead className="text-center font-bold text-green-900 dark:text-green-100 min-w-[150px]">
                        STATUS / OBS
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tankRows.map((record, idx) => (
                      <TableRow
                        key={`tank-${idx}`}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="p-1 border-r">
                          <Input
                            type="text"
                            placeholder="Nome/Nº"
                            className="text-center h-8 border-transparent hover:border-input focus:border-primary bg-transparent font-bold"
                            value={record.tankNumber || ''}
                            onChange={(e) =>
                              handleTankChange(
                                idx,
                                'tankNumber',
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="p-1 border-r">
                          <Input
                            type="number"
                            className="text-right h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.quantityLt || ''}
                            onChange={(e) =>
                              handleTankChange(
                                idx,
                                'quantityLt',
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="p-1 border-r">
                          <Input
                            type="number"
                            className="text-right h-8 border-transparent hover:border-input focus:border-primary bg-transparent font-medium"
                            value={record.quantityKg || ''}
                            onChange={(e) =>
                              handleTankChange(
                                idx,
                                'quantityKg',
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>

                        {/* Quality Metrics */}
                        <TableCell
                          className={cn(
                            'p-1 border-r',
                            record.acidity && record.acidity > 5
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : '',
                          )}
                        >
                          <Input
                            type="number"
                            step="0.01"
                            className="text-center h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.acidity || ''}
                            onChange={(e) =>
                              handleTankChange(idx, 'acidity', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'p-1 border-r',
                            getCellClass(
                              'moisture_impurity',
                              record.moisture,
                              record.impurity,
                            ),
                          )}
                        >
                          <Input
                            type="number"
                            step="0.01"
                            className="text-center h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.moisture || ''}
                            onChange={(e) =>
                              handleTankChange(idx, 'moisture', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'p-1 border-r',
                            getCellClass(
                              'moisture_impurity',
                              record.moisture,
                              record.impurity,
                            ),
                          )}
                        >
                          <Input
                            type="number"
                            step="0.01"
                            className="text-center h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.impurity || ''}
                            onChange={(e) =>
                              handleTankChange(idx, 'impurity', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'p-1 border-r',
                            getCellClass('soaps', record.soaps),
                          )}
                        >
                          <Input
                            type="number"
                            className="text-center h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.soaps || ''}
                            onChange={(e) =>
                              handleTankChange(idx, 'soaps', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'p-1 border-r',
                            getCellClass('iodine', record.iodine),
                          )}
                        >
                          <Input
                            type="number"
                            step="0.01"
                            className="text-center h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.iodine || ''}
                            onChange={(e) =>
                              handleTankChange(idx, 'iodine', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            placeholder="Status..."
                            className="h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.description || ''}
                            onChange={(e) =>
                              handleTankChange(
                                idx,
                                'description',
                                e.target.value,
                              )
                            }
                            list="status-suggestions"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTankRow(idx)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Remover tanque"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell colSpan={10} className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addTankRow}
                          className="text-xs text-muted-foreground h-6 gap-1"
                        >
                          <Plus className="h-3 w-3" /> Adicionar Tanque
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Tank Totals Row */}
                    <TableRow className="bg-muted font-bold border-t-2 border-primary/20">
                      <TableCell className="text-center border-r">
                        TOTAL
                      </TableCell>
                      <TableCell className="text-right px-4 border-r">
                        {totals.tankTotalLt.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right px-4 border-r">
                        {totals.tankTotalKg.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground text-xs uppercase tracking-widest"
                      >
                        Totais dos Tanques
                      </TableCell>
                    </TableRow>

                    {/* Extra Records Section */}
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="bg-green-50 dark:bg-green-900/20 text-center font-semibold py-2 text-green-800 dark:text-green-200 uppercase text-xs"
                      >
                        Registros Adicionais / Comercialização
                      </TableCell>
                    </TableRow>

                    {extraRows.map((record, idx) => (
                      <TableRow key={`extra-${idx}`}>
                        <TableCell
                          colSpan={2}
                          className="p-1 border-r text-right text-xs text-muted-foreground"
                        >
                          Extra #{idx + 1}
                        </TableCell>
                        <TableCell className="p-1 border-r">
                          <Input
                            type="number"
                            className="text-right h-8 border-transparent hover:border-input focus:border-primary bg-transparent font-medium"
                            value={record.quantityKg || ''}
                            onChange={(e) =>
                              handleExtraChange(
                                idx,
                                'quantityKg',
                                e.target.value,
                              )
                            }
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell colSpan={6} className="p-1">
                          <Input
                            type="text"
                            placeholder="Descrição (Ex: COMERCIALIZAÇÃO BONANZA - NF: 12345)..."
                            className="h-8 border-transparent hover:border-input focus:border-primary bg-transparent w-full"
                            value={record.description || ''}
                            onChange={(e) =>
                              handleExtraChange(
                                idx,
                                'description',
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExtraRow(idx)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Remover registro extra"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell colSpan={10} className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addExtraRow}
                          className="text-xs text-muted-foreground h-6 gap-1"
                        >
                          <Plus className="h-3 w-3" /> Adicionar Linha Extra
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Extras Total */}
                    <TableRow className="bg-muted/50 font-medium text-muted-foreground">
                      <TableCell
                        colSpan={2}
                        className="text-right border-r px-4"
                      >
                        TOTAL EXTRA
                      </TableCell>
                      <TableCell className="text-right px-4 border-r">
                        {totals.extraTotalKg.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell colSpan={7}></TableCell>
                    </TableRow>

                    {/* Grand Total */}
                    <TableRow className="bg-primary/10 font-bold text-lg border-t-2 border-primary">
                      <TableCell
                        colSpan={2}
                        className="text-right border-r px-4 text-primary"
                      >
                        TOTAL GERAL
                      </TableCell>
                      <TableCell className="text-right px-4 border-r text-primary">
                        {totals.grandTotalKg.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell
                        colSpan={7}
                        className="text-xs font-normal text-muted-foreground px-2 flex items-center h-full"
                      >
                        (Tanques + Extras)
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <datalist id="status-suggestions">
        <option value="PRODUÇÃO" />
        <option value="ÓLEO SATURADO" />
        <option value="ÓLEO TRATADO" />
        <option value="ÓLEO RECICLADO" />
        <option value="AGUARDANDO ANÁLISE" />
        <option value="EM MANUTENÇÃO" />
      </datalist>
    </div>
  )
}
