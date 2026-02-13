import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Gauge, TrendingDown, TrendingUp } from 'lucide-react'
import { formatDuration } from '@/lib/process-calculations'
import { cn } from '@/lib/utils'

interface CookingMetricsCardProps {
  cookingTimeMinutes?: number
  throughput?: number
  targetThroughput?: number
  referenceDate?: Date
  className?: string
}

export function CookingMetricsCard({
  cookingTimeMinutes = 0,
  throughput = 0,
  targetThroughput = 14.125,
  referenceDate = new Date(),
  className,
}: CookingMetricsCardProps) {
  const isBelowTarget = throughput < targetThroughput

  return (
    <Card className={cn('bg-white', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Tempo de Cozimento
        </CardTitle>
        <Clock className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">
          {formatDuration(cookingTimeMinutes)}
        </div>

        <div className="mt-4 flex items-end justify-between border-t pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-3 w-3" />
              REF:{' '}
              {referenceDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-lg text-slate-700">
              <Gauge className="h-4 w-4" />
              {throughput.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs text-muted-foreground font-medium self-end mb-1">
                t/h
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Meta
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-slate-600">
              {targetThroughput.toLocaleString('pt-BR', {
                minimumFractionDigits: 3,
              })}
              {isBelowTarget ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
