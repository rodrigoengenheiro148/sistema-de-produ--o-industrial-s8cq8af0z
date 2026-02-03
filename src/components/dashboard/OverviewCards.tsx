import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Database,
  DollarSign,
  Droplets,
  Bone,
  Wheat,
  Droplet,
  FlaskConical,
  Factory,
  Activity,
  Package,
  Clock,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Flame,
} from 'lucide-react'
import {
  RawMaterialEntry,
  ProductionEntry,
  ShippingEntry,
  CookingTimeRecord,
  DowntimeRecord,
  NotificationSettings,
  AcidityEntry,
  SteamControlRecord,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { subDays, isSameDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface OverviewCardsProps {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  cookingTimeRecords: CookingTimeRecord[]
  downtimeRecords: DowntimeRecord[]
  acidityRecords: AcidityEntry[]
  steamRecords?: SteamControlRecord[]
  notificationSettings: NotificationSettings
  fullProductionHistory?: ProductionEntry[]
  fullCookingTimeRecords?: CookingTimeRecord[]
  referenceDate?: Date
}

export function OverviewCards({
  rawMaterials,
  production,
  shipping,
  cookingTimeRecords,
  acidityRecords,
  steamRecords = [],
  fullProductionHistory = [],
  fullCookingTimeRecords = [],
  referenceDate,
}: OverviewCardsProps) {
  const metrics = useMemo(() => {
    // Helper to normalize quantity to kg
    const normalizeToKg = (quantity: number, unit?: string) => {
      const u = unit?.toLowerCase() || ''
      if (u.includes('bag')) return quantity * 1400
      if (u.includes('ton')) return quantity * 1000
      return quantity // assuming kg if not specified
    }

    // 1. Entrada MP (Excluding Sangue)
    const rawMaterialInputKg = rawMaterials
      .filter((r) => r.type?.toLowerCase() !== 'sangue')
      .reduce((acc, curr) => acc + normalizeToKg(curr.quantity, curr.unit), 0)

    // 2. Produção (Total including Blood Meal)
    const seboProduced = production.reduce(
      (acc, curr) => acc + curr.seboProduced,
      0,
    )
    const fcoProduced = production.reduce(
      (acc, curr) => acc + curr.fcoProduced,
      0,
    )
    const farinhetaProduced = production.reduce(
      (acc, curr) => acc + curr.farinhetaProduced,
      0,
    )
    // Prioritize calculation from bags if available (1400kg constant)
    const bloodMealProduced = production.reduce(
      (acc, curr) =>
        acc +
        (curr.bloodMealBags && curr.bloodMealBags > 0
          ? curr.bloodMealBags * 1400
          : curr.bloodMealProduced || 0),
      0,
    )

    const totalProduction =
      seboProduced + fcoProduced + farinhetaProduced + bloodMealProduced

    // 3. Rendimento Geral
    const mpUsedMainLine = production.reduce(
      (acc, curr) => acc + curr.mpUsed,
      0,
    )

    const bloodInputKg = rawMaterials
      .filter((r) => r.type?.toLowerCase() === 'sangue')
      .reduce((acc, curr) => acc + normalizeToKg(curr.quantity, curr.unit), 0)

    const totalInput = mpUsedMainLine + bloodInputKg
    const generalYield =
      totalInput > 0 ? (totalProduction / totalInput) * 100 : 0

    // 4. Faturamento
    const totalRevenue = shipping.reduce(
      (acc, curr) => acc + curr.quantity * curr.unitPrice,
      0,
    )

    // 5. Vol. Acidez Analisado
    const totalAcidityVolume = acidityRecords.reduce(
      (acc, curr) => acc + (curr.volume || 0),
      0,
    )

    // 6, 7, 8. Specific Yields
    const seboYield =
      mpUsedMainLine > 0 ? (seboProduced / mpUsedMainLine) * 100 : 0
    const fcoYield =
      mpUsedMainLine > 0 ? (fcoProduced / mpUsedMainLine) * 100 : 0
    const farinhetaYield =
      mpUsedMainLine > 0 ? (farinhetaProduced / mpUsedMainLine) * 100 : 0

    // 11. Rendimento sangue
    const bloodYield =
      bloodInputKg > 0 ? (bloodMealProduced / bloodInputKg) * 100 : 0

    // 12. Tempo de Processos & Efficiency (D-1 Logic)
    // Target Date (D)
    const targetDate = referenceDate || new Date()
    // Previous Date (D-1)
    const previousDate = subDays(targetDate, 1)

    // Filter Production for D-1
    const prevDayProduction = fullProductionHistory.filter((p) =>
      isSameDay(p.date, previousDate),
    )
    const totalProductionKgD1 = prevDayProduction.reduce(
      (acc, p) =>
        acc +
        p.seboProduced +
        p.fcoProduced +
        p.farinhetaProduced +
        (p.bloodMealBags && p.bloodMealBags > 0
          ? p.bloodMealBags * 1400
          : p.bloodMealProduced || 0),
      0,
    )

    // Filter Cooking Time for D-1
    const prevDayCooking = fullCookingTimeRecords.filter((c) =>
      isSameDay(c.date, previousDate),
    )

    const totalMinutesD1 = prevDayCooking.reduce((acc, curr) => {
      if (!curr.startTime || !curr.endTime) return acc
      const toMinutes = (timeStr: string) => {
        const parts = timeStr.split(':')
        if (parts.length < 2) return 0
        return parseInt(parts[0]) * 60 + parseInt(parts[1])
      }

      if (
        typeof curr.startTime === 'string' &&
        typeof curr.endTime === 'string'
      ) {
        const start = toMinutes(curr.startTime)
        const end = toMinutes(curr.endTime)
        let diff = end - start
        if (diff < 0) diff += 24 * 60 // Overnight assumption
        return acc + diff
      }
      return acc
    }, 0)

    const hoursD1 = totalMinutesD1 / 60
    const tonPerHourD1 = hoursD1 > 0 ? totalProductionKgD1 / 1000 / hoursD1 : 0

    const processTimeHours = Math.floor(totalMinutesD1 / 60)
    const processTimeMinutes = Math.round(totalMinutesD1 % 60)
    const processTimeD1Display = `${processTimeHours}h ${processTimeMinutes.toString().padStart(2, '0')}m`
    const previousDateFormatted = format(previousDate, 'dd/MM', {
      locale: ptBR,
    })

    // 13. MPs m³ CAVACO
    const totalSteamAdjusted = steamRecords.reduce((acc, curr) => {
      return (
        acc +
        (curr.soyWaste || 0) +
        (curr.firewood || 0) +
        (curr.riceHusk || 0) +
        (curr.woodChips || 0)
      )
    }, 0)

    const mpPerSteam =
      totalSteamAdjusted > 0 ? rawMaterialInputKg / totalSteamAdjusted : 0

    return {
      rawMaterialInputKg,
      totalProduction,
      generalYield,
      totalRevenue,
      totalAcidityVolume,
      seboYield,
      fcoYield,
      farinhetaYield,
      bloodInputKg,
      bloodMealProduced,
      bloodYield,
      processTimeD1Display,
      tonPerHourD1,
      previousDateFormatted,
      mpPerSteam,
      totalSteamAdjusted,
    }
  }, [
    rawMaterials,
    production,
    shipping,
    acidityRecords,
    steamRecords,
    fullProductionHistory,
    fullCookingTimeRecords,
    referenceDate,
  ])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const formatNumber = (val: number, suffix = '') => {
    return (
      val.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) +
      (suffix ? ` ${suffix}` : '')
    )
  }

  const formatPercentage = (val: number) => {
    return (
      val.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + '%'
    )
  }

  const formatDecimal = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  const TARGET_RATE = 14.125

  // Reusable Card Component
  const MetricCard = ({
    title,
    value,
    icon: Icon,
    iconColor = 'text-muted-foreground',
    borderColor = 'border-l-transparent',
    textColor = 'text-foreground',
    className,
    children,
  }: {
    title: string
    value: string
    icon: any
    iconColor?: string
    borderColor?: string
    textColor?: string
    className?: string
    children?: React.ReactNode
  }) => (
    <Card className={cn('shadow-sm border-l-4', borderColor, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={cn('text-2xl font-bold', textColor)}>{value}</div>
        {children}
      </CardContent>
    </Card>
  )

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* 1. Entrada MP */}
      <MetricCard
        title="Entrada MP"
        value={formatNumber(metrics.rawMaterialInputKg, 'kg')}
        icon={Package}
        iconColor="text-orange-500"
        borderColor="border-l-orange-500"
      />

      {/* 2. Produção */}
      <MetricCard
        title="Produção"
        value={formatNumber(metrics.totalProduction, 'kg')}
        icon={Factory}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
      />

      {/* 12. Tempo de Processos (D-1) */}
      <MetricCard
        title={`Tempo de Processos`}
        value={metrics.processTimeD1Display}
        icon={Clock}
        iconColor="text-blue-500"
        borderColor="border-l-blue-500"
      >
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Ref: {metrics.previousDateFormatted}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-bold">
                  {metrics.tonPerHourD1.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    t/h
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                Meta
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {TARGET_RATE}
                </span>
                {metrics.tonPerHourD1 >= TARGET_RATE ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </MetricCard>

      {/* 13. MPs m³ CAVACO (Efficiency) */}
      <MetricCard
        title="MPs m³ CAVACO"
        value={
          metrics.totalSteamAdjusted > 0
            ? formatDecimal(metrics.mpPerSteam)
            : '-'
        }
        icon={Flame}
        iconColor="text-amber-500"
        borderColor="border-l-amber-500"
      />

      {/* 3. Rendimento Geral */}
      <MetricCard
        title="Rendimento Geral"
        value={formatPercentage(metrics.generalYield)}
        icon={Activity}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
      />

      {/* 4. Faturamento */}
      <MetricCard
        title="Faturamento"
        value={formatCurrency(metrics.totalRevenue)}
        icon={DollarSign}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
      />

      {/* 5. Vol. Acidez Analisado */}
      <MetricCard
        title="Vol. Acidez Analisado"
        value={formatNumber(metrics.totalAcidityVolume, 'L')}
        icon={FlaskConical}
        iconColor="text-blue-500"
        borderColor="border-l-blue-500"
      />

      {/* 6. Rendimento Sebo */}
      <MetricCard
        title="Rendimento Sebo"
        value={formatPercentage(metrics.seboYield)}
        icon={Droplets}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
        textColor="text-emerald-600"
      />

      {/* 7. Rendimento FCO */}
      <MetricCard
        title="Rendimento FCO"
        value={formatPercentage(metrics.fcoYield)}
        icon={Bone}
        iconColor="text-orange-500"
        borderColor="border-l-orange-500"
        textColor="text-emerald-600"
      />

      {/* 8. Rendimento Farinheta */}
      <MetricCard
        title="Rendimento Farinheta"
        value={formatPercentage(metrics.farinhetaYield)}
        icon={Wheat}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
        textColor="text-red-600"
      />

      {/* 9. Total de entrada de sangue */}
      <MetricCard
        title="Total de entrada de sangue"
        value={formatNumber(metrics.bloodInputKg, 'kg')}
        icon={Droplet}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
      />

      {/* 10. Total farinha de sangue */}
      <MetricCard
        title="Total farinha de sangue"
        value={formatNumber(metrics.bloodMealProduced, 'kg')}
        icon={Database}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
      />

      {/* 11. Rendimento sangue */}
      <MetricCard
        title="Rendimento sangue"
        value={formatPercentage(metrics.bloodYield)}
        icon={Activity}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
      />
    </div>
  )
}
