import { useState, useEffect, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { CalendarIcon, Save, Loader2, Database } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  fetchSeboInventory,
  saveSeboInventory,
  deleteSeboInventoryRecord,
} from '@/services/seboInventory'
import { SeboInventoryRecord } from '@/lib/types'

const TANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '14']
const INITIAL_EXTRA_ROWS = 3

export default function SeboInventory() {
  const { currentFactoryId } = useData()
  const { user } = useAuth()
  const { toast } = useToast()

  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Tank Records State
  const [tankRecords, setTankRecords] = useState<
    Record<string, SeboInventoryRecord>
  >({})

  // Extra Records State
  const [extraRecords, setExtraRecords] = useState<SeboInventoryRecord[]>([])

  // Load Data
  useEffect(() => {
    if (!currentFactoryId || !user) return

    const loadData = async () => {
      setLoading(true)
      try {
        const data = await fetchSeboInventory(date, currentFactoryId)

        // Process Tanks
        const tankMap: Record<string, SeboInventoryRecord> = {}
        TANKS.forEach((tankNum) => {
          const existing = data.find(
            (r) => r.category === 'tank' && r.tankNumber === tankNum,
          )
          tankMap[tankNum] = existing || {
            factoryId: currentFactoryId,
            userId: user.id,
            date: date,
            tankNumber: tankNum,
            quantityLt: 0,
            quantityKg: 0,
            category: 'tank',
          }
        })
        setTankRecords(tankMap)

        // Process Extras
        const extras = data.filter((r) => r.category === 'extra')
        // Ensure at least INITIAL_EXTRA_ROWS
        const paddedExtras = [...extras]
        while (paddedExtras.length < INITIAL_EXTRA_ROWS) {
          paddedExtras.push({
            factoryId: currentFactoryId,
            userId: user.id,
            date: date,
            quantityLt: 0,
            quantityKg: 0,
            category: 'extra',
            description: '',
          })
        }
        setExtraRecords(paddedExtras)
      } catch (error) {
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível buscar o estoque de sebo.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [date, currentFactoryId, user, toast])

  // Handlers for Tank Inputs
  const handleTankChange = (
    tankNum: string,
    field: keyof SeboInventoryRecord,
    value: string | number,
  ) => {
    setTankRecords((prev) => ({
      ...prev,
      [tankNum]: {
        ...prev[tankNum],
        [field]: value,
      },
    }))
  }

  // Handlers for Extra Inputs
  const handleExtraChange = (
    index: number,
    field: keyof SeboInventoryRecord,
    value: string | number,
  ) => {
    const newExtras = [...extraRecords]
    newExtras[index] = { ...newExtras[index], [field]: value }
    setExtraRecords(newExtras)
  }

  const addExtraRow = () => {
    if (!user) return
    setExtraRecords([
      ...extraRecords,
      {
        factoryId: currentFactoryId,
        userId: user.id,
        date: date,
        quantityLt: 0,
        quantityKg: 0,
        category: 'extra',
        description: '',
      },
    ])
  }

  const removeExtraRow = async (index: number) => {
    const record = extraRecords[index]
    if (record.id) {
      // If it has an ID, delete from DB
      try {
        await deleteSeboInventoryRecord(record.id)
      } catch (e) {
        console.error('Failed to delete record', e)
      }
    }
    const newExtras = [...extraRecords]
    newExtras.splice(index, 1)
    setExtraRecords(newExtras)
  }

  // Calculations
  const totals = useMemo(() => {
    let totalLt = 0
    let totalKg = 0
    Object.values(tankRecords).forEach((r) => {
      totalLt += Number(r.quantityLt) || 0
      totalKg += Number(r.quantityKg) || 0
    })

    let extraKg = 0
    extraRecords.forEach((r) => {
      extraKg += Number(r.quantityKg) || 0
    })

    return {
      tankTotalLt: totalLt,
      tankTotalKg: totalKg,
      extraTotalKg: extraKg,
      grandTotalKg: totalKg + extraKg,
    }
  }, [tankRecords, extraRecords])

  // Save Function
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const allRecords = [
        ...Object.values(tankRecords),
        ...extraRecords.filter((r) => r.quantityKg > 0 || r.description), // Only save relevant extras
      ]

      // Ensure current context date/factory is consistent before saving (in case date changed rapidly)
      const sanitizedRecords = allRecords.map((r) => ({
        ...r,
        date: date, // Force current date state
        factoryId: currentFactoryId,
        userId: user.id,
      }))

      await saveSeboInventory(sanitizedRecords)
      toast({
        title: 'Salvo com sucesso',
        description: 'Os dados do estoque foram atualizados.',
      })

      // Refresh logic could be better, but for now relies on state being up to date
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Falha ao persistir os dados.',
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
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
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

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

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/40 pb-4">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Estoque de Sebo - {format(date, 'dd/MMM', { locale: ptBR })}
          </CardTitle>
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
                    <TableHead className="w-[80px] text-center font-bold text-green-900 dark:text-green-100 border-r">
                      TANQUES
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      QTD (LT)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      QTD (KG)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      ACIDEZ (%)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      UMIDADE (%)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      IMPUREZA (%)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      SABÕES (ppm)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100 border-r">
                      IODO (%)
                    </TableHead>
                    <TableHead className="text-center font-bold text-green-900 dark:text-green-100">
                      STATUS / OBS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TANKS.map((tank) => {
                    const record = tankRecords[tank] || {}
                    return (
                      <TableRow key={tank} className="hover:bg-muted/50">
                        <TableCell className="font-bold text-center border-r bg-muted/20">
                          {tank}
                        </TableCell>
                        <TableCell className="p-1 border-r">
                          <Input
                            type="number"
                            className="text-right h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.quantityLt || ''}
                            onChange={(e) =>
                              handleTankChange(
                                tank,
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
                                tank,
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
                              handleTankChange(tank, 'acidity', e.target.value)
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
                              handleTankChange(tank, 'moisture', e.target.value)
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
                              handleTankChange(tank, 'impurity', e.target.value)
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
                              handleTankChange(tank, 'soaps', e.target.value)
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
                              handleTankChange(tank, 'iodine', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            placeholder="Status..."
                            className="h-8 border-transparent hover:border-input focus:border-primary bg-transparent"
                            value={record.label || ''}
                            onChange={(e) =>
                              handleTankChange(tank, 'label', e.target.value)
                            }
                            list="status-suggestions"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}

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
                      colSpan={6}
                      className="text-center text-muted-foreground text-xs uppercase tracking-widest"
                    >
                      Totais dos Tanques
                    </TableCell>
                  </TableRow>

                  {/* Extra Records Section */}
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="bg-green-50 dark:bg-green-900/20 text-center font-semibold py-2 text-green-800 dark:text-green-200 uppercase text-xs"
                    >
                      Registros Adicionais / Comercialização
                    </TableCell>
                  </TableRow>

                  {extraRecords.map((record, idx) => (
                    <TableRow key={`extra-${idx}`}>
                      <TableCell
                        colSpan={2}
                        className="p-1 border-r text-right text-xs text-muted-foreground"
                      >
                        {idx + 1}
                      </TableCell>
                      <TableCell className="p-1 border-r">
                        <Input
                          type="number"
                          className="text-right h-8 border-transparent hover:border-input focus:border-primary bg-transparent font-medium"
                          value={record.quantityKg || ''}
                          onChange={(e) =>
                            handleExtraChange(idx, 'quantityKg', e.target.value)
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
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={9} className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addExtraRow}
                        className="text-xs text-muted-foreground h-6"
                      >
                        + Adicionar Linha Extra
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Extras Total */}
                  <TableRow className="bg-muted/50 font-medium text-muted-foreground">
                    <TableCell colSpan={2} className="text-right border-r px-4">
                      TOTAL EXTRA
                    </TableCell>
                    <TableCell className="text-right px-4 border-r">
                      {totals.extraTotalKg.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell colSpan={6}></TableCell>
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
                      colSpan={6}
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
