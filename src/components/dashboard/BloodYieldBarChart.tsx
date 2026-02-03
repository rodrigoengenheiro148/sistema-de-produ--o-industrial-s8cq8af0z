import { useMemo, useState } from 'react'
import { ProductionEntry, RawMaterialEntry } from '@/lib/types'
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
import { BarChart, Bar, CartesianGrid, XAxis, LabelList, YAxis } from 'recharts'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, CalendarDays, Droplet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BloodYieldBarChartProps {
  productionData: ProductionEntry[]
  rawMaterialData: RawMaterialEntry[]
  isMobile?: boolean
  className?: string
}

export function BloodYieldBarChart({
  productionData,
  rawMaterialData,
  isMobile = false,
  className,
}: BloodYieldBarChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    if (!productionData || !rawMaterialData)
      return { chartData: [], chartConfig: {} }

    // Group raw materials (Sangue) by date
    const bloodInputs = new Map<string, number>()
    rawMaterialData.forEach((item) => {
      if (item.type?.toLowerCase() === 'sangue') {
        const dateKey = format(item.date, 'yyyy-MM-dd')
        let qty = item.quantity
        if (item.unit?.toLowerCase().includes('bag')) {
          qty = item.quantity * 1400
        } else if (item.unit?.toLowerCase().includes('ton')) {
          qty = item.quantity * 1000
        }
        bloodInputs.set(dateKey, (bloodInputs.get(dateKey) || 0) + qty)
      }
    })

    // Group production (Blood Meal) by date
    const bloodOutputs = new Map<string, { produced: number; bags: number }>()
    const dates = new Set<string>()

    productionData.forEach((item) => {
      // Prioritize calculation from bags if available
      const producedKg =
        item.bloodMealBags && item.bloodMealBags > 0
          ? item.bloodMealBags * 1400
          : item.bloodMealProduced || 0

      if (producedKg > 0) {
        const dateKey = format(item.date, 'yyyy-MM-dd')
        const current = bloodOutputs.get(dateKey) || { produced: 0, bags: 0 }

        bloodOutputs.set(dateKey, {
          produced: current.produced + producedKg,
          bags: current.bags + (item.bloodMealBags || 0),
        })
        dates.add(dateKey)
      }
    })

    // Add dates from inputs to ensure we cover days with input but no output
    for (const dateKey of bloodInputs.keys()) {
      dates.add(dateKey)
    }

    const processedData = Array.from(dates)
      .map((dateKey) => {
        const input = bloodInputs.get(dateKey) || 0
        const outputData = bloodOutputs.get(dateKey) || { produced: 0, bags: 0 }
        const output = outputData.produced
        const dateObj = new Date(`${dateKey}T12:00:00`)

        return {
          date: format(dateObj, 'dd/MM'),
          fullDate: format(dateObj, "dd 'de' MMMM", { locale: ptBR }),
          originalDate: dateObj,
          yield: input > 0 ? (output / input) * 100 : 0,
          input,
          output,
          bags: outputData.bags,
        }
      })
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

    const config = {
      yield: {
        label: 'Rendimento Sangue',
        color: '#dc2626', // red-600
      },
    } satisfies ChartConfig

    return { chartData: processedData, chartConfig: config }
  }, [productionData, rawMaterialData])

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Rendimentos Diários de Sangue</CardTitle>
          <CardDescription>
            Rendimento calculado sobre Sangue processado (base 1400kg/bag)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de sangue disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={30}
          fontSize={12}
        />
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Data
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data.fullDate}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Rendimento
                      </span>
                      <span className="font-bold text-red-600">
                        {data.yield.toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Bags
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data.bags > 0 ? data.bags : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Produção
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data.output.toLocaleString('pt-BR')} kg
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar
          dataKey="yield"
          fill="var(--color-yield)"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
          name="Rendimento"
        >
          <LabelList
            dataKey="yield"
            position="top"
            formatter={(val: number) =>
              `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
            }
            className="fill-foreground font-bold"
            fontSize={isMobile ? 10 : 12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-red-600" />
            Rendimentos Diários de Sangue
          </CardTitle>
          <CardDescription>
            Rendimento calculado sobre Sangue processado (base 1400kg/bag)
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Rendimentos Diários de Sangue</DialogTitle>
                <DialogDescription>
                  Visualização expandida do rendimento de sangue.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full min-h-0 py-4">
                <ChartContent height="h-full" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 min-h-[300px]">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
