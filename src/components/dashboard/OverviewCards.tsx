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
  // We keep 'now' here only for other cards if needed,
  // though ProductivityCard now handles its own timer.
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // Update current time every minute to refresh calculations for open records
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const metrics = useMemo(() => {
    // 1. Entrada MP (Total Raw Material)
    const totalRawMaterial = rawMaterials.reduce(
      (acc, curr) => acc + curr.quantity,
      0,
    )

    // 2. Produção (Total Production)
    const totalProduction = production.reduce(
      (acc, curr) =>
        acc + (curr.seboProduced + curr.fcoProduced + curr.farinhetaProduced),
      0,
    )

    // 3. Rendimento Geral
    const mpUsedForYield = production.reduce(
      (acc, curr) => acc + curr.mpUsed,
      0,
    )
    const generalYield =
      mpUsedForYield > 0 ? (totalProduction / mpUsedForYield) * 100 : 0

    // 4. Faturamento
    const totalRevenue = shipping.reduce(
      (acc, curr) => acc + curr.quantity * curr.unitPrice,
      0,
    )

    // 5. Specific Yields
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

    const seboYield =
      mpUsedForYield > 0 ? (seboProduced / mpUsedForYield) * 100 : 0
    const fcoYield =
      mpUsedForYield > 0 ? (fcoProduced / mpUsedForYield) * 100 : 0
    const farinhetaYield =
      mpUsedForYield > 0 ? (farinhetaProduced / mpUsedForYield) * 100 : 0

    // 6. Blood Metrics
    const bloodEntry = rawMaterials
      .filter((r) => r.type?.toLowerCase() === 'sangue')
      .reduce((acc, curr) => {
        let qty = curr.quantity
        const unit = curr.unit?.toLowerCase() || ''
        if (unit.includes('bag')) {
          qty = qty * 1400
        } else if (unit.includes('ton')) {
          qty = qty * 1000
        }
        // If 'kg' or others, assume quantity is already correct or treat as 1 unit
        return acc + qty
      }, 0)

    const bloodProduced = production.reduce(
      (acc, curr) => acc + (curr.bloodMealProduced || 0),
      0,
    )

    const bloodYield = bloodEntry > 0 ? (bloodProduced / bloodEntry) * 100 : 0

    return {
      totalRawMaterial,
      totalProduction,
      generalYield,
      totalRevenue,
      seboYield,
      fcoYield,
      farinhetaYield,
      bloodEntry,
      bloodYield,
    }
  }, [rawMaterials, production, shipping, cookingTimeRecords, now])

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
    // Null Safety: If a threshold is not defined (null/undefined/0), default to standard text color
    if (threshold === null || threshold === undefined || threshold === 0) {
      return 'text-foreground'
    }

    // Green if equal to or greater than threshold
    if (yieldValue >= threshold) {
      return 'text-green-600'
    }

    // Red if below threshold
    return 'text-red-600'
  }

  // Resolve thresholds
  const seboThreshold = notificationSettings.seboThreshold
  // FCO falls back to farinhaThreshold if not set, consistent with DataContext logic
  const fcoThreshold =
    notificationSettings.fcoThreshold ||
    notificationSettings.farinhaThreshold ||
    0
  const farinhetaThreshold = notificationSettings.farinhetaThreshold

  return (
    <div className="space-y-4">
      {/* Top 5 Metric Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entrada MP
            </CardTitle>
            <Database className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {formatNumber(metrics.totalRawMaterial)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                kg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produção
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-700" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {formatNumber(metrics.totalProduction)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                kg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rendimento Geral
            </CardTitle>
            <PieChart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {metrics.generalYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Productivity Card */}
        <ProductivityCard className="border-l-4 border-l-blue-500 shadow-sm" />
      </div>

      {/* Yield Detail Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rendimento Sebo
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                'text-2xl font-bold',
                getYieldColor(metrics.seboYield, seboThreshold),
              )}
            >
              {metrics.seboYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rendimento FCO
            </CardTitle>
            <Bone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                'text-2xl font-bold',
                getYieldColor(metrics.fcoYield, fcoThreshold),
              )}
            >
              {metrics.fcoYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rendimento Farinheta
            </CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div
              className={cn(
                'text-2xl font-bold',
                getYieldColor(metrics.farinhetaYield, farinhetaThreshold),
              )}
            >
              {metrics.farinhetaYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blood Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-red-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entrada de Sangue
            </CardTitle>
            <Droplet className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {formatNumber(metrics.bloodEntry)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                kg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Rendimentos de Sangue
            </CardTitle>
            <Droplet className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {metrics.bloodYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
