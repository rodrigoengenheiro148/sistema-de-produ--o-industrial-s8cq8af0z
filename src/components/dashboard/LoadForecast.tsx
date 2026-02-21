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
  const { rawMaterials, dailyForecasts } = useData()
  const targetDate = referenceDate || new Date()

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

  // Fixed Flow Rates (Vazão) per bag type (Ton/h)
  const FIXED_FLOW_1450 = 5.8
  const FIXED_FLOW_1500 = 6.0

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
    const bags1400 = Math.floor(estProdKg / 1400) // For blood
    const bags1450 = Math.floor(estProdKg / 1450)
    const bags1500 = Math.floor(estProdKg / 1500)

    return {
      estProdTons,
      bags1400,
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
    headerBgClass,
    data,
    bagSizes,
    flowRates,
    isLiquid = false,
  }: {
    title: string
    icon: any
    colorClass: string
    bgClass: string
    headerBgClass: string
    data: {
      estProdTons: number
      bags1: number
      bags2: number
    }
    bagSizes: [number, number]
    flowRates: [number, number]
    isLiquid?: boolean
  }) => {
    const isSingleBagSize = bagSizes[0] === bagSizes[1]

    // Calculate liquid metrics if applicable
    const flow1L = isLiquid ? (flowRates[0] * 1000) / SEBO_DENSITY : 0
    const flow2L = isLiquid ? (flowRates[1] * 1000) / SEBO_DENSITY : 0

    const totalVolL = isLiquid ? (data.estProdTons * 1000) / SEBO_DENSITY : 0

    return (
      <div
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md h-full',
        )}
      >
        {/* Header */}
        <div className={cn('p-4 flex items-center gap-3', headerBgClass)}>
          <div
            className={cn('p-2 rounded-full bg-white shadow-sm', colorClass)}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-bold text-base text-[#111827]">{title}</span>
        </div>

        <div className="p-5 space-y-6 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-center bg-background p-3 rounded-md border shadow-sm">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Est. Prod (Hoje)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {data.estProdTons.toFixed(1)}t
              </span>
              {isLiquid && (
                <span className="text-xs font-semibold text-emerald-600">
                  (
                  {totalVolL.toLocaleString('pt-BR', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  L)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              Cadência (kg/h)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  'bg-background p-3 rounded-md border text-center flex flex-col justify-center shadow-sm',
                  isSingleBagSize && 'col-span-2',
                )}
              >
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Vazão {bagSizes[0]}kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {(flowRates[0] * 1000).toFixed(0)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    kg/h
                  </span>
                </div>
                {isLiquid && (
                  <div className="text-xs font-semibold text-emerald-600 mt-1">
                    {flow1L.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    L/h
                  </div>
                )}
              </div>
              {!isSingleBagSize && (
                <div className="bg-background p-3 rounded-md border text-center flex flex-col justify-center shadow-sm">
                  <div className="text-[11px] text-muted-foreground font-medium mb-1">
                    Vazão {bagSizes[1]}kg
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {(flowRates[1] * 1000).toFixed(0)}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      kg/h
                    </span>
                  </div>
                  {isLiquid && (
                    <div className="text-xs font-semibold text-emerald-600 mt-1">
                      {flow2L.toLocaleString('pt-BR', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      L/h
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="opacity-50 my-2" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Scale className="h-3.5 w-3.5" />
              Previsão 7 Dias (Bags)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-md border shadow-sm',
                  bgClass,
                  isSingleBagSize && 'col-span-2',
                )}
              >
                <span
                  className={cn(
                    'text-2xl font-bold leading-none mb-1.5',
                    colorClass,
                  )}
                >
                  {data.bags1 * 7}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  {bagSizes[0]}KG
                </span>
              </div>
              {!isSingleBagSize && (
                <div
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-md border shadow-sm',
                    bgClass,
                  )}
                >
                  <span
                    className={cn(
                      'text-2xl font-bold leading-none mb-1.5',
                      colorClass,
                    )}
                  >
                    {data.bags2 * 7}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                    {bagSizes[1]}KG
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('shadow-sm border-border', className)}>
      <CardHeader className="pb-6 border-b border-border/40 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-[#166534]" />
            <div>
              <CardTitle className="text-xl">
                Planejamento de Produção & Logística
              </CardTitle>
              <CardDescription>
                Previsão de bags baseada na entrada de matéria-prima do dia
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
            <div className="flex flex-col px-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Previsão Total (Ind.)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-foreground">
                  {activeMpValue.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  kg
                </span>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-transparent hover:border-border bg-white shadow-sm"
            >
              <Link to="/gestao/previsao-mp">
                Gerenciar
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          <ForecastCard
            title="Sebo"
            icon={Droplets}
            colorClass="text-emerald-600"
            bgClass="bg-[#eefcf2]/50 border-[#d1fadf]"
            headerBgClass="bg-[#eefcf2] border-b border-[#d1fadf]"
            data={{
              estProdTons: forecasts.sebo.estProdTons,
              bags1: forecasts.sebo.bags1450,
              bags2: forecasts.sebo.bags1500,
            }}
            bagSizes={[1450, 1500]}
            flowRates={[FIXED_FLOW_1450, FIXED_FLOW_1500]}
            isLiquid={true}
          />
          <ForecastCard
            title="Farinha (FCO)"
            icon={Bone}
            colorClass="text-amber-600"
            bgClass="bg-[#fffbeb]/50 border-[#fef3c7]"
            headerBgClass="bg-[#fffbeb] border-b border-[#fef3c7]"
            data={{
              estProdTons: forecasts.fco.estProdTons,
              bags1: forecasts.fco.bags1450,
              bags2: forecasts.fco.bags1500,
            }}
            bagSizes={[1450, 1500]}
            flowRates={[FIXED_FLOW_1450, FIXED_FLOW_1500]}
          />
          <ForecastCard
            title="Farinheta"
            icon={Wheat}
            colorClass="text-orange-600"
            bgClass="bg-[#fff7ed]/50 border-[#ffedd5]"
            headerBgClass="bg-[#fff7ed] border-b border-[#ffedd5]"
            data={{
              estProdTons: forecasts.farinheta.estProdTons,
              bags1: forecasts.farinheta.bags1450,
              bags2: forecasts.farinheta.bags1500,
            }}
            bagSizes={[1450, 1500]}
            flowRates={[FIXED_FLOW_1450, FIXED_FLOW_1500]}
          />
          <ForecastCard
            title="Farinha de Sangue"
            icon={Droplet}
            colorClass="text-red-600"
            bgClass="bg-[#fff1f2] border-[#ffe4e6]"
            headerBgClass="bg-[#fff1f2] border-b border-[#ffe4e6]"
            data={{
              estProdTons: forecasts.sangue.estProdTons,
              bags1: forecasts.sangue.bags1400,
              bags2: forecasts.sangue.bags1400,
            }}
            bagSizes={[1400, 1400]}
            flowRates={[5.8, 5.8]}
          />
        </div>
      </CardContent>
    </Card>
  )
}
