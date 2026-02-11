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
  Clock,
  Droplets,
  Bone,
  Wheat,
  Scale,
  Info,
  ArrowRight,
} from 'lucide-react'
import { isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

interface LoadForecastProps {
  referenceDate?: Date
  className?: string
}

export function LoadForecast({ referenceDate, className }: LoadForecastProps) {
  const { rawMaterials, dailyForecasts } = useData()
  const targetDate = referenceDate || new Date()

  // Calculate sum of forecasts for the day
  const dailyForecastTotal = useMemo(() => {
    return dailyForecasts
      .filter((f) => isSameDay(f.date, targetDate))
      .reduce((acc, curr) => acc + curr.mpForecast, 0)
  }, [dailyForecasts, targetDate])

  // If forecasts exist (>0), use them. Otherwise fallback to realized MP.
  const activeMpValue =
    dailyForecastTotal > 0
      ? dailyForecastTotal
      : rawMaterials
          .filter((r) => isSameDay(r.date, targetDate))
          .reduce((acc, curr) => acc + curr.quantity, 0)

  // Constants
  const HOURS_IN_DAY = 24
  // Fixed Machine Limit / Cycle
  const MACHINE_CAPACITY_BAGS_DAY = 96 // 4 bags/h * 24h

  // Fixed Flow Rates (Vazão) per bag type
  const FIXED_FLOW_1450 = 5.8 // t/h
  const FIXED_FLOW_1500 = 6.0 // t/h

  // Yield Factors
  const YIELD_FACTORS = {
    sebo: 0.15, // 15%
    fco: 0.2, // 20%
    farinheta: 0.05, // 5%
  }

  const calculateMetrics = (yieldFactor: number) => {
    // Est. Prod (kg) = MP * Yield Factor
    const estProdKg = activeMpValue * yieldFactor
    const estProdTons = estProdKg / 1000

    // Bags calculation based on ESTIMATED PRODUCTION
    const bags1450 = Math.floor(estProdKg / 1450)
    const bags1500 = Math.floor(estProdKg / 1500)

    return {
      estProdTons,
      bags1450,
      bags1500,
    }
  }

  const forecasts = {
    sebo: calculateMetrics(YIELD_FACTORS.sebo),
    fco: calculateMetrics(YIELD_FACTORS.fco),
    farinheta: calculateMetrics(YIELD_FACTORS.farinheta),
  }

  const ForecastCard = ({
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
      estProdTons: number
      bags1450: number
      bags1500: number
    }
  }) => {
    return (
      <div
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md',
        )}
      >
        {/* Header */}
        <div className={cn('p-4 flex items-center gap-3 border-b', bgClass)}>
          <div
            className={cn('p-2 rounded-full bg-white/90 shadow-sm', colorClass)}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-bold text-base">{title}</span>
        </div>

        <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
          {/* Cadence Section - using FIXED FLOW rates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              Cadência ({HOURS_IN_DAY}H)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 text-center">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Vazão 1450kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {FIXED_FLOW_1450.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    t/h
                  </span>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 text-center">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Vazão 1500kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {FIXED_FLOW_1500.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    t/h
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5 bg-muted/20 py-1.5 rounded-md">
              <Info className="h-3.5 w-3.5" /> Cap. Teórica:{' '}
              <strong>{MACHINE_CAPACITY_BAGS_DAY} bags/dia</strong>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Daily Forecast Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Scale className="h-3.5 w-3.5" />
              Previsão Hoje (Bags)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-md border',
                  bgClass.replace('border-', 'border-opacity-50 '),
                )}
              >
                <span
                  className={cn(
                    'text-2xl font-bold leading-none mb-1.5',
                    colorClass,
                  )}
                >
                  {data.bags1450}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  1450KG
                </span>
              </div>
              <div
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-md border',
                  bgClass.replace('border-', 'border-opacity-50 '),
                )}
              >
                <span
                  className={cn(
                    'text-2xl font-bold leading-none mb-1.5',
                    colorClass,
                  )}
                >
                  {data.bags1500}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  1500KG
                </span>
              </div>
            </div>
            <div className="text-xs text-right text-muted-foreground font-medium mt-1">
              Est. Prod: {data.estProdTons.toFixed(1)}t
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('shadow-sm border-primary/10', className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Planejamento de Produção & Logística</CardTitle>
              <CardDescription>
                Previsão de bags baseada na entrada de matéria-prima do dia
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
            <div className="flex flex-col px-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Previsão Total MP
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono">
                  {activeMpValue.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Link to="/gestao/previsao-mp">
                Gerenciar
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <ForecastCard
            title="Sebo"
            icon={Droplets}
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30"
            data={forecasts.sebo}
          />
          <ForecastCard
            title="Farinha (FCO)"
            icon={Bone}
            colorClass="text-amber-600 dark:text-amber-400"
            bgClass="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30"
            data={forecasts.fco}
          />
          <ForecastCard
            title="Farinheta"
            icon={Wheat}
            colorClass="text-orange-600 dark:text-orange-400"
            bgClass="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30"
            data={forecasts.farinheta}
          />
        </div>
      </CardContent>
    </Card>
  )
}
