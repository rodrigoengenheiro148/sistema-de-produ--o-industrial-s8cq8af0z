import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RawMaterialChartVizProps {
  data: any[]
  config: ChartConfig
  isMobile: boolean
  height?: string
  layout?: 'daily' | 'supplier'
}

export function RawMaterialChartViz({
  data,
  config,
  isMobile,
  height = 'h-[350px]',
  layout = 'daily',
}: RawMaterialChartVizProps) {
  const isDaily = layout === 'daily'
  // Get keys from config to stack bars, excluding basic labels
  const dataKeys = Object.keys(config).filter(
    (k) => k !== 'label' && k !== 'color',
  )

  return (
    <ChartContainer config={config} className={`${height} w-full`}>
      <BarChart
        data={data}
        margin={{ top: 20, left: isMobile ? 0 : 20, right: 10, bottom: 0 }}
        layout={!isDaily && isMobile ? 'vertical' : 'horizontal'}
      >
        <CartesianGrid
          vertical={!isDaily && !isMobile}
          horizontal={true}
          strokeDasharray="3 3"
        />

        {/* X Axis Logic */}
        {!isDaily && isMobile ? (
          <XAxis type="number" hide />
        ) : (
          <XAxis
            dataKey={isDaily ? 'displayDate' : 'supplier'}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={30}
            interval={isDaily ? 'preserveStartEnd' : 0}
            fontSize={isMobile ? 10 : 12}
            tickFormatter={(val) => {
              // If there are many items, we might want to skip some ticks handled by minTickGap
              if (isDaily) return val
              // For supplier view, truncate if needed
              return val.length > 10 ? `${val.substring(0, 8)}..` : val
            }}
          />
        )}

        {/* Y Axis Logic */}
        {!isDaily && isMobile ? (
          <YAxis
            dataKey="supplier"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, width: 90 }}
            width={90}
          />
        ) : (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
            fontSize={isMobile ? 10 : 12}
            width={isMobile ? 30 : 40}
          />
        )}

        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          content={
            <ChartTooltipContent
              className="w-auto min-w-[180px]"
              labelFormatter={(value, payload) => {
                if (isDaily && payload[0]?.payload?.fullDate) {
                  return format(payload[0].payload.fullDate, "d 'de' MMMM", {
                    locale: ptBR,
                  })
                }
                return value
              }}
              formatter={(value, name, item) => (
                <div className="flex items-center gap-2 w-full text-xs">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground flex-1">{name}</span>
                  <span className="font-mono font-medium">
                    {Number(value).toLocaleString('pt-BR')} kg
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />

        {dataKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            stackId="a"
            radius={isDaily || !isMobile ? [0, 0, 0, 0] : [0, 4, 4, 0]} // No radius for stacked internal bars usually
            maxBarSize={50}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
