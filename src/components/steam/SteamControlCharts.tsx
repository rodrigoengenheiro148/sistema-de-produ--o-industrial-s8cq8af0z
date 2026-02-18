import { useMemo, useState } from 'react'
import { useData } from '@/context/DataContext'
import { format, subDays, eachDayOfInterval } from 'date-fns'
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
import { SteamControlEntry } from '@/lib/types'
import { isBloodRecord, formatCurrency, formatNumber } from '@/lib/utils'

export function SteamControlCharts() {
  const { steamControlRecords, production, factories, currentFactoryId } =
    useData()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const currentFactory = useMemo(
    () => factories.find((f) => f.id === currentFactoryId),
    [factories, currentFactoryId],
  )
  const isFarinorte =
    currentFactory?.name.toLowerCase().includes('farinorte') ?? false

  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return []

    // Pre-calculate production totals from PRODUCTION table
    // Uses Entrada de MP (mpUsed) for Steam Control calculations
    // Filter out blood records (secondary processing)
    const prodMap = new Map<string, number>()
    production.forEach((p) => {
      if (!isBloodRecord(p)) {
        const key = format(p.date, 'yyyy-MM-dd')
        prodMap.set(key, (prodMap.get(key) || 0) + Number(p.mpUsed || 0))
      }
    })

    // Pre-calculate steam records map (aggregating if multiple per day)
    const steamMap = new Map<string, SteamControlEntry[]>()
    steamControlRecords.forEach((r) => {
      const key = format(r.date, 'yyyy-MM-dd')
      const list = steamMap.get(key) || []
      list.push(r)
      steamMap.set(key, list)
    })

    // Generate dates in range
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })

    return days
      .map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const entradaMp = prodMap.get(dateKey) || 0

        const daySteamRecords = steamMap.get(dateKey) || []

        let steamConsumption = 0
        let soyWaste = 0
        let firewood = 0
        let riceHusk = 0
        let woodChips = 0
        // Farinorte Specific
        let weightKg = 0
        let packageCount = 0
        let volumeM3 = 0
        let totalCost = 0

        daySteamRecords.forEach((r) => {
          steamConsumption += r.meterEnd - r.meterStart
          soyWaste += r.soyWaste
          firewood += r.firewood
          riceHusk += r.riceHusk
          woodChips += r.woodChips
          weightKg += r.weightKg || 0
          packageCount += r.packageCount || 0
          volumeM3 += r.volumeM3 || 0
          totalCost += (r.weightKg || 0) * (r.value || 0)
        })

        // Calculate ratios (avoid div by zero)
        const totalFuel = soyWaste + firewood + riceHusk + woodChips
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
          soyWaste,
          firewood,
          riceHusk,
          woodChips,
          // Farinorte
          weightKg,
          packageCount,
          volumeM3,
          totalCost,
        }
      })
      .filter((d) =>
        isFarinorte
          ? d.weightKg > 0 || d.packageCount > 0 || d.volumeM3 > 0
          : d.steamConsumption > 0 || d.entradaMp > 0,
      )
  }, [steamControlRecords, production, dateRange, isFarinorte])

  // Fuel Data for Bar Chart (Aggregated Totals) - Standard Mode
  const fuelData = useMemo(() => {
    if (isFarinorte) return []

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
  }, [filteredData, isFarinorte])

  const consumptionConfig = {
    steamConsumption: {
      label: 'Consumo Vapor (t)',
      color: 'hsl(var(--chart-1))',
    },
    entradaMp: {
      label: 'Entrada de MP (t)',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig

  const ratioConfig = {
    ratioMpVapor: {
      label: 'Entrada MP vs Vapor',
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

  const farinorteConfig = {
    weightKg: { label: 'Peso (Kg)', color: 'hsl(var(--chart-1))' },
    packageCount: { label: 'Pacotes', color: 'hsl(var(--chart-2))' },
    volumeM3: { label: 'Volume (m³)', color: 'hsl(var(--chart-3))' },
  } satisfies ChartConfig

  const costConfig = {
    totalCost: { label: 'Custo Total', color: 'hsl(var(--chart-4))' },
  } satisfies ChartConfig

  if (isFarinorte) {
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
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Entradas Diárias</CardTitle>
              <CardDescription>
                Acompanhamento de Kg, Pacotes e Volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={farinorteConfig}
                className="aspect-auto h-[400px] w-full"
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
                    dataKey="weightKg"
                    fill="var(--color-weightKg)"
                    radius={[4, 4, 0, 0]}
                    name="Peso (Kg)"
                  >
                    <LabelList
                      dataKey="weightKg"
                      position="top"
                      offset={10}
                      className="fill-foreground font-bold"
                      fontSize={10}
                      formatter={(val: number) =>
                        formatNumber(val, { maximumFractionDigits: 0 })
                      }
                    />
                  </Bar>
                  <Bar
                    dataKey="packageCount"
                    fill="var(--color-packageCount)"
                    radius={[4, 4, 0, 0]}
                    name="Pacotes"
                  >
                    <LabelList
                      dataKey="packageCount"
                      position="top"
                      offset={10}
                      className="fill-foreground font-bold"
                      fontSize={10}
                      formatter={(val: number) =>
                        formatNumber(val, { maximumFractionDigits: 0 })
                      }
                    />
                  </Bar>
                  <Bar
                    dataKey="volumeM3"
                    fill="var(--color-volumeM3)"
                    radius={[4, 4, 0, 0]}
                    name="Volume (m³)"
                  >
                    <LabelList
                      dataKey="volumeM3"
                      position="top"
                      offset={10}
                      className="fill-foreground font-bold"
                      fontSize={10}
                      formatter={(val: number) =>
                        formatNumber(val, { maximumFractionDigits: 0 })
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Custo Total de Vapor (R$)</CardTitle>
              <CardDescription>
                Valor financeiro diário baseado no peso e valor unitário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={costConfig}
                className="aspect-auto h-[350px] w-full"
              >
                <BarChart
                  data={filteredData}
                  margin={{ top: 30, right: 0, left: 0, bottom: 0 }}
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
                    tickFormatter={(value) =>
                      formatNumber(value, {
                        notation: 'compact',
                        compactDisplay: 'short',
                      })
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="totalCost"
                    fill="var(--color-totalCost)"
                    radius={[4, 4, 0, 0]}
                    name="Valor em Reais"
                  >
                    <LabelList
                      dataKey="totalCost"
                      position="top"
                      offset={10}
                      className="fill-foreground font-bold"
                      fontSize={11}
                      formatter={(val: number) =>
                        formatNumber(val, {
                          maximumFractionDigits: 0,
                          style: 'currency',
                          currency: 'BRL',
                        })
                      }
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
                  name="Entrada de MP"
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
                  name="Entrada MP vs Vapor"
                  // Note: Removed LabelList for ratios to avoid clutter as per usual preference unless requested
                />
                <Bar
                  dataKey="ratioCavacoVapor"
                  fill="var(--color-ratioCavacoVapor)"
                  radius={[4, 4, 0, 0]}
                  name="Cavaco vs Vapor"
                />
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
