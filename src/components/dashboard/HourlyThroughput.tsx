import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Bone, Wheat, Clock, Timer } from 'lucide-react'

export function HourlyThroughput() {
  const items = [
    {
      title: 'Sebo',
      icon: Droplets,
      color: 'hsl(var(--chart-1))',
    },
    {
      title: 'Farinha',
      icon: Bone,
      color: 'hsl(var(--chart-2))',
    },
    {
      title: 'Farinheta',
      icon: Wheat,
      color: 'hsl(var(--chart-3))',
    },
  ]

  // Calculation constants: 1 bag every 15 minutes = 4 bags per hour
  const bagsPerHour = 4
  const bagSmall = 1.45 // 1450kg in tons
  const bagLarge = 1.5 // 1500kg in tons

  const throughputSmall = bagsPerHour * bagSmall // 5.8 t/h
  const throughputLarge = bagsPerHour * bagLarge // 6.0 t/h

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold tracking-tight">
          Capacidade Horária (Estimada)
        </h3>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.title}
            className="shadow-sm border-primary/10 bg-card/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className="h-4 w-4" style={{ color: item.color }} />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-background/50 rounded-md border border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Bag 1450kg
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" /> 1 a cada 15 min
                    </div>
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    {throughputSmall.toFixed(1)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      t/h
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background/50 rounded-md border border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Bag 1500kg
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" /> 1 a cada 15 min
                    </div>
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    {throughputLarge.toFixed(1)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      t/h
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
