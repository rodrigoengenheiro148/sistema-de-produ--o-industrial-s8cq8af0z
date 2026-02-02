import { useData } from '@/context/DataContext'
import { calculateDailyMetrics } from '@/lib/process-calculations'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Activity, Clock, AlertCircle, Scale, Gauge } from 'lucide-react'

interface ProcessMetricsCardProps {
  date: Date
}

export function ProcessMetricsCard({ date }: ProcessMetricsCardProps) {
  const { production, cookingTimeRecords, downtimeRecords } = useData()

  const metrics = calculateDailyMetrics(
    date,
    cookingTimeRecords,
    downtimeRecords,
    production,
  )

  const TARGET_FLOW_RATE = 7.125
  const flowRateDiff = metrics.rateTon - TARGET_FLOW_RATE
  const isBelowTarget = flowRateDiff < 0

  // Formatters
  const formatTime = (minutes: number) => {
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
            {(metrics.totalConsumption / 1000).toFixed(2)} t
          </div>
          <p className="text-xs text-muted-foreground">
            Matéria-prima processada
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Bruto</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatTime(metrics.rawActiveMinutes)}
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

      <Card
        className={cn(
          'border-l-4',
          isBelowTarget ? 'border-l-destructive' : 'border-l-green-500',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vazão Média</CardTitle>
          <Gauge
            className={cn(
              'h-4 w-4',
              isBelowTarget ? 'text-destructive' : 'text-green-500',
            )}
          />
        </CardHeader>
        <CardContent>
          {metrics.netActiveHours > 0 ? (
            <>
              <div className="text-2xl font-bold">
                {metrics.rateTon.toFixed(2)} t/h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta:{' '}
                <span className="font-medium">{TARGET_FLOW_RATE} t/h</span>
                <span
                  className={cn(
                    'ml-2',
                    isBelowTarget ? 'text-destructive' : 'text-green-600',
                  )}
                >
                  ({flowRateDiff > 0 ? '+' : ''}
                  {flowRateDiff.toFixed(2)})
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">
                N/A
              </div>
              <p className="text-xs text-muted-foreground">
                Sem tempo líquido de processo
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
