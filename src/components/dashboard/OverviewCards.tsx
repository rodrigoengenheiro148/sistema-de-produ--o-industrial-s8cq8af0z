import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Database,
  DollarSign,
  Droplets,
  Bone,
  Wheat,
  Droplet,
  Factory,
  Activity,
  Package,
  Clock,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Scale,
  Undo2,
  FlaskConical,
  Feather,
  Fish,
} from 'lucide-react'
import {
  RawMaterialEntry,
  ProductionEntry,
  ShippingEntry,
  CookingTimeRecord,
  DowntimeRecord,
  NotificationSettings,
  AcidityEntry,
  ReturnEntry,
} from '@/lib/types'
import {
  cn,
  isBloodRecord,
  formatNumber,
  formatCurrency,
  formatPercent,
} from '@/lib/utils'
import { useMemo } from 'react'
import { subDays, isSameDay, format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useData } from '@/context/DataContext'

interface OverviewCardsProps {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  cookingTimeRecords: CookingTimeRecord[]
  downtimeRecords: DowntimeRecord[]
  acidityRecords: AcidityEntry[]
  returns?: ReturnEntry[]
  notificationSettings: NotificationSettings
  fullProductionHistory?: ProductionEntry[]
  fullCookingTimeRecords?: CookingTimeRecord[]
  referenceDate?: Date
}

