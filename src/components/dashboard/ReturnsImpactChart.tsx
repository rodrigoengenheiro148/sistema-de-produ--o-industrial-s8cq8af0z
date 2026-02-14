import { useMemo } from 'react'
import { ReturnEntry } from '@/lib/types'
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
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Undo2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface ReturnsImpactChartProps {
  data: ReturnEntry[]
  className?: string
}

export function ReturnsImpactChart({
  data,
  className,
}: ReturnsImpactChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    // Group by date
    const dailyMap = new Map<string, number>()

    data.forEach((item) => {
      const dateKey = format(item.date, 'yyyy-MM-dd')
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + item.value)
    })

    const processedData = Array.from(dailyMap.entries())
      .map(([dateKey, value]) => ({
        date: format(new Date(dateKey), 'dd/MM'),
        fullDate: format(new Date(dateKey), "dd 'de' MMMM", { locale: ptBR }),
        originalDate: new Date(dateKey),
        value: -value, // Negative for impact
      }))
      .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime())

    const config = {
      value: {
        label: 'Valor Devolvido',
        color: 'hsl(var(--destructive))',
      },
    } satisfies ChartConfig

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card className={cn('shadow-sm border-destructive/20', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Undo2 className="h-5 w-5 text-destructive" />
          Impacto de Devoluções
        </CardTitle>
        <CardDescription>
          Valor financeiro das devoluções ao longo do tempo (Negativo)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'BRL',
                }).format(value)
              }
              fontSize={12}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Math.abs(Number(value)))}
                  labelFormatter={(label, payload) =>
                    payload[0]?.payload?.fullDate || label
                  }
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[0, 0, 4, 4]}
              maxBarSize={50}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
