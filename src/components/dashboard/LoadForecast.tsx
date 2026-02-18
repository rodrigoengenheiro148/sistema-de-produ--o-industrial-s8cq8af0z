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
  Droplet,
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
  const { rawMaterials, dailyForecasts, factories, currentFactoryId } =
    useData()
  const targetDate = referenceDate || new Date()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)
  const isFarinorte = currentFactory?.name === 'Farinorte'

  // Calculate sum of forecasts for the day
  // Filter for Main Line vs Blood Line
  const forecastData = useMemo(() => {
    const forecasts = dailyForecasts.filter((f) =>
      isSameDay(f.date, targetDate),
    )

    // Main Line Forecast (Excluding Blood)
    const mainLineForecast = forecasts
      .filter((f) => f.materialType !== 'Sangue')
      .reduce((acc, curr) => acc + curr.mpForecast, 0)

    // Blood Line Forecast
    const bloodForecast = forecasts
      .filter((f) => f.materialType === 'Sangue')
      .reduce((acc, curr) => acc + curr.mpForecast, 0)

    // Fallback to Realized MP if Forecast is 0
    const realizedMain = rawMaterials
      .filter((r) => isSameDay(r.date, targetDate) && r.type !== 'Sangue')
      .reduce((acc, curr) => acc + curr.quantity, 0)

    const realizedBlood = rawMaterials
      .filter((r) => isSameDay(r.date, targetDate) && r.type === 'Sangue')
      .reduce((acc, curr) => acc + curr.quantity, 0)

    return {
      main: mainLineForecast > 0 ? mainLineForecast : realizedMain,
      blood: bloodForecast > 0 ? bloodForecast : realizedBlood,
    }
  }, [dailyForecasts, rawMaterials, targetDate])

  const activeMpValue = forecastData.main
  const activeBloodValue = forecastData.blood

  // Constants
  const HOURS_IN_DAY = 24
  // Fixed Machine Limit / Cycle
  const MACHINE_CAPACITY_BAGS_DAY = 96 // 4 bags/h * 24h

  // Fixed Flow Rates (Vazão) per bag type
  const FIXED_FLOW_1450 = 5.8 // t/h
  const FIXED_FLOW_1500 = 6.0 // t/h

  // Density for Sebo (kg/L)
  const SEBO_DENSITY = 0.9

  // Yield Factors
  const YIELD_FACTORS = {
    sebo: 0.15, // 15%
    fco: 0.2, // 20%
    farinheta: 0.05, // 5%
    sangue: 0.18, // 18% estimated yield for blood
  }

  const calculateMetrics = (yieldFactor: number, inputVal: number) => {
    // Est. Prod (kg) = MP * Yield Factor
    const estProdKg = inputVal * yieldFactor
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
    sebo: calculateMetrics(YIELD_FACTORS.sebo, activeMpValue),
    fco: calculateMetrics(YIELD_FACTORS.fco, activeMpValue),
    farinheta: calculateMetrics(YIELD_FACTORS.farinheta, activeMpValue),
    sangue: calculateMetrics(YIELD_FACTORS.sangue, activeBloodValue),
  }

  const ForecastCard = ({
    title,
    icon: Icon,
    colorClass,
    bgClass,
    data,
    isLiquid = false,
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
    isLiquid?: boolean
  }) => {
    // Calculate liquid metrics if applicable
    const flow1450L = isLiquid ? (FIXED_FLOW_1450 * 1000) / SEBO_DENSITY : 0
    const flow1500L = isLiquid ? (FIXED_FLOW_1500 * 1000) / SEBO_DENSITY : 0

    const unitVol1450 = isLiquid ? 1450 / SEBO_DENSITY : 0
    const unitVol1500 = isLiquid ? 1500 / SEBO_DENSITY : 0

    const totalVolL = isLiquid ? (data.estProdTons * 1000) / SEBO_DENSITY : 0

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
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 text-center flex flex-col justify-center">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Vazão 1450kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {FIXED_FLOW_1450.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    t/h
                  </span>
                </div>
                {isLiquid && (
                  <div className="text-xs font-semibold text-emerald-600 mt-1">
                    {flow1450L.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    L/h
                  </div>
                )}
              </div>
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 text-center flex flex-col justify-center">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Vazão 1500kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {FIXED_FLOW_1500.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    t/h
                  </span>
                </div>
                {isLiquid && (
                  <div className="text-xs font-semibold text-emerald-600 mt-1">
                    {flow1500L.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    L/h
                  </div>
                )}
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
                {isLiquid && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">
                    {unitVol1450.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    L
                  </span>
                )}
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
                {isLiquid && (
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">
                    {unitVol1500.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    L
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-right text-muted-foreground font-medium mt-1">
              Est. Prod: {data.estProdTons.toFixed(1)}t
              {isLiquid && (
                <span className="ml-1 text-emerald-600">
                  (
                  {totalVolL.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  L)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Specialized Card for Blood Meal with simplified metrics
  const BloodForecastCard = ({
    title,
    icon: Icon,
    colorClass,
    bgClass,
    data,
    inputValue,
  }: {
    title: string
    icon: any
    colorClass: string
    bgClass: string
    data: { estProdTons: number; bags1450: number }
    inputValue: number
  }) => {
    // Flow Rate for Blood (Based on Forecast Production / 24h)
    const calculatedFlow = data.estProdTons > 0 ? data.estProdTons / 24 : 0

    return (
      <div
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md',
        )}
      >
        <div className={cn('p-4 flex items-center gap-3 border-b', bgClass)}>
          <div
            className={cn('p-2 rounded-full bg-white/90 shadow-sm', colorClass)}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-bold text-base">{title}</span>
        </div>

        <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-muted/30 p-3 rounded-md border border-border/40 flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Previsão MP
              </span>
              <span className="text-sm font-bold font-mono">
                {(inputValue / 1000).toFixed(1)}t
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 rounded-md bg-muted/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground font-bold uppercase mb-1">
                  Fluxo (t/h)
                </span>
                <span className="text-xl font-bold">
                  {calculatedFlow.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-md bg-muted/20 border border-border/30">
                <span className="text-[10px] text-muted-foreground font-bold uppercase mb-1">
                  Est. Prod (t)
                </span>
                <span className="text-xl font-bold">
                  {data.estProdTons.toFixed(1)}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'p-4 rounded-md border text-center',
                bgClass.replace('border-', 'border-opacity-50 '),
              )}
            >
              <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                Bags Estimados
              </span>
              <span className={cn('text-3xl font-bold', colorClass)}>
                {data.bags1450}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">
                (Base 1400kg)
              </span>
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
              {/* Hide title for Farinorte */}
              {!isFarinorte && (
                <CardTitle>Planejamento de Produção & Logística</CardTitle>
              )}
              <CardDescription>
                Previsão de bags baseada na entrada de matéria-prima do dia
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
            <div className="flex flex-col px-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Previsão Total (Ind.)
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ForecastCard
            title="Sebo"
            icon={Droplets}
            colorClass="text-emerald-600 dark:text-emerald-400"
            bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30"
            data={forecasts.sebo}
            isLiquid={true}
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
          {/* Hide Blood Forecast for Farinorte */}
          {!isFarinorte && (
            <BloodForecastCard
              title="Farinha de Sangue"
              icon={Droplet}
              colorClass="text-red-600 dark:text-red-400"
              bgClass="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30"
              data={forecasts.sangue}
              inputValue={activeBloodValue}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
