import { Maximize2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LabelList } from 'recharts'
import { cn } from '@/lib/utils'

export interface BarConfig {
  dataKey: string
  name?: string
  fill?: string
}

interface SteamChartCardProps {
  title: string
  description: string
  data: any[]
  config: ChartConfig
  bars: BarConfig[]
  onExpand?: () => void
  showLegend?: boolean
  className?: string
  chartHeight?: string
  hideHeader?: boolean
}

export function SteamChartCard({
  title,
  description,
  data,
  config,
  bars,
  onExpand,
  showLegend = false,
  className,
  chartHeight = 'h-[300px]',
  hideHeader = false,
}: SteamChartCardProps) {
  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toFixed(0)
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      {!hideHeader && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExpand}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">Expandir</span>
            </Button>
          )}
        </CardHeader>
      )}
      <CardContent className={cn('flex-1 min-h-0', hideHeader ? 'pt-6' : '')}>
        <ChartContainer config={config} className={cn('w-full', chartHeight)}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {showLegend && <ChartLegend content={<ChartLegendContent />} />}
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.fill || `var(--color-${bar.dataKey})`}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey={bar.dataKey}
                  position="top"
                  formatter={formatNumber}
                  className="fill-foreground text-xs"
                />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
