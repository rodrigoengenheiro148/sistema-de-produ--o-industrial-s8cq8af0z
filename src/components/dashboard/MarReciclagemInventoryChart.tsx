import { useMemo } from 'react'
import {
  ProductionEntry,
  ShippingEntry,
  SeboInventoryRecord,
} from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
  Cell,
} from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, Package, Info } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface MarReciclagemInventoryChartProps {
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  inventoryRecords?: SeboInventoryRecord[]
  className?: string
}

const SEBO_DENSITY = 0.9

export function MarReciclagemInventoryChart({
  production,
  shipping,
  inventoryRecords = [],
  className,
}: MarReciclagemInventoryChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    // Helper to find latest manual record for a category
    const getManualValue = (
      categoryName: string,
      defaultValue: number,
      isLiquid = false,
    ) => {
      const record = inventoryRecords.find((r) => r.category === categoryName)
      if (record) {
        if (isLiquid) {
          return record.quantityLt > 0 ? record.quantityLt : record.quantityKg
        }
        return record.quantityKg > 0 ? record.quantityKg : record.quantityLt
      }
      return defaultValue
    }

    // 1. Calculate Production Totals (Kg)
    let prodSangue = 0
    let prodTortaCarne = 0 // FCO
    let prodVisceras = 0
    let prodPenas = 0
    let prodPeixe = 0
    let prodSebo = 0
    let prodOleo = 0

    production.forEach((p) => {
      // Farinha de Sangue: Use bags conversion if available, else use recorded value
      const sangue =
        p.bloodMealBags && p.bloodMealBags > 0
          ? p.bloodMealBags * 1400
          : p.bloodMealProduced || 0
      prodSangue += sangue

      prodTortaCarne += p.fcoProduced || 0
      prodVisceras += p.viscerasMealProduced || 0
      prodPenas += p.featherMealProduced || 0
      prodPeixe += p.fishMealProduced || 0
      prodSebo += p.seboProduced || 0
      prodOleo += p.viscerasOilProduced || 0
    })

    // 2. Calculate Shipping Totals (Kg)
    // Map shipping products to our categories
    let shipSangue = 0
    let shipTortaCarne = 0
    let shipVisceras = 0
    let shipPenas = 0
    let shipPeixe = 0
    let shipSebo = 0
    let shipOleo = 0

    shipping.forEach((s) => {
      const pName = s.product.toLowerCase()
      const qty = s.quantity // Assuming quantity is in Kg or correct unit for solids

      if (pName.includes('sangue')) {
        shipSangue += qty
      } else if (
        pName.includes('torta') ||
        pName === 'fco' ||
        pName.includes('carne')
      ) {
        shipTortaCarne += qty
      } else if (pName.includes('vísceras') || pName.includes('visceras')) {
        shipVisceras += qty
      } else if (pName.includes('penas')) {
        shipPenas += qty
      } else if (pName.includes('peixe')) {
        shipPeixe += qty
      } else if (pName.includes('sebo')) {
        shipSebo += qty
      } else if (pName.includes('óleo') || pName.includes('oleo')) {
        shipOleo += qty
      }
    })

    // 3. Calculate Balance (Stock)
    // Balance = Production - Shipping
    // If manual record exists, use it instead
    const balSangue = getManualValue(
      'Farinha de Sangue',
      prodSangue - shipSangue,
    )
    const balTortaCarne = getManualValue(
      'Torta de Carne',
      prodTortaCarne - shipTortaCarne,
    )
    const balVisceras = getManualValue(
      'Farinha de Vísceras',
      prodVisceras - shipVisceras,
    )
    const balPenas = getManualValue('Farinha de Penas', prodPenas - shipPenas)
    const balPeixe = getManualValue('Farinha de Peixe', prodPeixe - shipPeixe)

    // Sebo/Oil in Kg first
    const calcSeboKg = prodSebo - shipSebo
    const calcOleoKg = prodOleo - shipOleo

    // 4. Convert Liquids to Liters
    const calcSeboL = calcSeboKg / SEBO_DENSITY
    const calcOleoL = calcOleoKg / SEBO_DENSITY

    const balSeboL = getManualValue('Sebo', calcSeboL, true)
    const balOleoL = getManualValue('Óleo', calcOleoL, true)

    const data = [
      {
        name: 'Farinha de Sangue',
        value: balSangue,
        unit: 'kg',
        fill: '#dc2626', // red-600
      },
      {
        name: 'Torta de Carne',
        value: balTortaCarne,
        unit: 'kg',
        fill: '#d97706', // amber-600
      },
      {
        name: 'Farinha de Vísceras',
        value: balVisceras,
        unit: 'kg',
        fill: '#2563eb', // blue-600
      },
      {
        name: 'Farinha de Penas',
        value: balPenas,
        unit: 'kg',
        fill: '#4b5563', // gray-600
      },
      {
        name: 'Farinha de Peixe',
        value: balPeixe,
        unit: 'kg',
        fill: '#06b6d4', // cyan-500
      },
      {
        name: 'Sebo',
        value: balSeboL,
        unit: 'L',
        fill: '#16a34a', // green-600
      },
      {
        name: 'Óleo',
        value: balOleoL,
        unit: 'L',
        fill: '#8b5cf6', // violet-500
      },
    ]

    const config: ChartConfig = {
      value: { label: 'Estoque', color: 'hsl(var(--primary))' },
    }

    return { chartData: data, chartConfig: config }
  }, [production, shipping, inventoryRecords])

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={cn('w-full', height)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 80, left: 10, bottom: 0 }}
        barSize={32}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          width={130}
          fontSize={12}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, item) => (
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.payload.fill }}
                  />
                  <span className="text-muted-foreground">
                    {item.payload.name}:
                  </span>
                  <span className="font-mono font-bold">
                    {formatNumber(Number(value), { maximumFractionDigits: 0 })}{' '}
                    {item.payload.unit}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground font-bold"
            fontSize={12}
            formatter={(value: number, _: any, entry: any) => {
              // Get the payload unit properly
              const unit = chartData.find((d) => d.value === value)?.unit || ''
              return (
                formatNumber(value, { maximumFractionDigits: 0 }) + ' ' + unit
              )
            }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Balanço de Estoque
          </CardTitle>
          <CardDescription>
            Saldo estimado (Produção - Expedição) ou último apontamento manual
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Expandir</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] flex flex-col">
            <DialogHeader>
              <DialogTitle>Balanço de Estoque Detalhado</DialogTitle>
              <DialogDescription>
                Visualização do saldo de estoque. Se houver apontamento manual
                recente, este prevalece sobre o cálculo automático.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-[500px]" />
            </div>
            <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Os valores refletem o saldo atualizado. Apontamentos manuais de
                estoque substituem automaticamente o cálculo de fluxo (Produção
                - Expedição) quando disponíveis para garantir maior precisão.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
