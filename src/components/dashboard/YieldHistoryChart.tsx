import { useMemo, useState } from 'react'
import { ProductionEntry } from '@/lib/types'
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
  ChartLegend,
  ChartLegendContent,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Maximize2, CalendarDays, CalendarRange, Filter } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface YieldHistoryChartProps {
  data: ProductionEntry[]
  isMobile?: boolean
  className?: string
}

export function YieldHistoryChart({
  data,
  isMobile = false,
  className,
}: YieldHistoryChartProps) {
  const [timeScale, setTimeScale] = useState<'daily' | 'monthly'>('daily')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    'sebo',
    'fco',
    'farinheta',
  ])

  const { chartData, chartConfig } = useMemo(() => {
    let processedData: any[] = []

    if (timeScale === 'daily') {
      processedData = data
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((p) => ({
          date: format(p.date, 'dd/MM'),
          fullDate: p.date,
          sebo: p.mpUsed > 0 ? (p.seboProduced / p.mpUsed) * 100 : 0,
          fco: p.mpUsed > 0 ? (p.fcoProduced / p.mpUsed) * 100 : 0,
          farinheta: p.mpUsed > 0 ? (p.farinhetaProduced / p.mpUsed) * 100 : 0,
        }))
    } else {
      // Monthly Aggregation
      const monthlyData = new Map<string, any>()

      // Sort data first to ensure chronological order when processing
      const sortedData = [...data].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      )

      sortedData.forEach((p) => {
        const monthKey = format(p.date, 'yyyy-MM')
        const displayDate = format(p.date, 'MMM/yy', { locale: ptBR })

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            monthKey,
            date: displayDate, // Use formatted month as display date
            mpUsed: 0,
            seboProduced: 0,
            fcoProduced: 0,
            farinhetaProduced: 0,
          })
        }

        const entry = monthlyData.get(monthKey)
        entry.mpUsed += p.mpUsed
        entry.seboProduced += p.seboProduced
        entry.fcoProduced += p.fcoProduced
        entry.farinhetaProduced += p.farinhetaProduced
      })

      processedData = Array.from(monthlyData.values()).map((entry) => ({
        date: entry.date,
        sebo: entry.mpUsed > 0 ? (entry.seboProduced / entry.mpUsed) * 100 : 0,
        fco: entry.mpUsed > 0 ? (entry.fcoProduced / entry.mpUsed) * 100 : 0,
        farinheta:
          entry.mpUsed > 0 ? (entry.farinhetaProduced / entry.mpUsed) * 100 : 0,
      }))
    }

    const config: ChartConfig = {
      sebo: { label: 'Sebo', color: 'hsl(var(--chart-1))' },
      fco: { label: 'FCO', color: 'hsl(var(--chart-2))' },
      farinheta: { label: 'Farinheta', color: 'hsl(var(--chart-3))' },
    }

    return { chartData: processedData, chartConfig: config }
  }, [data, timeScale])

  if (!data || data.length === 0) {
    return (
      <Card className={cn('shadow-sm border-primary/10', className)}>
        <CardHeader>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>Evolução percentual dos rendimentos</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de rendimento disponível.
        </CardContent>
      </Card>
    )
  }

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(product)) {
        // Prevent unselecting all
        if (prev.length === 1) return prev
        return prev.filter((p) => p !== product)
      }
      return [...prev, product]
    })
  }

  const ChartContent = ({ height = 'h-[350px]' }: { height?: string }) => (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={30}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {selectedProducts.includes('sebo') && (
          <Line
            type="monotone"
            dataKey="sebo"
            stroke="var(--color-sebo)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--color-sebo)' }}
            activeDot={{ r: 6 }}
          >
            {timeScale === 'monthly' && (
              <LabelList
                position="top"
                offset={12}
                fill="var(--color-sebo)"
                fontSize={isMobile ? 9 : 12}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
            )}
          </Line>
        )}
        {selectedProducts.includes('fco') && (
          <Line
            type="monotone"
            dataKey="fco"
            stroke="var(--color-fco)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--color-fco)' }}
            activeDot={{ r: 6 }}
          >
            {timeScale === 'monthly' && (
              <LabelList
                position="top"
                offset={12}
                fill="var(--color-fco)"
                fontSize={isMobile ? 9 : 12}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
            )}
          </Line>
        )}
        {selectedProducts.includes('farinheta') && (
          <Line
            type="monotone"
            dataKey="farinheta"
            stroke="var(--color-farinheta)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--color-farinheta)' }}
            activeDot={{ r: 6 }}
          >
            {timeScale === 'monthly' && (
              <LabelList
                position="top"
                offset={12}
                fill="var(--color-farinheta)"
                fontSize={isMobile ? 9 : 12}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
            )}
          </Line>
        )}
      </LineChart>
    </ChartContainer>
  )

  return (
    <Card
      className={cn('shadow-sm border-primary/10 flex flex-col', className)}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 gap-4">
        <div>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>
            Evolução percentual dos rendimentos (
            {timeScale === 'daily' ? 'Diário' : 'Mensal'})
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Time Scale Toggle */}
          <div className="bg-muted/50 p-1 rounded-md flex items-center">
            <Button
              variant={timeScale === 'daily' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeScale('daily')}
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              Dia
            </Button>
            <Button
              variant={timeScale === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeScale('monthly')}
            >
              <CalendarRange className="h-3.5 w-3.5 mr-1" />
              Mês
            </Button>
          </div>

          {/* Product Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filtrar Produtos</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar Produtos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedProducts.includes('sebo')}
                onCheckedChange={() => toggleProduct('sebo')}
              >
                Sebo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedProducts.includes('fco')}
                onCheckedChange={() => toggleProduct('fco')}
              >
                FCO (Farinha)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedProducts.includes('farinheta')}
                onCheckedChange={() => toggleProduct('farinheta')}
              >
                Farinheta
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Expandir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Histórico de Rendimentos</DialogTitle>
                <DialogDescription>
                  Visualização detalhada dos rendimentos.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full min-h-0 py-4">
                <ChartContent height="h-full" />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        <ChartContent />
      </CardContent>
    </Card>
  )
}
