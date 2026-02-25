import { useMemo } from 'react'
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
import { ProductionEntry, ShippingEntry } from '@/lib/types'

interface Props {
  production: ProductionEntry[]
  shipping: ShippingEntry[]
}

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#06b6d4', '#dc2626']

export function ReciclagemStockControl({ production, shipping }: Props) {
  const { tableData, filialStock, grandTotalKg, grandTotalQtd } =
    useMemo(() => {
      let prodFco = 0,
        shipFco = 0
      let prodEspecial = 0,
        shipEspecial = 0
      let prodVisc = 0,
        shipVisc = 0
      let prodPeixe = 0,
        shipPeixe = 0
      let prodSangue = 0,
        shipSangue = 0
      let sangueBags = 0

      production.forEach((p) => {
        prodFco += p.fcoProduced || 0
        prodEspecial += p.farinhetaProduced || 0
        prodVisc += p.viscerasMealProduced || 0
        prodPeixe += p.fishMealProduced || 0
        prodSangue += p.bloodMealProduced || 0
        sangueBags += p.bloodMealBags || 0
      })

      shipping.forEach((s) => {
        if (s.product === 'FCO') shipFco += s.quantity
        if (s.product === 'Farinha Especial' || s.product === 'Farinheta')
          shipEspecial += s.quantity
        if (s.product === 'Farinha de Vísceras') shipVisc += s.quantity
        if (s.product === 'Farinha de Peixe') shipPeixe += s.quantity
        if (s.product === 'Farinha de Sangue') shipSangue += s.quantity
      })

      const stockFco = Math.max(0, prodFco - shipFco)
      const stockEspecial = Math.max(0, prodEspecial - shipEspecial)
      const stockVisc = Math.max(0, prodVisc - shipVisc)
      const stockPeixe = Math.max(0, prodPeixe - shipPeixe)
      const stockSangue = Math.max(0, prodSangue - shipSangue)

      // QTD Estimates based on typical bag sizes
      const qtdFco = Math.floor(stockFco / 1550)
      const qtdEspecial = Math.floor(stockEspecial / 1300)
      const qtdVisc = Math.floor(stockVisc / 1400)
      const qtdPeixe = Math.floor(stockPeixe / 1400)

      const shippedSangueBags = Math.floor(shipSangue / 1400)
      const qtdSangue =
        Math.max(0, sangueBags - shippedSangueBags) ||
        Math.floor(stockSangue / 1400)

      const data = [
        {
          code: 'PP000001',
          name: 'FARINHA DE CARNE E OSSO',
          kg: stockFco,
          qtd: qtdFco,
        },
        {
          code: 'PP000006',
          name: 'FARINHA DE CARNE E OSSO ESPECIAL',
          kg: stockEspecial,
          qtd: qtdEspecial,
        },
        {
          code: 'PP000011',
          name: 'FARINHA VISCERAS DE AVES',
          kg: stockVisc,
          qtd: qtdVisc,
        },
        {
          code: 'PP000012',
          name: 'FARINHA DE PEIXE',
          kg: stockPeixe,
          qtd: qtdPeixe,
        },
        {
          code: 'PP000002',
          name: 'FARINHA DE SANGUE',
          kg: stockSangue,
          qtd: qtdSangue,
        },
      ]

      const filialStockKg = 31100 // Constant from reference
      const filialStockQtd = 0

      const totalKg =
        data.reduce((acc, curr) => acc + curr.kg, 0) + filialStockKg
      const totalQtd =
        data.reduce((acc, curr) => acc + curr.qtd, 0) + filialStockQtd

      return {
        tableData: data,
        filialStock: filialStockKg,
        grandTotalKg: totalKg,
        grandTotalQtd: totalQtd,
      }
    }, [production, shipping])

  const chartConfig = {
    kg: { label: 'Estoque (KG)', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

  const formatWithThreeDecimals = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95">
      <Card>
        <CardHeader>
          <CardTitle>Balanço de Estoque - Reciclagem</CardTitle>
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
                  <TableHead className="text-white font-bold text-center border-r border-white/30 uppercase">
                    KG
                  </TableHead>
                  <TableHead className="text-white font-bold text-center uppercase">
                    QTD
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, idx) => (
                  <TableRow
                    key={row.code}
                    className={
                      idx % 2 === 0
                        ? 'bg-[#e2efd9] hover:bg-[#d5e8c9]'
                        : 'bg-white hover:bg-slate-50'
                    }
                  >
                    <TableCell className="font-bold border-r border-[#78b849]/20 text-[#000]">
                      {row.code}
                    </TableCell>
                    <TableCell className="font-bold border-r border-[#78b849]/20 text-[#000]">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right font-bold border-r border-[#78b849]/20 text-[#000]">
                      {formatWithThreeDecimals(row.kg)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#000]">
                      {row.qtd}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-[#e2efd9] hover:bg-[#d5e8c9]">
                  <TableCell
                    colSpan={2}
                    className="font-bold border-r border-[#78b849]/20 text-[#000]"
                  >
                    ESTOQUE QUE ESTA NA FILIAL:
                  </TableCell>
                  <TableCell className="text-right font-bold border-r border-[#78b849]/20 text-[#000]">
                    {formatWithThreeDecimals(filialStock)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-[#000]"></TableCell>
                </TableRow>
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

      <Card>
        <CardHeader>
          <CardTitle>Visualização de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart
              data={tableData}
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
                {tableData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
                <LabelList
                  dataKey="kg"
                  position="top"
                  formatter={(value: number) => formatWithThreeDecimals(value)}
                  className="fill-foreground font-bold text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
