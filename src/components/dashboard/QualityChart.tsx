import { useMemo } from 'react'
import { QualityEntry } from '@/lib/types'
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

interface QualityChartProps {
  data: QualityEntry[]
}

export function QualityChart({ data }: QualityChartProps) {
  const isMobile = useIsMobile()

  const { chartData, chartConfig } = useMemo(() => {
    // Sort chronologically
    const sortedData = [...data].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )

    // Prepare data points
    const processedData = sortedData.map((item) => ({
      ...item,
      formattedDate: format(item.date, 'dd/MM', { locale: ptBR }),
      fullDate: format(item.date, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      // Flatten specific values for the lines
      acidity_Farinha: item.product === 'Farinha' ? item.acidity : null,
      protein_Farinha: item.product === 'Farinha' ? item.protein : null,
      acidity_Farinheta: item.product === 'Farinheta' ? item.acidity : null,
      protein_Farinheta: item.product === 'Farinheta' ? item.protein : null,
    }))

    const config: ChartConfig = {
      acidity_Farinha: {
        label: 'Acidez - Farinha',
        color: 'hsl(var(--chart-1))',
      },
      acidity_Farinheta: {
        label: 'Acidez - Farinheta',
        color: 'hsl(var(--chart-2))',
      },
      protein_Farinha: {
        label: 'Proteína - Farinha',
        color: 'hsl(var(--chart-3))',
      },
      protein_Farinheta: {
        label: 'Proteína - Farinheta',
        color: 'hsl(var(--chart-4))',
      },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Evolução da Qualidade</CardTitle>
          <CardDescription>
            Tendências de Acidez e Proteína (Farinha vs. Farinheta)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível para análise de qualidade.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Evolução da Qualidade</CardTitle>
        <CardDescription>
          Tendências de Acidez e Proteína (Farinha vs. Farinheta)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: isMobile ? 0 : 20,
              bottom: 20,
              left: isMobile ? 0 : 20,
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
            {/* Left Axis for Acidity */}
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={isMobile ? 30 : 40}
              fontSize={isMobile ? 10 : 12}
              label={{
                value: isMobile ? '' : 'Acidez (%)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fontSize: 10,
              }}
            />
            {/* Right Axis for Protein */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={isMobile ? 30 : 40}
              fontSize={isMobile ? 10 : 12}
              label={{
                value: isMobile ? '' : 'Proteína (%)',
                angle: 90,
                position: 'insideRight',
                offset: 10,
                fontSize: 10,
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            {/* Lines - Acidity (Left Axis) */}
            <Line
              yAxisId="left"
              dataKey="acidity_Farinha"
              type="monotone"
              stroke="var(--color-acidity_Farinha)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-acidity_Farinha)' }}
              activeDot={{ r: 6 }}
              connectNulls
            >
              <LabelList
                position="top"
                offset={10}
                className="fill-foreground text-[10px]"
                formatter={(val: number) => val?.toFixed(1)}
              />
            </Line>

            <Line
              yAxisId="left"
              dataKey="acidity_Farinheta"
              type="monotone"
              stroke="var(--color-acidity_Farinheta)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: 'var(--color-acidity_Farinheta)' }}
              activeDot={{ r: 6 }}
              connectNulls
            >
              <LabelList
                position="top"
                offset={10}
                className="fill-foreground text-[10px]"
                formatter={(val: number) => val?.toFixed(1)}
              />
            </Line>

            {/* Lines - Protein (Right Axis) */}
            <Line
              yAxisId="right"
              dataKey="protein_Farinha"
              type="monotone"
              stroke="var(--color-protein_Farinha)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-protein_Farinha)' }}
              activeDot={{ r: 6 }}
              connectNulls
            >
              <LabelList
                position="bottom"
                offset={10}
                className="fill-foreground text-[10px]"
                formatter={(val: number) => val?.toFixed(1)}
              />
            </Line>

            <Line
              yAxisId="right"
              dataKey="protein_Farinheta"
              type="monotone"
              stroke="var(--color-protein_Farinheta)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: 'var(--color-protein_Farinheta)' }}
              activeDot={{ r: 6 }}
              connectNulls
            >
              <LabelList
                position="bottom"
                offset={10}
                className="fill-foreground text-[10px]"
                formatter={(val: number) => val?.toFixed(1)}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
