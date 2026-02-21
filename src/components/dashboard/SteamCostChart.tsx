import { useMemo } from 'react'
import { SteamControlEntry } from '@/lib/types'
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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn, formatCurrency } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface SteamCostChartProps {
  data: SteamControlEntry[]
  className?: string
}

export function SteamCostChart({ data, className }: SteamCostChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const dailyMap = new Map<string, number>()

    data.forEach((item) => {
      const dateKey = format(item.date, 'yyyy-MM-dd')
      const cost = (item.weightKg || 0) * (item.value || 0)
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + cost)
    })

    const processedData = Array.from(dailyMap.entries())
      .map(([dateKey, value]) => ({
        date: format(new Date(dateKey), 'dd/MM'),
        fullDate: format(new Date(dateKey), "dd 'de' MMMM", { locale: ptBR }),
        originalDate: new Date(dateKey),
        value,
      }))
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

    const config = {
      value: { label: 'Custo Vapor', color: 'hsl(var(--primary))' },
    } satisfies ChartConfig

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Controle de Vapor (Custos)
          </CardTitle>
          <CardDescription>
            Custo diário de vapor (Peso x Valor unitário)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Controle de Vapor (Custos)
        </CardTitle>
        <CardDescription>
          Custo diário de vapor (Peso x Valor unitário)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={65}
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'BRL',
                }).format(value)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label, payload) =>
                    payload[0]?.payload?.fullDate || label
                  }
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={(val: number) =>
                  val > 0 ? formatCurrency(val) : ''
                }
                className="fill-foreground font-bold"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
