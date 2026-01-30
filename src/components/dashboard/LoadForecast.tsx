import { useMemo } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  CalendarDays,
  Droplets,
  Bone,
  Wheat,
  Clock,
  Info,
  Scale,
} from 'lucide-react'
import {
  isSameDay,
  isSameMonth,
  isSameYear,
  getDaysInMonth,
  getDate,
} from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LoadForecastProps {
  referenceDate?: Date
  className?: string
}

export function LoadForecast({ referenceDate, className }: LoadForecastProps) {
  const { production, rawMaterials, yieldTargets } = useData()
  const targetDate = referenceDate || new Date()

  // Constants
  const BAGS_PER_HOUR = 4 // 1 bag every 15 mins
  const SHIFT_HOURS = 16 // 2 shifts of 8h
  const DAILY_BAG_CAPACITY = BAGS_PER_HOUR * SHIFT_HOURS // 64 bags

  const { forecasts } = useMemo(() => {
    // 1. Daily MP Input (Raw Material for the selected date)
    let dailyMp = rawMaterials
      .filter((r) => isSameDay(r.date, targetDate))
      .reduce((acc, curr) => acc + curr.quantity, 0)

    // Fallback: Check production MP if raw materials not entered but production is
    // This handles scenarios where production is logged directly without raw material entries
    const productionMp = production
      .filter((p) => isSameDay(p.date, targetDate))
      .reduce((acc, curr) => acc + curr.mpUsed, 0)

    if (dailyMp === 0 && productionMp > 0) {
      dailyMp = productionMp
    }

    // 2. Monthly Stats for Projection
    const monthlyStats = {
      sebo: 0,
      fco: 0,
      farinheta: 0,
    }

    // Filter production for current month/year of target date
    const monthProduction = production.filter(
      (p) => isSameMonth(p.date, targetDate) && isSameYear(p.date, targetDate),
    )

    monthProduction.forEach((p) => {
      monthlyStats.sebo += p.seboProduced
      monthlyStats.fco += p.fcoProduced
      monthlyStats.farinheta += p.farinhetaProduced
    })

    // Calculate projection factor
    const daysInMonth = getDaysInMonth(targetDate)
    const dayOfMonth = getDate(targetDate)

    // Simple projection: (Current Total / Days Passed) * Total Days in Month
    // We use Math.max(1, dayOfMonth) to avoid division by zero
    const projectionFactor = daysInMonth / Math.max(1, dayOfMonth)

    const calculateMetrics = (yieldPct: number, monthlyTotal: number) => {
      // Daily Forecast based on Today's MP and Yield Target
      // formula: MP * (Yield / 100)
      const dailyForecastKg = dailyMp * (yieldPct / 100)

      // Monthly Projection based on actuals so far + trend
      // If we are looking at past months (dayOfMonth == daysInMonth), factor is 1 (actuals)
      const monthlyProjectedKg = monthlyTotal * projectionFactor

      return {
        daily: {
          kg: dailyForecastKg,
          bags1450: Math.round(dailyForecastKg / 1450),
          bags1500: Math.round(dailyForecastKg / 1500),
        },
        monthly: {
          kg: monthlyProjectedKg,
          bags1450: Math.round(monthlyProjectedKg / 1450),
          bags1500: Math.round(monthlyProjectedKg / 1500),
        },
      }
    }

    return {
      forecasts: {
        sebo: calculateMetrics(yieldTargets.sebo, monthlyStats.sebo),
        fco: calculateMetrics(yieldTargets.fco, monthlyStats.fco), // FCO (Farinha)
        farinheta: calculateMetrics(
          yieldTargets.farinheta,
          monthlyStats.farinheta,
        ),
      },
    }
  }, [production, rawMaterials, yieldTargets, targetDate])

  const MaterialForecastCard = ({
    title,
    icon: Icon,
    colorClass,
    bgClass,
    data,
  }: {
    title: string
    icon: any
    colorClass: string
    bgClass: string
    data: {
      daily: { kg: number; bags1450: number; bags1500: number }
      monthly: { kg: number; bags1450: number; bags1500: number }
    }
  }) => {
    // Cadence Calculations (Theoretical)
    // Per acceptance criteria: 4 bags/h * weight
    const rate1450 = BAGS_PER_HOUR * 1.45 // t/h
    const rate1500 = BAGS_PER_HOUR * 1.5 // t/h

    return (
      <div
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md',
        )}
      >
        {/* Header */}
        <div className={cn('p-3 flex items-center gap-2 border-b', bgClass)}>
          <div
            className={cn(
              'p-1.5 rounded-full bg-white/90 shadow-sm',
              colorClass,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Cadence Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Cadência (16h)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-muted/40 p-2 rounded border border-border/50 text-center cursor-help transition-colors hover:bg-muted/60">
                      <div className="text-[10px] text-muted-foreground font-medium mb-0.5">
                        Flow 1450kg
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {rate1450.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          t/h
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Base: 4 bags/h (1 a cada 15min)
                      <br />x 1450kg
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-muted/40 p-2 rounded border border-border/50 text-center cursor-help transition-colors hover:bg-muted/60">
                      <div className="text-[10px] text-muted-foreground font-medium mb-0.5">
                        Flow 1500kg
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {rate1500.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          t/h
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Base: 4 bags/h (1 a cada 15min)
                      <br />x 1500kg
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 bg-muted/20 py-1 rounded">
              <Info className="h-3 w-3" /> Cap. Teórica:{' '}
              <strong>{DAILY_BAG_CAPACITY} bags/dia</strong>
            </div>
          </div>

          <Separator />

          {/* Daily Forecast */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Scale className="h-3 w-3" />
              Previsão Hoje (Bags)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center p-2 rounded bg-primary/5 border border-primary/10">
                <span className="text-lg font-bold text-primary leading-none mb-1">
                  {data.daily.bags1450}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                  1450kg
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded bg-primary/5 border border-primary/10">
                <span className="text-lg font-bold text-primary leading-none mb-1">
                  {data.daily.bags1500}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                  1500kg
                </span>
              </div>
            </div>
            <div className="text-[10px] text-right text-muted-foreground">
              Est. Prod: {(data.daily.kg / 1000).toFixed(1)}t
            </div>
          </div>

          <Separator />

          {/* Monthly Forecast */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <CalendarDays className="h-3 w-3" />
              Projeção Mês (Bags)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center p-2 rounded bg-muted/30 border border-border/50">
                <span className="text-lg font-bold text-foreground leading-none mb-1">
                  {data.monthly.bags1450}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                  1450kg
                </span>
              </div>
              <div className="flex flex-col items-center p-2 rounded bg-muted/30 border border-border/50">
                <span className="text-lg font-bold text-foreground leading-none mb-1">
                  {data.monthly.bags1500}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                  1500kg
                </span>
              </div>
            </div>
            <div className="text-[10px] text-right text-muted-foreground">
              Est. Total: {(data.monthly.kg / 1000).toFixed(1)}t
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Previsão de Cargas (Logística)</CardTitle>
            <CardDescription>
              Planejamento de bags e cadência de produção (16h)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <MaterialForecastCard
            title="Sebo"
            icon={Droplets}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50 dark:bg-emerald-900/20"
            data={forecasts.sebo}
          />
          <MaterialForecastCard
            title="Farinha (FCO)"
            icon={Bone}
            colorClass="text-amber-600"
            bgClass="bg-amber-50 dark:bg-amber-900/20"
            data={forecasts.fco}
          />
          <MaterialForecastCard
            title="Farinheta"
            icon={Wheat}
            colorClass="text-orange-600"
            bgClass="bg-orange-50 dark:bg-orange-900/20"
            data={forecasts.farinheta}
          />
        </div>
      </CardContent>
    </Card>
  )
}
