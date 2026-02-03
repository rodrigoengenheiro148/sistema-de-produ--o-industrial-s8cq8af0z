import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Database,
  TrendingUp,
  PieChart,
  DollarSign,
  Droplets,
  Bone,
  Wheat,
  Droplet,
  Activity,
} from 'lucide-react'
import {
  RawMaterialEntry,
  ProductionEntry,
  ShippingEntry,
  CookingTimeRecord,
  DowntimeRecord,
  NotificationSettings,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { useMemo, useState, useEffect } from 'react'
import { ProductivityCard } from './ProductivityCard'

interface OverviewCardsProps {
  rawMaterials: RawMaterialEntry[]
  production: ProductionEntry[]
  shipping: ShippingEntry[]
  cookingTimeRecords: CookingTimeRecord[]
  downtimeRecords: DowntimeRecord[]
  notificationSettings: NotificationSettings
}

export function OverviewCards({
  rawMaterials,
  production,
  shipping,
  cookingTimeRecords,
  downtimeRecords,
  notificationSettings,
}: OverviewCardsProps) {
  // We keep 'now' here only for other cards if needed
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const metrics = useMemo(() => {
    // 1. Entrada MP (Total Raw Material) - Based on Production MP Used as per AC
    const totalMpProcessed = production.reduce(
      (acc, curr) => acc + curr.mpUsed,
      0,
    )

    // 2. Produção (Total Production)
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

    // 3. Faturamento
    const totalRevenue = shipping.reduce(
      (acc, curr) => acc + curr.quantity * curr.unitPrice,
      0,
    )

    // 4. Yields (Rendimentos)
    const seboYield =
      totalMpProcessed > 0 ? (seboProduced / totalMpProcessed) * 100 : 0
    const fcoYield =
      totalMpProcessed > 0 ? (fcoProduced / totalMpProcessed) * 100 : 0
    const farinhetaYield =
      totalMpProcessed > 0 ? (farinhetaProduced / totalMpProcessed) * 100 : 0

    // General Yield (Excluding Blood for main line efficiency)
    const generalYield =
      totalMpProcessed > 0
        ? ((seboProduced + fcoProduced + farinhetaProduced) /
            totalMpProcessed) *
          100
        : 0

    // 5. Blood Metrics
    // Calculate Blood Input from Raw Materials with Unit Conversion
    const bloodInputTotal = rawMaterials
      .filter((r) => r.type?.toLowerCase() === 'sangue')
      .reduce((acc, curr) => {
        let qty = curr.quantity
        const unit = curr.unit?.toLowerCase() || ''

        // Conversion logic per AC
        if (unit.includes('bag')) {
          qty = qty * 1400
        }
        // If unit is kg or ton (assuming input is normalized or explicit 'kg')
        // The AC says: "If unit is 'kg', use the value directly."
        // We also handle 'ton' just in case to be safe based on previous logic, but strictly following AC for Bag/Kg
        else if (unit.includes('ton')) {
          qty = qty * 1000
        }

        return acc + qty
      }, 0)

    const bloodYield =
      bloodInputTotal > 0 ? (bloodMealProduced / bloodInputTotal) * 100 : 0

    return {
      totalMpProcessed,
      totalProduction,
      seboProduced,
      fcoProduced,
      farinhetaProduced,
      bloodMealProduced,
      totalRevenue,
      seboYield,
      fcoYield,
      farinhetaYield,
      generalYield,
      bloodInputTotal,
      bloodYield,
    }
  }, [rawMaterials, production, shipping])

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `R$ ${(val / 1000000).toFixed(2)} mi`
    }
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(2)} k`
    }
    return `R$ ${val.toFixed(2)}`
  }

  const formatNumber = (val: number) => {
    return val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }

  // Helper function to determine text color based on threshold
  const getYieldColor = (
    yieldValue: number,
    threshold: number | undefined | null,
  ) => {
    if (threshold === null || threshold === undefined || threshold === 0) {
      return 'text-foreground'
    }
    if (yieldValue >= threshold) {
      return 'text-green-600'
    }
    return 'text-red-600'
  }

  // Resolve thresholds
  const seboThreshold = notificationSettings.seboThreshold
  const fcoThreshold =
    notificationSettings.fcoThreshold ||
    notificationSettings.farinhaThreshold ||
    0
  const farinhetaThreshold = notificationSettings.farinhetaThreshold

  // Reusable Summary Card Component
  const MetricCard = ({
    title,
    value,
    unit = '',
    icon: Icon,
    iconColor = 'text-muted-foreground',
    borderColor = 'border-l-transparent',
    valueColor = 'text-foreground',
    subValue,
  }: {
    title: string
    value: string | number
    unit?: string
    icon: any
    iconColor?: string
    borderColor?: string
    valueColor?: string
    subValue?: React.ReactNode
  }) => (
    <Card className={cn('shadow-sm border-l-4', borderColor)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={cn('text-2xl font-bold', valueColor)}>
          {value}{' '}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        {subValue && <div className="mt-1">{subValue}</div>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Section 1: Entrada de Matéria-Prima */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Entrada de Matéria-Prima
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Matéria-Prima"
            value={formatNumber(metrics.totalMpProcessed)}
            unit="kg"
            icon={Database}
            iconColor="text-yellow-500"
            borderColor="border-l-yellow-500"
            subValue={
              <span className="text-xs text-muted-foreground">
                Baseado em MP Processada
              </span>
            }
          />
          <MetricCard
            title="Total Entrada de Sangue"
            value={formatNumber(metrics.bloodInputTotal)}
            unit="kg"
            icon={Droplet}
            iconColor="text-red-600"
            borderColor="border-l-red-600"
          />
        </div>
      </section>

      {/* Section 2: Produção */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Produção
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Sebo"
            value={formatNumber(metrics.seboProduced)}
            unit="kg"
            icon={Droplets}
            iconColor="text-emerald-500"
            borderColor="border-l-emerald-500"
          />
          <MetricCard
            title="Total FCO"
            value={formatNumber(metrics.fcoProduced)}
            unit="kg"
            icon={Bone}
            iconColor="text-amber-600"
            borderColor="border-l-amber-600"
          />
          <MetricCard
            title="Total Farinheta"
            value={formatNumber(metrics.farinhetaProduced)}
            unit="kg"
            icon={Wheat}
            iconColor="text-orange-500"
            borderColor="border-l-orange-500"
          />
          <MetricCard
            title="Total Farinha de Sangue"
            value={formatNumber(metrics.bloodMealProduced)}
            unit="kg"
            icon={Droplet}
            iconColor="text-red-500"
            borderColor="border-l-red-500"
          />

          {/* Included Faturamento & Productivity here to keep dashboard complete within sections */}
          <MetricCard
            title="Faturamento Estimado"
            value={formatCurrency(metrics.totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600"
            borderColor="border-l-green-600"
          />

          <ProductivityCard className="border-l-4 border-l-blue-500 shadow-sm" />
        </div>
      </section>

      {/* Section 3: Rendimentos */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Rendimentos
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Rendimento Sebo"
            value={metrics.seboYield.toFixed(2)}
            unit="%"
            icon={Droplets}
            valueColor={getYieldColor(metrics.seboYield, seboThreshold)}
            borderColor="border-l-slate-200 dark:border-l-slate-800"
          />
          <MetricCard
            title="Rendimento FCO"
            value={metrics.fcoYield.toFixed(2)}
            unit="%"
            icon={Bone}
            valueColor={getYieldColor(metrics.fcoYield, fcoThreshold)}
            borderColor="border-l-slate-200 dark:border-l-slate-800"
          />
          <MetricCard
            title="Rendimento Farinheta"
            value={metrics.farinhetaYield.toFixed(2)}
            unit="%"
            icon={Wheat}
            valueColor={getYieldColor(
              metrics.farinhetaYield,
              farinhetaThreshold,
            )}
            borderColor="border-l-slate-200 dark:border-l-slate-800"
          />
          <MetricCard
            title="Total Rend. Sangue"
            value={metrics.bloodYield.toFixed(2)}
            unit="%"
            icon={Droplet}
            iconColor="text-red-600"
            valueColor={
              metrics.bloodYield > 0
                ? 'text-foreground'
                : 'text-muted-foreground'
            }
            borderColor="border-l-red-600"
          />

          {/* General Yield Summary */}
          <MetricCard
            title="Rendimento Geral"
            value={metrics.generalYield.toFixed(2)}
            unit="%"
            icon={PieChart}
            iconColor="text-primary"
            borderColor="border-l-primary"
            subValue={
              <span className="text-xs text-muted-foreground">
                Média Global (Exceto Sangue)
              </span>
            }
          />
        </div>
      </section>
    </div>
  )
}
