import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Database,
  TrendingUp,
  PieChart,
  DollarSign,
  Activity,
  Droplets,
  Bone,
  Wheat,
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
    const totalRawMaterialTons = totalRawMaterial / 1000

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

    // 5. Produtividade (t/h)
    // Formula: (Sum of Raw Material Quantity) / (Total Cooking Hours)
    // Total Cooking Hours = Sum of duration of all records
    let totalCookingMinutes = 0
    cookingTimeRecords.forEach((record) => {
      const [startH, startM] = record.startTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM

      let endMinutes
      if (record.endTime) {
        const [endH, endM] = record.endTime.split(':').map(Number)
        endMinutes = endH * 60 + endM
      } else {
        // If no end time, use current time (now)
        endMinutes = now.getHours() * 60 + now.getMinutes()
      }

      let diff = endMinutes - startMinutes
      if (diff < 0) diff += 24 * 60 // Handle midnight crossing
      totalCookingMinutes += diff
    })

    const totalCookingHours = totalCookingMinutes / 60

    // Calculate productivity (tons/hour)
    const productivity =
      totalCookingHours > 0 ? totalRawMaterialTons / totalCookingHours : 0

    // 6. Specific Yields
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

    return {
      totalRawMaterial,
      totalProduction,
      generalYield,
      totalRevenue,
      productivity,
      totalRawMaterialTons,
      totalCookingHours,
      seboYield,
      fcoYield,
      farinhetaYield,
    }
  }, [
    rawMaterials,
    production,
    shipping,
    cookingTimeRecords,
    // downtimeRecords unused for this specific metric logic as per requirements
    now,
  ])

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

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtividade (t/h)
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              {metrics.productivity.toFixed(2)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                t/h
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <p className="text-xs text-muted-foreground">
                {metrics.totalRawMaterialTons.toFixed(1)}t em{' '}
                {metrics.totalCookingHours.toFixed(1)}h
              </p>
            </div>
          </CardContent>
        </Card>
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
                metrics.seboYield < notificationSettings.seboThreshold
                  ? 'text-red-500'
                  : 'text-foreground',
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
                metrics.fcoYield <
                  (notificationSettings.fcoThreshold ||
                    notificationSettings.farinhaThreshold ||
                    0)
                  ? 'text-red-500'
                  : 'text-foreground',
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
                metrics.farinhetaYield < notificationSettings.farinhetaThreshold
                  ? 'text-red-500'
                  : 'text-foreground',
              )}
            >
              {metrics.farinhetaYield.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
