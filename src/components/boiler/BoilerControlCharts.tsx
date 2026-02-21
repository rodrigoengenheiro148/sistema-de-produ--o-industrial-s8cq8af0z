import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import { format, getMonth, getYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatNumber } from '@/lib/utils'

export function BoilerControlCharts() {
  const { boilerControlRecords } = useData()

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(currentDate),
  )
  const [selectedYear, setSelectedYear] = useState<number>(getYear(currentDate))

  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i)

  const chartData = useMemo(() => {
    const records = boilerControlRecords
      .filter(
        (r) =>
          getMonth(r.date) === selectedMonth &&
          getYear(r.date) === selectedYear,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return records.map((record) => {
      const consumoTotal = record.cald01M3 + record.cald02M3
      return {
        date: format(record.date, 'dd/MM'),
        fullDate: format(record.date, "dd 'de' MMMM", { locale: ptBR }),
        consumoTotal,
        entradaTotal: record.woodEntryM3,
      }
    })
  }, [boilerControlRecords, selectedMonth, selectedYear])

  const chartConfig = {
    consumoTotal: {
      label: 'Consumo (m³)',
      color: 'hsl(var(--chart-1))', // Primary
    },
    entradaTotal: {
      label: 'Entrada (m³)',
      color: 'hsl(var(--chart-2))', // Emerald or secondary
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Select
          value={selectedMonth.toString()}
          onValueChange={(val) => setSelectedMonth(Number(val))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, idx) => (
              <SelectItem key={idx} value={idx.toString()}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resíduo Madeira Consumo x Entrada</CardTitle>
          <CardDescription>
            Comparativo diário de consumo das caldeiras e entrada de lenha em m³
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[450px] w-full"
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
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="fullDate"
                      formatter={(value, name, item, index) => (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                name === 'Consumo (m³)'
                                  ? chartConfig.consumoTotal.color
                                  : chartConfig.entradaTotal.color,
                            }}
                          />
                          <span className="font-medium text-muted-foreground">
                            {name}:
                          </span>
                          <span className="font-bold">
                            {formatNumber(Number(value))} m³
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="consumoTotal"
                  fill="var(--color-consumoTotal)"
                  radius={[4, 4, 0, 0]}
                  name="Consumo (m³)"
                >
                  <LabelList
                    dataKey="consumoTotal"
                    position="top"
                    offset={10}
                    className="fill-foreground font-bold"
                    fontSize={11}
                    formatter={(val: number) =>
                      val > 0
                        ? formatNumber(val, { maximumFractionDigits: 1 })
                        : ''
                    }
                  />
                </Bar>
                <Bar
                  dataKey="entradaTotal"
                  fill="var(--color-entradaTotal)"
                  radius={[4, 4, 0, 0]}
                  name="Entrada (m³)"
                >
                  <LabelList
                    dataKey="entradaTotal"
                    position="top"
                    offset={10}
                    className="fill-foreground font-bold"
                    fontSize={11}
                    formatter={(val: number) =>
                      val > 0
                        ? formatNumber(val, { maximumFractionDigits: 1 })
                        : ''
                    }
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[400px] items-center justify-center border border-dashed rounded-md">
              <p className="text-muted-foreground">
                Nenhum dado registrado para o período selecionado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
