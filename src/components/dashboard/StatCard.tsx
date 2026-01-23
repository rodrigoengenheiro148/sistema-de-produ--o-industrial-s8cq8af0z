import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  prevValue: number
  unit?: string
  icon: any
  details?: string
}

export function StatCard({
  title,
  value,
  prevValue,
  unit = '',
  icon: Icon,
  details,
}: StatCardProps) {
  const diff = value - prevValue
  const percentDiff = prevValue !== 0 ? (diff / prevValue) * 100 : 0
  const isPositive = diff > 0
  const isNeutral = diff === 0

  return (
    <Card className="shadow-sm border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="text-2xl font-bold">
          {value.toFixed(2)}
          {unit}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {!isNeutral ? (
            <span
              className={cn(
                'flex items-center font-medium mr-2',
                isPositive ? 'text-green-600' : 'text-red-600',
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(percentDiff).toFixed(1)}%
            </span>
          ) : (
            <span className="flex items-center font-medium mr-2 text-slate-500">
              <Minus className="h-3 w-3 mr-1" /> 0%
            </span>
          )}
          vs. anterior
        </div>
        {details && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            {details}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
