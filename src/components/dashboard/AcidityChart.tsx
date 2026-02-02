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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2 } from 'lucide-react'

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
      acidity: {
        label: 'Acidez (%)',
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
            Tendência dos valores de Peso e Acidez ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-center">
          Nenhum dado encontrado para o período selecionado
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[300px]' }: { height?: string }) => (
    <ChartContainer
      config={chartConfig}
      className={`aspect-auto ${height} w-full`}
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
        {/* Left Axis for Weight */}
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={isMobile ? 35 : 45}
          fontSize={isMobile ? 10 : 12}
          orientation="left"
        />
        {/* Right Axis for Acidity */}
        <YAxis
          yAxisId="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={isMobile ? 25 : 35}
          fontSize={isMobile ? 10 : 12}
          orientation="right"
          unit="%"
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="left"
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
          yAxisId="right"
          dataKey="acidity"
          type="monotone"
          stroke="var(--color-acidity)"
          strokeWidth={2}
          dot={{
            fill: 'var(--color-acidity)',
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
            formatter={(value: any) => `${Number(value).toFixed(1)}%`}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Evolução das Medições</CardTitle>
          <CardDescription>
            Tendência dos valores de Peso e Acidez ao longo do tempo
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Expandir</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Evolução das Medições</DialogTitle>
              <DialogDescription>
                Visualização detalhada da tendência de peso e acidez.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full min-h-0 py-4">
              <ChartContent height="h-full" />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