export function OverviewCards({
  rawMaterials = [],
  production = [],
  shipping = [],
  cookingTimeRecords = [],
  returns = [],
  notificationSettings,
  fullProductionHistory = [],
  fullCookingTimeRecords = [],
  referenceDate,
}: OverviewCardsProps) {
  const { factories, currentFactoryId } = useData()
  const currentFactory = factories.find((f) => f.id === currentFactoryId)
  const isMarReciclagem = currentFactory?.name === 'Mar Reciclagem'

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

    // Additional products for Mar Reciclagem
    const viscerasMealProduced = production.reduce(
      (acc, curr) => acc + (curr.viscerasMealProduced || 0),
      0,
    )
    const featherMealProduced = production.reduce(
      (acc, curr) => acc + (curr.featherMealProduced || 0),
      0,
    )
    const viscerasOilProduced = production.reduce(
      (acc, curr) => acc + (curr.viscerasOilProduced || 0),
      0,
    )

    const totalProduction =
      seboProduced +
      fcoProduced +
      farinhetaProduced +
      bloodMealProduced +
      viscerasMealProduced +
      featherMealProduced +
      viscerasOilProduced

    // 4. Faturamento
    const totalRevenue = shipping.reduce(
      (acc, curr) => acc + curr.quantity * curr.unitPrice,
      0,
    )

    // 5. Total de Devoluções
    const totalReturnsKg = returns.reduce((acc, curr) => acc + curr.quantity, 0)

    // 6, 7, 8. Specific Yields (Industrial Only)
    // Filter out blood records for MP denominator calculation to ensure accurate industrial yield
    const industrialRecords = production.filter((p) => !isBloodRecord(p))
    const mpUsedMainLine = industrialRecords.reduce(
      (acc, curr) => acc + curr.mpUsed,
      0,
    )

    // Numerators must come from industrial records
    const seboProducedIndustrial = industrialRecords.reduce(
      (acc, curr) => acc + curr.seboProduced,
      0,
    )
    const fcoProducedIndustrial = industrialRecords.reduce(
      (acc, curr) => acc + curr.fcoProduced,
      0,
    )
    const farinhetaProducedIndustrial = industrialRecords.reduce(
      (acc, curr) => acc + curr.farinhetaProduced,
      0,
    )

    // Mar Reciclagem Specific Numerators
    const viscerasMealProducedInd = industrialRecords.reduce(
      (acc, curr) => acc + (curr.viscerasMealProduced || 0),
      0,
    )
    const featherMealProducedInd = industrialRecords.reduce(
      (acc, curr) => acc + (curr.featherMealProduced || 0),
      0,
    )
    const viscerasOilProducedInd = industrialRecords.reduce(
      (acc, curr) => acc + (curr.viscerasOilProduced || 0),
      0,
    )

    // Yield Calculations
    const seboYield =
      mpUsedMainLine > 0 ? (seboProducedIndustrial / mpUsedMainLine) * 100 : 0
    const fcoYield =
      mpUsedMainLine > 0 ? (fcoProducedIndustrial / mpUsedMainLine) * 100 : 0
    const farinhetaYield =
      mpUsedMainLine > 0
        ? (farinhetaProducedIndustrial / mpUsedMainLine) * 100
        : 0

    // Specific Yields for Mar Reciclagem
    const farinhaCarneYield = fcoYield // Using FCO logic
    const farinhaViscerasYield =
      mpUsedMainLine > 0 ? (viscerasMealProducedInd / mpUsedMainLine) * 100 : 0
    const farinhaPenasYield =
      mpUsedMainLine > 0 ? (featherMealProducedInd / mpUsedMainLine) * 100 : 0
    const oleoYield =
      mpUsedMainLine > 0 ? (viscerasOilProducedInd / mpUsedMainLine) * 100 : 0

    // 11. Rendimento sangue
    const bloodInputKg = rawMaterials
      .filter((r) => r.type?.toLowerCase() === 'sangue')
      .reduce((acc, curr) => acc + normalizeToKg(curr.quantity, curr.unit), 0)

    const bloodYield =
      bloodInputKg > 0 ? (bloodMealProduced / bloodInputKg) * 100 : 0

    // 12. Tempo de Processos & Efficiency (D-1 Logic)
    // Target Date (D)
    const targetDate = referenceDate || new Date()
    // Previous Date (D-1)
    const previousDate = subDays(targetDate, 1)

    // Filter Production for D-1
    const prevDayProduction = fullProductionHistory.filter(
      (p) => p.date && isValid(p.date) && isSameDay(p.date, previousDate),
    )
    const totalProductionOutputD1 = prevDayProduction.reduce(
      (acc, p) =>
        acc +
        p.seboProduced +
        p.fcoProduced +
        p.farinhetaProduced +
        (p.viscerasMealProduced || 0) +
        (p.featherMealProduced || 0) +
        (p.viscerasOilProduced || 0),
      0,
    )

    // Filter Cooking Time for D-1
    const prevDayCooking = fullCookingTimeRecords.filter(
      (c) => c.date && isValid(c.date) && isSameDay(c.date, previousDate),
    )

    // Calculate total hours for D-1
    let totalHoursD1 = 0
    let totalMinutesD1 = 0

    const recordsWithTotalHours = prevDayCooking.filter(
      (r) => r.totalHours !== undefined && r.totalHours !== null,
    )

    if (recordsWithTotalHours.length > 0) {
      totalHoursD1 = recordsWithTotalHours.reduce(
        (acc, curr) => acc + (curr.totalHours || 0),
        0,
      )
      totalMinutesD1 = totalHoursD1 * 60
    } else {
      totalMinutesD1 = prevDayCooking.reduce((acc, curr) => {
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
      totalHoursD1 = totalMinutesD1 / 60
    }

    const tonPerHourD1 =
      totalHoursD1 > 0 ? totalProductionOutputD1 / 1000 / totalHoursD1 : 0

    const previousDateFormatted = isValid(previousDate)
      ? format(previousDate, 'dd/MM', { locale: ptBR })
      : '--/--'

    // 13. Estimated Weight based on Time
    const totalCookingHoursCurrent = cookingTimeRecords.reduce((acc, curr) => {
      const hours = typeof curr.totalHours === 'number' ? curr.totalHours : 0
      return acc + hours
    }, 0)

    const totalCookingMinutesCurrent = totalCookingHoursCurrent * 60
    const estimatedWeightByTime = totalCookingMinutesCurrent * 0.55

    const currentHours = Math.floor(totalCookingMinutesCurrent / 60)
    const currentMinutes = Math.round(totalCookingMinutesCurrent % 60)
    const processTimeCurrentDisplay = `${currentHours}h ${currentMinutes.toString().padStart(2, '0')}m`

    // 14. Saturated Oil Input
    const saturatedOilInputKg = rawMaterials
      .filter((r) => {
        const type = r.type?.toLowerCase() || ''
        return type === 'óleo saturado' || type === 'oleo saturado'
      })
      .reduce((acc, curr) => acc + normalizeToKg(curr.quantity, curr.unit), 0)

    return {
      rawMaterialInputKg,
      totalProduction,
      totalRevenue,
      totalReturnsKg,
      seboYield,
      fcoYield,
      farinhetaYield,
      farinhaCarneYield,
      farinhaViscerasYield,
      farinhaPenasYield,
      oleoYield,
      bloodInputKg,
      bloodMealProduced,
      bloodYield,
      tonPerHourD1,
      previousDateFormatted,
      estimatedWeightByTime,
      processTimeCurrentDisplay,
      saturatedOilInputKg,
    }
  }, [
    rawMaterials,
    production,
    shipping,
    cookingTimeRecords,
    returns,
    fullProductionHistory,
    fullCookingTimeRecords,
    referenceDate,
  ])

  // Logic for Conditional Styling
  const getYieldStyle = (current: number, threshold: number = 0) => {
    const isBelow = current < threshold

    if (isBelow) {
      return {
        iconColor: 'text-red-600',
        borderColor: 'border-l-red-600',
        textColor: 'text-red-600',
        bgClass: 'bg-red-50/50 dark:bg-red-900/10',
      }
    }

    return {
      iconColor: 'text-emerald-600',
      borderColor: 'border-l-emerald-600',
      textColor: 'text-emerald-600',
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    }
  }

  // Calculate styles for each product
  const seboStyle = getYieldStyle(
    metrics.seboYield,
    notificationSettings?.seboThreshold || 0,
  )
  const fcoStyle = getYieldStyle(
    metrics.fcoYield,
    notificationSettings?.fcoThreshold ||
      notificationSettings?.farinhaThreshold ||
      0,
  )
  const farinhetaStyle = getYieldStyle(
    metrics.farinhetaYield,
    notificationSettings?.farinhetaThreshold || 0,
  )

  const formatCurrencyDisplay = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const formatNumberDisplay = (val: number, suffix = '') => {
    return (
      formatNumber(val, { maximumFractionDigits: 0 }) +
      (suffix ? ` ${suffix}` : '')
    )
  }

  const TARGET_RATE = 14.125

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
        value={formatNumberDisplay(metrics.rawMaterialInputKg, 'kg')}
        icon={Package}
        iconColor="text-orange-500"
        borderColor="border-l-orange-500"
      />

      {/* 2. Produção */}
      <MetricCard
        title="Produção"
        value={formatNumberDisplay(metrics.totalProduction, 'kg')}
        icon={Factory}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
      />

      {/* 12. Tempo de Processos & Estimativa */}
      <MetricCard
        title={`Tempo de Processos`}
        value={metrics.processTimeCurrentDisplay}
        icon={Clock}
        iconColor="text-blue-500"
        borderColor="border-l-blue-500"
      >
        <div className="flex flex-col gap-1 mt-2 mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scale className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Quantidade Estimada
            </span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {formatNumber(metrics.estimatedWeightByTime, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              kg
            </span>
          </span>
        </div>

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Ref: {metrics.previousDateFormatted}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-bold">
                  {formatNumber(metrics.tonPerHourD1, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
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
                  {formatNumber(TARGET_RATE, { minimumFractionDigits: 3 })}
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

      {/* 4. Faturamento */}
      <MetricCard
        title="Faturamento"
        value={formatCurrencyDisplay(metrics.totalRevenue)}
        icon={DollarSign}
        iconColor="text-emerald-600"
        borderColor="border-l-emerald-600"
      />

      {/* Total de Devoluções */}
      <MetricCard
        title="Total de Devoluções"
        value={formatNumberDisplay(metrics.totalReturnsKg, 'kg')}
        icon={Undo2}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
        textColor="text-red-600"
      />

      {/* Saturated Oil Input */}
      <MetricCard
        title="Total de Óleo Saturado Recebido"
        value={formatNumberDisplay(metrics.saturatedOilInputKg, 'kg')}
        icon={FlaskConical}
        iconColor="text-violet-600 dark:text-violet-400"
        borderColor="border-l-violet-600 dark:border-l-violet-400"
      />

      {isMarReciclagem ? (
        <>
          {/* Rendimento de Farinha de Carne */}
          <MetricCard
            title="Rendimento de Farinha de Carne"
            value={formatPercent(metrics.farinhaCarneYield)}
            icon={Bone}
            iconColor="text-emerald-600"
            borderColor="border-l-emerald-600"
            textColor="text-emerald-600"
            className="bg-emerald-50/50 dark:bg-emerald-900/10"
          />
          {/* Rendimento de Farinha de Vísceras */}
          <MetricCard
            title="Rendimento de Farinha de Vísceras"
            value={formatPercent(metrics.farinhaViscerasYield)}
            icon={Fish}
            iconColor="text-blue-600"
            borderColor="border-l-blue-600"
            textColor="text-blue-600"
            className="bg-blue-50/50 dark:bg-blue-900/10"
          />
          {/* Rendimento de Farinha de Penas */}
          <MetricCard
            title="Rendimento de Farinha de Penas"
            value={formatPercent(metrics.farinhaPenasYield)}
            icon={Feather}
            iconColor="text-amber-600"
            borderColor="border-l-amber-600"
            textColor="text-amber-600"
            className="bg-amber-50/50 dark:bg-amber-900/10"
          />
          {/* Rendimento de Sebo */}
          <MetricCard
            title="Rendimento de Sebo"
            value={formatPercent(metrics.seboYield)}
            icon={Droplets}
            iconColor="text-orange-600"
            borderColor="border-l-orange-600"
            textColor="text-orange-600"
            className="bg-orange-50/50 dark:bg-orange-900/10"
          />
          {/* Rendimento de Óleo */}
          <MetricCard
            title="Rendimento de Óleo"
            value={formatPercent(metrics.oleoYield)}
            icon={Droplet}
            iconColor="text-violet-600"
            borderColor="border-l-violet-600"
            textColor="text-violet-600"
            className="bg-violet-50/50 dark:bg-violet-900/10"
          />
        </>
      ) : (
        <>
          {/* 6. Rendimento Sebo - Styled dynamically */}
          <MetricCard
            title="Rendimento Sebo"
            value={formatPercent(metrics.seboYield)}
            icon={Droplets}
            iconColor={seboStyle.iconColor}
            borderColor={seboStyle.borderColor}
            textColor={seboStyle.textColor}
            className={seboStyle.bgClass}
          />

          {/* 7. Rendimento FCO - Styled dynamically */}
          <MetricCard
            title="Rendimento FCO"
            value={formatPercent(metrics.fcoYield)}
            icon={Bone}
            iconColor={fcoStyle.iconColor}
            borderColor={fcoStyle.borderColor}
            textColor={fcoStyle.textColor}
            className={fcoStyle.bgClass}
          />

          {/* 8. Rendimento Farinheta - Styled dynamically */}
          <MetricCard
            title="Rendimento Farinheta"
            value={formatPercent(metrics.farinhetaYield)}
            icon={Wheat}
            iconColor={farinhetaStyle.iconColor}
            borderColor={farinhetaStyle.borderColor}
            textColor={farinhetaStyle.textColor}
            className={farinhetaStyle.bgClass}
          />
        </>
      )}

      {/* 9. Total de entrada de sangue */}
      <MetricCard
        title="Total de entrada de sangue"
        value={formatNumberDisplay(metrics.bloodInputKg, 'kg')}
        icon={Droplet}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
      />

      {/* 10. Total farinha de sangue */}
      <MetricCard
        title="Total farinha de sangue"
        value={formatNumberDisplay(metrics.bloodMealProduced, 'kg')}
        icon={Database}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
      />

      {/* 11. Rendimento sangue */}
      <MetricCard
        title="Rendimento sangue"
        value={formatPercent(metrics.bloodYield)}
        icon={Activity}
        iconColor="text-red-600"
        borderColor="border-l-red-600"
      />
    </div>
  )
}
