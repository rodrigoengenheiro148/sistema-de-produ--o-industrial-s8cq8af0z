import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Gauge, TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { calculateDailyMetrics } from '@/lib/process-calculations'
import { formatNumber, cn } from '@/lib/utils'
import { format } from 'date-fns'

interface CookingMetricsCardProps {
  date: Date
}

export function CookingMetricsCard({ date }: CookingMetricsCardProps) {
  const { cookingTimeRecords, downtimeRecords, production } = useData()

  // Calculate metrics using the shared utility to get netActiveHours consistently
  const metrics = calculateDailyMetrics(
    date,
    cookingTimeRecords,
    downtimeRecords,
    production,
  )

  // Throughput Calculation Logic:
  // Base Value: 792 tons (fixed daily capacity)
  // Divisor: The duration (total_hours)
  // Formula: 792 / total_hours
  const FIXED_DAILY_CAPACITY = 792
  const throughput =
    metrics.netActiveHours > 0
      ? FIXED_DAILY_CAPACITY / metrics.netActiveHours
      : 0

  const META = 14.125
  const isBelowMeta = throughput < META

  // Format time (e.g., 0h 00m)
  const hours = Math.floor(metrics.netActiveMinutes / 60)
  const minutes = Math.floor(metrics.netActiveMinutes % 60)
  const timeStr = `${hours}h ${String(minutes).padStart(2, '0')}m`

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold uppercase text-muted-foreground/80 tracking-wider">
          TEMPO DE COZIMENTO
        </CardTitle>
        <Clock className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight mt-2 mb-6">
          {timeStr}
        </div>

        <div className="flex items-end justify-between pt-2 border-t">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              REF: {format(date, 'dd/MM')}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatNumber(throughput, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  t/h
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">
              META
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-muted-foreground/80">
                {formatNumber(META, { minimumFractionDigits: 3 })}
              </span>
              {isBelowMeta ? (
                <TrendingDown className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
