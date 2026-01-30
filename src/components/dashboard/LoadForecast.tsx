import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Calendar,
  CalendarDays,
  Droplets,
  Bone,
  Wheat,
} from 'lucide-react'
import { isSameDay, isSameMonth, isSameYear } from 'date-fns'
import { cn } from '@/lib/utils'

interface LoadForecastProps {
  referenceDate?: Date
  className?: string
}

export function LoadForecast({ referenceDate, className }: LoadForecastProps) {
  const { production } = useData()
  const targetDate = referenceDate || new Date()

  const { daily, monthly } = useMemo(() => {
    const dailyStats = {
      sebo: { produced: 0, mp: 0 },
      fco: { produced: 0, mp: 0 },
      farinheta: { produced: 0, mp: 0 },
    }
    const monthlyStats = {
      sebo: { produced: 0, mp: 0 },
      fco: { produced: 0, mp: 0 },
      farinheta: { produced: 0, mp: 0 },
    }

    production.forEach((p) => {
      const pDate = p.date // Date object from context mapData

      // Check Monthly (Same Month and Year)
      if (isSameMonth(pDate, targetDate) && isSameYear(pDate, targetDate)) {
        monthlyStats.sebo.produced += p.seboProduced
        monthlyStats.sebo.mp += p.mpUsed
        monthlyStats.fco.produced += p.fcoProduced
        monthlyStats.fco.mp += p.mpUsed
        monthlyStats.farinheta.produced += p.farinhetaProduced
        monthlyStats.farinheta.mp += p.mpUsed

        // Check Daily (Same Day)
        if (isSameDay(pDate, targetDate)) {
          dailyStats.sebo.produced += p.seboProduced
          dailyStats.sebo.mp += p.mpUsed
          dailyStats.fco.produced += p.fcoProduced
          dailyStats.fco.mp += p.mpUsed
          dailyStats.farinheta.produced += p.farinhetaProduced
          dailyStats.farinheta.mp += p.mpUsed
        }
      }
    })

    return { daily: dailyStats, monthly: monthlyStats }
  }, [production, targetDate])

  const formatNumber = (val: number) =>
    val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatInteger = (val: number) =>
    val.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })

  const calculateYield = (produced: number, mp: number) =>
    mp > 0 ? (produced / mp) * 100 : 0

  const ForecastCard = ({
    title,
    icon: Icon,
    colorClass,
    dailyData,
    monthlyData,
  }: {
    title: string
    icon: any
    colorClass: string
    dailyData: { produced: number; mp: number }
    monthlyData: { produced: number; mp: number }
  }) => {
    const dailyYield = calculateYield(dailyData.produced, dailyData.mp)

    // Daily Bags (Rounded to nearest integer)
    const dailyBags1450 = Math.round(dailyData.produced / 1450)
    const dailyBags1500 = Math.round(dailyData.produced / 1500)

    // Monthly Bags (Raw number for formatting)
    const monthlyBags1450 = monthlyData.produced / 1450
    const monthlyBags1500 = monthlyData.produced / 1500

    return (
      <Card className="shadow-sm border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={cn('h-4 w-4', colorClass)} />
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Daily Forecast */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className={cn('h-3.5 w-3.5', colorClass)} />
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-tight">
                PREVISÃO DIÁRIA (BAGS)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border bg-card p-3 text-center shadow-sm">
                <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                  Bag 1450kg
                </div>
                <div className="text-xl font-bold tracking-tight">
                  {dailyBags1450}
                </div>
              </div>
              <div className="rounded border bg-card p-3 text-center shadow-sm">
                <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                  Bag 1500kg
                </div>
                <div className="text-xl font-bold tracking-tight">
                  {dailyBags1500}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-center text-muted-foreground">
              Prod. Estimada:{' '}
              <span className="font-medium text-foreground">
                {formatNumber(dailyData.produced)} kg
              </span>
              <span className="mx-1.5">•</span>
              Rendimento:{' '}
              <span className="font-medium text-foreground">
                {dailyYield.toFixed(2)}%
              </span>
            </div>
          </div>

          <Separator />

          {/* Monthly Forecast */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className={cn('h-3.5 w-3.5', colorClass)} />
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-tight">
                PREVISÃO MENSAL (CARGAS/BAGS)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border bg-card p-3 text-center shadow-sm">
                <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                  Bag 1450kg
                </div>
                <div className="text-xl font-bold tracking-tight">
                  {formatInteger(monthlyBags1450)}
                </div>
              </div>
              <div className="rounded border bg-card p-3 text-center shadow-sm">
                <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                  Bag 1500kg
                </div>
                <div className="text-xl font-bold tracking-tight">
                  {formatInteger(monthlyBags1500)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>Previsão de Cargas (Bags)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <ForecastCard
            title="Sebo"
            icon={Droplets}
            colorClass="text-emerald-600"
            dailyData={daily.sebo}
            monthlyData={monthly.sebo}
          />
          <ForecastCard
            title="FCO / Farinha"
            icon={Bone}
            colorClass="text-amber-500"
            dailyData={daily.fco}
            monthlyData={monthly.fco}
          />
          <ForecastCard
            title="Farinheta"
            icon={Wheat}
            colorClass="text-emerald-600"
            dailyData={daily.farinheta}
            monthlyData={monthly.farinheta}
          />
        </div>
      </CardContent>
    </Card>
  )
}
