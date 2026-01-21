import { useMemo } from 'react'
import { AcidityEntry } from '@/lib/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useIsMobile } from '@/hooks/use-mobile'

interface AcidityChartProps {
  data: AcidityEntry[]
}

export function AcidityChart({ data }: AcidityChartProps) {
  const isMobile = useIsMobile()

  const { chartData, chartConfig } = useMemo(() => {
    // Sort data chronologically (oldest to newest)
    const sortedData = [...data]
      .sort((a, b) => {
        // Create full date objects for comparison including time
        const dateA = new Date(a.date)
        const [hA, mA] = a.time.split(':').map(Number)
        dateA.setHours(hA || 0, mA || 0)

        const dateB = new Date(b.date)
        const [hB, mB] = b.time.split(':').map(Number)
        dateB.setHours(hB || 0, mB || 0)

        return dateA.getTime() - dateB.getTime()
      })
      .map((item) => {
        const d = new Date(item.date)
        const [h, m] = item.time.split(':').map(Number)
        d.setHours(h || 0, m || 0)
        return {
          ...item,
          formattedDate: format(d, 'dd/MM HH:mm', { locale: ptBR }),
        }
      })

    const config: ChartConfig = {
      weight: {
        label: 'Peso (kg)',
        color: 'hsl(var(--chart-1))',
      },
      volume: {
        label: 'Volume (L)',
        color: 'hsl(var(--chart-2))',
      },
    }

    return { chartData: sortedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Evolução das Medições</CardTitle>
          <CardDescription>
            Tendência dos valores de Peso e Volume ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de acidez disponível.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Evolução das Medições</CardTitle>
        <CardDescription>
          Tendência dos valores de Peso e Volume ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 24,
              left: isMobile ? 0 : 12,
              right: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={isMobile ? 10 : 12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={isMobile ? 30 : 40}
              fontSize={isMobile ? 10 : 12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="weight"
              type="monotone"
              stroke="var(--color-weight)"
              strokeWidth={2}
              dot={{
                fill: 'var(--color-weight)',
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground font-medium"
                fontSize={isMobile ? 9 : 12}
              />
            </Line>
            <Line
              dataKey="volume"
              type="monotone"
              stroke="var(--color-volume)"
              strokeWidth={2}
              dot={{
                fill: 'var(--color-volume)',
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground font-medium"
                fontSize={isMobile ? 9 : 12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
