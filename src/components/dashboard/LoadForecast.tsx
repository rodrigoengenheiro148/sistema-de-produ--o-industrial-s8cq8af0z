import { useMemo, useState, useEffect } from 'react'
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
  Edit2,
  Check,
  Save,
} from 'lucide-react'
import { isSameDay, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface LoadForecastProps {
  referenceDate?: Date
  className?: string
}

export function LoadForecast({ referenceDate, className }: LoadForecastProps) {
  const { rawMaterials, dailyForecasts, saveDailyForecast } = useData()
  const { toast } = useToast()
  const targetDate = referenceDate || new Date()

  const [forecastInput, setForecastInput] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Find existing forecast for the day
  const existingForecast = useMemo(() => {
    return dailyForecasts.find((f) => isSameDay(f.date, targetDate))
  }, [dailyForecasts, targetDate])

  // Initialize input when date or data changes
  useEffect(() => {
    if (existingForecast) {
      setForecastInput(String(existingForecast.mpForecast))
    } else {
      // Fallback: If no forecast, optionally sum today's realized MP, but usually forecasts are set manually.
      // We will leave it empty or 0 if no record exists to encourage input.
      setForecastInput('')
    }
  }, [existingForecast, targetDate])

  const handleSaveForecast = async () => {
    setIsLoading(true)
    const val = parseFloat(forecastInput)
    if (isNaN(val) || val < 0) {
      toast({
        title: 'Valor inválido',
        description:
          'Por favor, insira um valor numérico válido para a previsão.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      await saveDailyForecast(targetDate, val)
      toast({
        title: 'Previsão atualizada',
        description: 'A previsão de entrada foi salva com sucesso.',
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a previsão.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // --- Calculations ---

  // If we have a forecast, use it. Otherwise, fallback to sum of raw materials (realized) or 0.
  // The requirement emphasizes "based on the raw material input", which refers to the forecast input field.
  const activeMpValue = existingForecast
    ? existingForecast.mpForecast
    : rawMaterials
        .filter((r) => isSameDay(r.date, targetDate))
        .reduce((acc, curr) => acc + curr.quantity, 0) // Fallback to realized if forecast missing

  // Constants (Fixed as per AC)
  const HOURS_IN_DAY = 24
  // Theoretical Capacity: Fixed machine limit (4 bags/h * 24h = 96 bags/day)
  // Or dynamic based on flow? AC says: "Dynamic ... theoretical capacity (bags/day) ... based on input".
  // However, "Theoretical" usually implies a limit. But "Capacidade Teórica" in context of planning often means "Projected Capacity Usage".
  // Let's stick to the visual: "Cap. Teórica: 64 bags/dia" was for 16h (4*16).
  // For 24h, it should be 96 bags/dia (4*24) if it's a machine constant.
  // BUT, if it must be dynamic based on input, it would be identical to "Previsão Hoje".
  // I will use the constant 96 as it represents the machine throughput limit per day.
  const MACHINE_CAPACITY_BAGS_DAY = 4 * 24 // 96

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

    // Flow (t/h) = Est Prod (t) / 24h
    // AC: "These values should be calculated by taking the estimated production ... divided by 24."
    const flowTh = estProdTons / HOURS_IN_DAY

    // Bag counts (Math.floor or round? Usually planning implies distinct bags)
    // "Previsão Hoje (Bags)"
    const bags1450 = Math.floor(estProdKg / 1450)
    const bags1500 = Math.floor(estProdKg / 1500)

    return {
      estProdTons,
      flowTh,
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
      flowTh: number
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
          {/* Cadence Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              Cadência ({HOURS_IN_DAY}H)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 text-center">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Flow 1450kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {data.flowTh.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    t/h
                  </span>
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-md border border-border/40 text-center">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">
                  Flow 1500kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {data.flowTh.toFixed(2)}{' '}
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

          {/* Operational Input Section */}
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
            <div className="flex flex-col px-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Previsão de entrada de MP
              </span>
              <div className="flex items-baseline gap-1">
                {isEditing ? (
                  <Input
                    type="number"
                    value={forecastInput}
                    onChange={(e) => setForecastInput(e.target.value)}
                    className="h-7 w-32 text-sm px-2 py-1"
                    placeholder="0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveForecast()
                      if (e.key === 'Escape') {
                        setIsEditing(false)
                        setForecastInput(
                          existingForecast
                            ? String(existingForecast.mpForecast)
                            : '',
                        )
                      }
                    }}
                  />
                ) : (
                  <span className="text-lg font-bold font-mono">
                    {activeMpValue.toLocaleString('pt-BR')}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
            </div>

            {isEditing ? (
              <Button
                size="sm"
                className="h-7 w-7"
                onClick={handleSaveForecast}
                disabled={isLoading}
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
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
