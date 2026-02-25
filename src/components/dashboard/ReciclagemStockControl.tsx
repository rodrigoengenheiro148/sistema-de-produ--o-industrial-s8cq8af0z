import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { ProductionEntry, ShippingEntry, StockBalanceRecord } from '@/lib/types'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  production?: ProductionEntry[]
  shipping?: ShippingEntry[]
}

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#06b6d4', '#dc2626']

export function ReciclagemStockControl(_props: Props) {
  const { stockBalanceRecords, updateStockBalanceRecords } = useData()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [localRecords, setLocalRecords] = useState<StockBalanceRecord[]>([])

  useEffect(() => {
    if (!isEditing) {
      if (stockBalanceRecords && stockBalanceRecords.length > 0) {
        setLocalRecords(
          [...stockBalanceRecords].sort((a, b) => {
            if (a.isFilialRow && !b.isFilialRow) return 1
            if (!a.isFilialRow && b.isFilialRow) return -1
            return (a.productCode || '').localeCompare(b.productCode || '')
          }),
        )
      } else {
        setLocalRecords([
          {
            id: 'new-1',
            factoryId: '',
            productCode: 'PP000001',
            description: 'FARINHA DE CARNE E OSSO',
            weightKg: 0,
            quantityUnits: 0,
            isFilialRow: false,
          },
          {
            id: 'new-2',
            factoryId: '',
            productCode: 'PP000006',
            description: 'FARINHA DE CARNE E OSSO ESPECIAL',
            weightKg: 32580,
            quantityUnits: 25,
            isFilialRow: false,
          },
          {
            id: 'new-3',
            factoryId: '',
            productCode: 'PP000011',
            description: 'FARINHA VISCERAS DE AVES',
            weightKg: 0,
            quantityUnits: 0,
            isFilialRow: false,
          },
          {
            id: 'new-4',
            factoryId: '',
            productCode: 'PP000012',
            description: 'FARINHA DE PEIXE',
            weightKg: 0,
            quantityUnits: 0,
            isFilialRow: false,
          },
          {
            id: 'new-5',
            factoryId: '',
            productCode: 'PP000002',
            description: 'FARINHA DE SANGUE',
            weightKg: 0,
            quantityUnits: 0,
            isFilialRow: false,
          },
          {
            id: 'new-6',
            factoryId: '',
            productCode: '',
            description: 'ESTOQUE QUE ESTA NA FILIAL:',
            weightKg: 31100,
            quantityUnits: 0,
            isFilialRow: true,
          },
        ])
      }
    }
  }, [stockBalanceRecords, isEditing])

  const handleSave = async () => {
    try {
      await updateStockBalanceRecords(localRecords)
      setIsEditing(false)
      toast({
        title: 'Sucesso',
        description: 'Estoque atualizado com sucesso.',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar estoque.',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (stockBalanceRecords && stockBalanceRecords.length > 0) {
      setLocalRecords(
        [...stockBalanceRecords].sort((a, b) => {
          if (a.isFilialRow && !b.isFilialRow) return 1
          if (!a.isFilialRow && b.isFilialRow) return -1
          return (a.productCode || '').localeCompare(b.productCode || '')
        }),
      )
    }
  }

  const handleChange = (
    id: string,
    field: keyof StockBalanceRecord,
    value: any,
  ) => {
    setLocalRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    )
  }

  const regularRows = localRecords.filter((r) => !r.isFilialRow)
  const filialRow = localRecords.find((r) => r.isFilialRow)

  const grandTotalKg = localRecords.reduce(
    (acc, r) => acc + (Number(r.weightKg) || 0),
    0,
  )
  const grandTotalQtd = localRecords.reduce(
    (acc, r) => acc + (Number(r.quantityUnits) || 0),
    0,
  )

  const chartData = regularRows
    .filter((r) => (Number(r.weightKg) || 0) > 0)
    .map((r) => ({
      name: r.description,
      kg: Number(r.weightKg) || 0,
    }))

  const chartConfig = {
    kg: { label: 'Estoque (KG)', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

  const formatWithThreeDecimals = (val: number) => {
    return (Number(val) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Balanço de Estoque - Reciclagem</CardTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" /> Salvar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#78b849]/30 overflow-hidden">
            <Table>
              <TableHeader className="bg-[#78b849] hover:bg-[#78b849]">
                <TableRow className="hover:bg-[#78b849] border-b-0">
                  <TableHead className="text-white font-bold text-center border-r border-white/30 uppercase">
                    PRODUTO
                  </TableHead>
                  <TableHead className="text-white font-bold text-center border-r border-white/30 uppercase">
                    DESCRIÇÃO
                  </TableHead>
                  <TableHead className="text-white font-bold text-center border-r border-white/30 uppercase w-[150px]">
                    KG
                  </TableHead>
                  <TableHead className="text-white font-bold text-center uppercase w-[100px]">
                    QTD
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularRows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className={
                      idx % 2 === 0
                        ? 'bg-[#e2efd9] hover:bg-[#d5e8c9]'
                        : 'bg-white hover:bg-slate-50'
                    }
                  >
                    <TableCell className="font-bold border-r border-[#78b849]/20 text-[#000]">
                      {row.productCode}
                    </TableCell>
                    <TableCell className="font-bold border-r border-[#78b849]/20 text-[#000]">
                      {isEditing ? (
                        <Input
                          className="h-8"
                          value={row.description}
                          onChange={(e) =>
                            handleChange(row.id, 'description', e.target.value)
                          }
                        />
                      ) : (
                        row.description
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold border-r border-[#78b849]/20 text-[#000]">
                      {isEditing ? (
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={row.weightKg}
                          onChange={(e) =>
                            handleChange(row.id, 'weightKg', e.target.value)
                          }
                        />
                      ) : (
                        formatWithThreeDecimals(row.weightKg)
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#000]">
                      {isEditing ? (
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={row.quantityUnits}
                          onChange={(e) =>
                            handleChange(
                              row.id,
                              'quantityUnits',
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        row.quantityUnits
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filialRow && (
                  <TableRow className="bg-[#e2efd9] hover:bg-[#d5e8c9]">
                    <TableCell
                      colSpan={2}
                      className="font-bold border-r border-[#78b849]/20 text-[#000]"
                    >
                      {isEditing ? (
                        <Input
                          className="h-8 w-full max-w-[400px]"
                          value={filialRow.description}
                          onChange={(e) =>
                            handleChange(
                              filialRow.id,
                              'description',
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        filialRow.description
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold border-r border-[#78b849]/20 text-[#000]">
                      {isEditing ? (
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={filialRow.weightKg}
                          onChange={(e) =>
                            handleChange(
                              filialRow.id,
                              'weightKg',
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        formatWithThreeDecimals(filialRow.weightKg)
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#000]">
                      {isEditing ? (
                        <Input
                          className="h-8 text-right"
                          type="number"
                          value={filialRow.quantityUnits}
                          onChange={(e) =>
                            handleChange(
                              filialRow.id,
                              'quantityUnits',
                              e.target.value,
                            )
                          }
                        />
                      ) : (
                        filialRow.quantityUnits || 0
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-[#5f9c34] hover:bg-[#5f9c34]">
                <TableRow className="hover:bg-[#5f9c34] border-t-0">
                  <TableCell
                    colSpan={2}
                    className="border-r border-white/30"
                  ></TableCell>
                  <TableCell className="text-right font-bold text-white border-r border-white/30">
                    {formatWithThreeDecimals(grandTotalKg)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-white text-lg">
                    {grandTotalQtd}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                  <LabelList
                    dataKey="kg"
                    position="top"
                    formatter={(value: number) =>
                      formatWithThreeDecimals(value)
                    }
                    className="fill-foreground font-bold text-xs"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
