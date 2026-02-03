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
import { useMemo } from 'react'
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
  notificationSettings,
}: OverviewCardsProps) {
  const metrics = useMemo(() => {
    // 1. Entrada MP (Total Raw Material)
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
    const bloodInputTotal = rawMaterials
      .filter((r) => r.type?.toLowerCase() === 'sangue')
      .reduce((acc, curr) => {
        let qty = curr.quantity
        const unit = curr.unit?.toLowerCase() || ''

        if (unit.includes('bag')) {
          qty = qty * 1400
        } else if (unit.includes('ton')) {
          qty = qty * 1000
        }

        return acc + qty
      }, 0)

    const bloodYield =
      bloodInputTotal > 0 ? (bloodMealProduced / bloodInputTotal) * 100 : 0

    return {
      totalMpProcessed,
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
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
      return 'text-emerald-600'
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

  // Reusable Standardized Metric Card
  const MetricCard = ({
    title,
    value,
    unit = '',
    icon: Icon,
    borderColor,
    iconColor,
    subValue,
    valueColor = 'text-foreground',
  }: {
    title: string
    value: string | number
    unit?: string
    icon: any
    borderColor: string
    iconColor: string
    subValue?: React.ReactNode
    valueColor?: string
  }) => (
    <Card className={cn('shadow-sm border-l-4', borderColor)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
            title="TOTAL MATÉRIA-PRIMA"
            value={formatNumber(metrics.totalMpProcessed)}
            unit="kg"
            icon={Database}
            borderColor="border-l-primary"
            iconColor="text-primary"
            subValue={
              <span className="text-xs text-muted-foreground">
                Baseado em MP Processada
              </span>
            }
          />
          <MetricCard
            title="TOTAL ENTRADA DE SANGUE"
            value={formatNumber(metrics.bloodInputTotal)}
            unit="kg"
            icon={Droplet}
            borderColor="border-l-red-500"
            iconColor="text-red-500"
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
            title="TOTAL SEBO"
            value={formatNumber(metrics.seboProduced)}
            unit="kg"
            icon={Droplets}
            borderColor="border-l-emerald-500"
            iconColor="text-emerald-500"
          />
          <MetricCard
            title="TOTAL FCO"
            value={formatNumber(metrics.fcoProduced)}
            unit="kg"
            icon={Bone}
            borderColor="border-l-orange-500"
            iconColor="text-orange-500"
          />
          <MetricCard
            title="TOTAL FARINHETA"
            value={formatNumber(metrics.farinhetaProduced)}
            unit="kg"
            icon={Wheat}
            borderColor="border-l-orange-500"
            iconColor="text-orange-500"
          />
          <MetricCard
            title="TOTAL FARINHA DE SANGUE"
            value={formatNumber(metrics.bloodMealProduced)}
            unit="kg"
            icon={Droplet}
            borderColor="border-l-red-500"
            iconColor="text-red-500"
          />

          {/* Performance Row within Production Section */}
          <MetricCard
            title="FATURAMENTO ESTIMADO"
            value={formatCurrency(metrics.totalRevenue)}
            icon={DollarSign}
            borderColor="border-l-emerald-500"
            iconColor="text-emerald-500"
          />

          <ProductivityCard />
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
            title="RENDIMENTO SEBO"
            value={metrics.seboYield.toFixed(2)}
            unit="%"
            icon={Droplets}
            borderColor="border-l-emerald-500"
            iconColor="text-emerald-500"
            valueColor={getYieldColor(metrics.seboYield, seboThreshold)}
          />
          <MetricCard
            title="RENDIMENTO FCO"
            value={metrics.fcoYield.toFixed(2)}
            unit="%"
            icon={Bone}
            borderColor="border-l-orange-500"
            iconColor="text-orange-500"
            valueColor={getYieldColor(metrics.fcoYield, fcoThreshold)}
          />
          <MetricCard
            title="RENDIMENTO FARINHETA"
            value={metrics.farinhetaYield.toFixed(2)}
            unit="%"
            icon={Wheat}
            borderColor="border-l-orange-500"
            iconColor="text-orange-500"
            valueColor={getYieldColor(
              metrics.farinhetaYield,
              farinhetaThreshold,
            )}
          />
          <MetricCard
            title="TOTAL REND. SANGUE"
            value={metrics.bloodYield.toFixed(2)}
            unit="%"
            icon={Droplet}
            borderColor="border-l-red-600"
            iconColor="text-red-600"
            valueColor={
              metrics.bloodYield > 0
                ? 'text-foreground'
                : 'text-muted-foreground'
            }
          />

          <MetricCard
            title="RENDIMENTO GERAL"
            value={metrics.generalYield.toFixed(2)}
            unit="%"
            icon={PieChart}
            borderColor="border-l-teal-600"
            iconColor="text-teal-600"
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
