import { useState, useEffect, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Calendar,
  CalendarDays,
  Droplets,
  Bone,
  Wheat,
} from 'lucide-react'
import { isSameDay, isSameMonth, isSameYear } from 'date-fns'
import { cn } from '@/lib/utils'

export function LoadForecast() {
  const { rawMaterials, production } = useData()

  // State to track current time for midnight reset
  const [now, setNow] = useState(new Date())

  // Update 'now' every minute to ensure the day rolls over automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // 1. Calculate Average Yields from History
  const yields = useMemo(() => {
    // Default / Fallback values as per requirements
    const defaults = {
      sebo: 28.5,
      fco: 26.39,
      farinheta: 3.47,
    }

    if (!production || production.length === 0) return defaults

    const totals = production.reduce(
      (acc, curr) => ({
        mp: acc.mp + curr.mpUsed,
        sebo: acc.sebo + curr.seboProduced,
        fco: acc.fco + curr.fcoProduced,
        farinheta: acc.farinheta + curr.farinhetaProduced,
      }),
      { mp: 0, sebo: 0, fco: 0, farinheta: 0 },
    )

    if (totals.mp === 0) return defaults

    return {
      sebo: (totals.sebo / totals.mp) * 100,
      fco: (totals.fco / totals.mp) * 100,
      farinheta: (totals.farinheta / totals.mp) * 100,
    }
  }, [production])

  // 2. Calculate MP Inputs (Daily & Monthly)
  const { dailyMp, monthlyMp } = useMemo(() => {
    let daily = 0
    let monthly = 0

    rawMaterials.forEach((rm) => {
      const rmDate = rm.date // rm.date is a Date object from context mapData
      if (isSameYear(rmDate, now) && isSameMonth(rmDate, now)) {
        monthly += rm.quantity
        if (isSameDay(rmDate, now)) {
          daily += rm.quantity
        }
      }
    })

    return { dailyMp: daily, monthlyMp: monthly }
  }, [rawMaterials, now])

  // Helper to format numbers (Decimal for Kg)
  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })

  // Helper to format numbers (Integer for Bags)
  const fmtInt = (n: number) =>
    n.toLocaleString('pt-BR', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })

  // Render Card Component
  const ForecastCard = ({
    title,
    icon: Icon,
    yieldPct,
    colorStyle,
    className,
  }: {
    title: string
    icon: any
    yieldPct: number
    colorStyle: React.CSSProperties
    className?: string
  }) => {
    // Calculations
    const dailyProdKg = dailyMp * (yieldPct / 100)
    const dailyBags1450 = dailyProdKg / 1450
    const dailyBags1500 = dailyProdKg / 1500

    const monthlyProdKg = monthlyMp * (yieldPct / 100)
    const monthlyBags1450 = monthlyProdKg / 1450
    const monthlyBags1500 = monthlyProdKg / 1500

    return (
      <Card className={cn('shadow-sm border-primary/10 bg-card/50', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4" style={colorStyle} />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Daily Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Previsão Diária (Bags)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 p-2 rounded border text-center hover:bg-background/80 transition-colors">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Bag 1450kg
                </div>
                <div className="text-lg font-bold text-foreground">
                  {fmtInt(dailyBags1450)}
                </div>
              </div>
              <div className="bg-background/50 p-2 rounded border text-center hover:bg-background/80 transition-colors">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Bag 1500kg
                </div>
                <div className="text-lg font-bold text-foreground">
                  {fmtInt(dailyBags1500)}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-center mt-1 text-muted-foreground">
              Prod. Estimada:{' '}
              <span className="font-medium">{fmt(dailyProdKg)} kg</span>
              <span className="mx-1">•</span>
              Rendimento: {yieldPct.toFixed(2)}%
            </div>
          </div>

          <Separator className="my-2" />

          {/* Monthly Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Previsão Mensal (Cargas/Bags)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 p-2 rounded border text-center hover:bg-background/80 transition-colors">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Bag 1450kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {fmtInt(monthlyBags1450)}
                </div>
              </div>
              <div className="bg-background/50 p-2 rounded border text-center hover:bg-background/80 transition-colors">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Bag 1500kg
                </div>
                <div className="text-base font-bold text-foreground">
                  {fmtInt(monthlyBags1500)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold tracking-tight">
          Previsão de Cargas (Bags)
        </h3>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <ForecastCard
          title="Sebo"
          icon={Droplets}
          yieldPct={yields.sebo}
          colorStyle={{ color: 'hsl(var(--chart-1))' }}
        />
        <ForecastCard
          title="FCO / Farinha"
          icon={Bone}
          yieldPct={yields.fco}
          colorStyle={{ color: 'hsl(var(--chart-2))' }}
        />
        <ForecastCard
          title="Farinheta"
          icon={Wheat}
          yieldPct={yields.farinheta}
          colorStyle={{ color: 'hsl(var(--chart-3))' }}
        />
      </div>
    </div>
  )
}
