import { useMemo } from 'react'
import { ShippingEntry } from '@/lib/types'
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

interface RevenueChartProps {
  data: ShippingEntry[]
  isMobile?: boolean
  className?: string
}

export function RevenueChart({
  data,
  isMobile = false,
  className,
}: RevenueChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const revenueMap = new Map<string, number>()
    data.forEach((s) => {
      const key = format(s.date, 'dd/MM')
      revenueMap.set(key, (revenueMap.get(key) || 0) + s.quantity * s.unitPrice)
    })
    const processedData = Array.from(revenueMap.entries())
      .map(([date, value]) => ({ date, revenue: value }))
      .sort((a, b) => {
        const [da, ma] = a.date.split('/').map(Number)
        const [db, mb] = b.date.split('/').map(Number)
        return ma - mb || da - db
      })

    const config: ChartConfig = {
      revenue: { label: 'Faturamento', color: 'hsl(var(--primary))' },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <Card className={`shadow-sm border-primary/10 ${className}`}>
        <CardHeader>
          <CardTitle>Faturamento Diário</CardTitle>
          <CardDescription>
            Receita consolidada por dia de expedição
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de faturamento disponível.
        </CardContent>
      </Card>
    )
  }

  const ChartContent = ({ height = 'h-[250px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart data={chartData} margin={{ top: 20 }}>
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
          width={isMobile ? 35 : 60}
          tickFormatter={(value) => `R$${value / 1000}k`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(value))
              }
            />
          }
        />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="revenue"
            position="top"
            offset={12}
            className="fill-foreground"
            fontSize={isMobile ? 10 : 12}
            formatter={(value: any) =>
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: isMobile ? 'compact' : 'standard',
              }).format(Number(value))
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )

  return (
    <Card className={`shadow-sm border-primary/10 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Faturamento Diário</CardTitle>
          <CardDescription>
            Receita consolidada por dia de expedição
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
              <DialogTitle>Faturamento Diário</DialogTitle>
              <DialogDescription>
                Visualização detalhada da receita diária.
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
