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
} from 'lucide-react'
import {
  RawMaterialEntry,
  ProductionEntry,
  ShippingEntry,
  CookingTimeRecord,
  DowntimeRecord,
  NotificationSettings,
  AcidityEntry,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface OverviewCardsProps {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  cookingTimeRecords: CookingTimeRecord[]
  downtimeRecords: DowntimeRecord[]
  acidityRecords: AcidityEntry[]
  notificationSettings: NotificationSettings
}

export function OverviewCards({
  rawMaterials,
  production,
  shipping,
  acidityRecords,
}: OverviewCardsProps) {
  const metrics = useMemo(() => {
    // Helper to normalize quantity to kg
    const normalizeToKg = (quantity: number, unit?: string) => {
      const u = unit?.toLowerCase() || ''
      if (u.includes('bag')) return quantity * 1400
      if (u.includes('ton')) return quantity * 1000
      return quantity // assuming kg if not specified or liters for liquid (roughly 1:1 for simplicity in general view, but MP is usually mass)
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
    const bloodMealProduced = production.reduce(
      (acc, curr) => acc + (curr.bloodMealProduced || 0),
      0,
    )
    const totalProduction =
      seboProduced + fcoProduced + farinhetaProduced + bloodMealProduced

    // 3. Rendimento Geral
    // Defined as: Total Production Output / Total Raw Material Used
    // MP Used (from production table) corresponds to Main Line (Sebo/FCO/Farinheta)
    const mpUsedMainLine = production.reduce(
      (acc, curr) => acc + curr.mpUsed,
      0,
    )

    // Blood Input (from Raw Materials) corresponds to Blood Line
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

    // 9. Total de entrada de sangue (Calculated above as bloodInputKg)

    // 10. Total farinha de sangue (Calculated above as bloodMealProduced)

    // 11. Rendimento sangue
    const bloodYield =
      bloodInputKg > 0 ? (bloodMealProduced / bloodInputKg) * 100 : 0

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
    }
  }, [rawMaterials, production, shipping, acidityRecords])

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
    return val.toFixed(2) + '%'
  }

  // Reusable Card Component
  const MetricCard = ({
    title,
    value,
    icon: Icon,
    iconColor = 'text-muted-foreground',
    borderColor = 'border-l-transparent',
    textColor = 'text-foreground',
    className,
  }: {
    title: string
    value: string
    icon: any
    iconColor?: string
    borderColor?: string
    textColor?: string
    className?: string
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
        textColor="text-red-600" // As shown in image for lower percentages sometimes, or keep consistent
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
        icon={Database} // Using generic db icon or can reuse Droplet
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
