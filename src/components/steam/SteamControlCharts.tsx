import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns'
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts'
import { DatePickerWithRange } from '@/components/DateRangePicker'
import { DateRange } from 'react-day-picker'

export function SteamControlCharts() {
  const { steamControlRecords, production } = useData()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return []

    // Generate dates in range
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })

    return days
      .map((day) => {
        const record = steamControlRecords.find((r) => isSameDay(r.date, day))
        const daysProduction = production.filter((p) => isSameDay(p.date, day))
        const entradaMp = daysProduction.reduce(
          (acc, curr) => acc + curr.mpUsed,
          0,
        )

        const steamConsumption = record
          ? record.meterEnd - record.meterStart
          : 0
        const totalFuel = record
          ? record.soyWaste +
            record.firewood +
            record.riceHusk +
            record.woodChips
          : 0

        // Calculate ratios (avoid div by zero)
        const ratioMpVapor =
          steamConsumption > 0 ? entradaMp / steamConsumption : 0
        const ratioCavacoVapor =
          totalFuel > 0 ? steamConsumption / totalFuel : 0

        return {
          date: format(day, 'dd/MM'),
          fullDate: format(day, "d 'de' MMMM", { locale: ptBR }),
          steamConsumption,
          entradaMp,
          ratioMpVapor: Number(ratioMpVapor.toFixed(2)),
          ratioCavacoVapor: Number(ratioCavacoVapor.toFixed(2)),
          soyWaste: record?.soyWaste || 0,
          firewood: record?.firewood || 0,
          riceHusk: record?.riceHusk || 0,
          woodChips: record?.woodChips || 0,
        }
      })
      .filter((d) => d.steamConsumption > 0 || d.entradaMp > 0) // Hide empty days
  }, [steamControlRecords, production, dateRange])

  // Fuel Data for Bar Chart (Aggregated Totals)
  const fuelData = useMemo(() => {
    const totals = filteredData.reduce(
      (acc, curr) => ({
        soyWaste: acc.soyWaste + curr.soyWaste,
        firewood: acc.firewood + curr.firewood,
        riceHusk: acc.riceHusk + curr.riceHusk,
        woodChips: acc.woodChips + curr.woodChips,
      }),
      { soyWaste: 0, firewood: 0, riceHusk: 0, woodChips: 0 },
    )

    return [
      { name: 'Res. Soja', value: totals.soyWaste, color: '#f59e0b' }, // Amber
      { name: 'Lenha', value: totals.firewood, color: '#854d0e' }, // Brown
      { name: 'Palha Arroz', value: totals.riceHusk, color: '#eab308' }, // Yellow
      { name: 'Cavaco', value: totals.woodChips, color: '#10b981' }, // Emerald
    ].filter((d) => d.value > 0)
  }, [filteredData])

  const consumptionConfig = {
    steamConsumption: {
      label: 'Consumo Vapor (t)',
      color: 'hsl(var(--chart-1))',
    },
    entradaMp: {
      label: 'MP Processada (t)',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  const ratioConfig = {
    ratioMpVapor: {
      label: 'MP vs Vapor',
      color: 'hsl(var(--chart-3))',
    },
    ratioCavacoVapor: {
      label: 'Cavaco vs Vapor',
      color: 'hsl(var(--chart-4))',
    },
  } satisfies ChartConfig

  const fuelConfig = {
    value: {
      label: 'Quantidade',
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DatePickerWithRange
          date={dateRange}
          setDate={setDateRange}
          className="w-[300px]"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Consumption Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Consumo de Vapor x MP</CardTitle>
            <CardDescription>
              Relação diária entre consumo de vapor e entrada de matéria-prima
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={consumptionConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={filteredData}
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="steamConsumption"
                  fill="var(--color-steamConsumption)"
                  radius={[4, 4, 0, 0]}
                  name="Vapor"
                >
                  <LabelList
                    dataKey="steamConsumption"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(val: number) =>
                      val === 0
                        ? ''
                        : val.toLocaleString('pt-BR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                    }
                  />
                </Bar>
                <Bar
                  dataKey="entradaMp"
                  fill="var(--color-entradaMp)"
                  radius={[4, 4, 0, 0]}
                  name="MP Processada"
                >
                  <LabelList
                    dataKey="entradaMp"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(val: number) =>
                      val === 0
                        ? ''
                        : val.toLocaleString('pt-BR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                    }
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Ratios Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de Eficiência</CardTitle>
            <CardDescription>
              Evolução dos índices de produtividade térmica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={ratioConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <BarChart
                data={filteredData}
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
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="ratioMpVapor"
                  fill="var(--color-ratioMpVapor)"
                  radius={[4, 4, 0, 0]}
                  name="MP vs Vapor"
                >
                  <LabelList
                    dataKey="ratioMpVapor"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(val: number) =>
                      val === 0
                        ? ''
                        : val.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                    }
                  />
                </Bar>
                <Bar
                  dataKey="ratioCavacoVapor"
                  fill="var(--color-ratioCavacoVapor)"
                  radius={[4, 4, 0, 0]}
                  name="Cavaco vs Vapor"
                >
                  <LabelList
                    dataKey="ratioCavacoVapor"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(val: number) =>
                      val === 0
                        ? ''
                        : val.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                    }
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Fuel Distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de Combustível</CardTitle>
            <CardDescription>
              Total consumido no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={fuelConfig}
              className="aspect-auto h-full w-full"
            >
              {fuelData.length > 0 ? (
                <BarChart
                  data={fuelData}
                  margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {fuelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={12}
                      formatter={(val: number) =>
                        val.toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })
                      }
                    />
                  </Bar>
                </BarChart>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sem dados de combustível para o período.
                </div>
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
