import { useData } from '@/context/DataContext'
import {
  calculateDailyMetrics,
  TARGET_HOURLY_RATE,
} from '@/lib/process-calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatNumber } from '@/lib/utils'
import {
  Activity,
  Clock,
  AlertCircle,
  Scale,
  Calendar,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'
import { format } from 'date-fns'

interface ProcessMetricsCardProps {
  date: Date
}

export function ProcessMetricsCard({ date }: ProcessMetricsCardProps) {
  const { production, cookingTimeRecords, downtimeRecords } = useData()

  // Calculate metrics with defensive fallbacks for arrays
  const metrics = calculateDailyMetrics(
    date,
    cookingTimeRecords || [],
    downtimeRecords || [],
    production || [],
  )

  const flowRateDiff = metrics.rateTon - TARGET_HOURLY_RATE
  const isBelowTarget = flowRateDiff < 0

  // Formatters
  const formatTime = (minutes: number) => {
    if (!minutes && minutes !== 0) return '0h 0m'
    const h = Math.floor(minutes / 60)
    const m = Math.floor(minutes % 60)
    return `${h}h ${m}m`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrada de MP</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(metrics.totalConsumption / 1000, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            t
          </div>
          <p className="text-xs text-muted-foreground">
            Matéria-prima processada
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Líquido</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatTime(metrics.netActiveMinutes)}
          </div>
          <p className="text-xs text-muted-foreground">
            Tempo total de cozimento
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paradas</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatTime(metrics.totalDowntimeMinutes)}
          </div>
          <p className="text-xs text-muted-foreground">Tempo perdido total</p>
        </CardContent>
      </Card>

      {/* Main Productivity Card with Updated UI */}
      <Card className="border-l-4 border-l-blue-500 flex flex-col justify-between">
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            <Calendar className="h-3 w-3" />
            REF: {format(date, 'dd/MM')}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-3xl font-bold">
                {formatNumber(metrics.rateTon, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm font-medium text-blue-500">t/h</span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                META
              </span>
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-bold',
                  isBelowTarget ? 'text-destructive' : 'text-green-600',
                )}
              >
                {formatNumber(TARGET_HOURLY_RATE, {
                  minimumFractionDigits: 3,
                })}
                {isBelowTarget ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
