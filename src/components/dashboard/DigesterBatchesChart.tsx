import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts'
import { Layers } from 'lucide-react'
import { DigesterRecord } from '@/lib/types'

export function DigesterBatchesChart({
  data,
  className,
}: {
  data: DigesterRecord[]
  className?: string
}) {
  const chartData = useMemo(() => {
    const digesters = ['Dig 1', 'Dig 2', 'Dig 3', 'Dig 4', 'Dig 5']
    return digesters.map((d) => {
      const count = data.filter((r) => r.digesterName === d).length
      return { digester: d, batches: count }
    })
  }, [data])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-5 w-5 text-indigo-500" />
          Bateladas por Digestor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ batches: { label: 'Bateladas', color: '#6366f1' } }}
          className="h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="digester" tickLine={false} axisLine={false} />
            <YAxis hide />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="batches"
              fill="var(--color-batches)"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            >
              <LabelList
                dataKey="batches"
                position="top"
                className="fill-foreground font-bold"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
