import { useState, useMemo } from 'react'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  startOfMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Droplets,
  Bone,
  Wheat,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function YieldsReport() {
  const { production } = useData()
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [date, setDate] = useState<Date>(new Date())

  // Logic to switch between views and maintain a valid date
  const handleViewChange = (val: string) => {
    setViewMode(val as 'daily' | 'monthly')
    // Reset date to today or start of month if needed, but current date is usually fine
  }

  const metrics = useMemo(() => {
    // Filter production data based on view mode and selected date
    const filtered = production.filter((item) => {
      if (viewMode === 'daily') {
        return isSameDay(item.date, date)
      } else {
        return isSameMonth(item.date, date) && isSameYear(item.date, date)
      }
    })

    // Calculate totals
    const totals = filtered.reduce(
      (acc, curr) => ({
        mpUsed: acc.mpUsed + curr.mpUsed,
        sebo: acc.sebo + curr.seboProduced,
        fco: acc.fco + curr.fcoProduced,
        farinheta: acc.farinheta + curr.farinhetaProduced,
      }),
      { mpUsed: 0, sebo: 0, fco: 0, farinheta: 0 },
    )

    // Calculate Yields
    const calculateYield = (val: number, mp: number) =>
      mp > 0 ? (val / mp) * 100 : 0

    return {
      hasData: filtered.length > 0,
      seboYield: calculateYield(totals.sebo, totals.mpUsed),
      fcoYield: calculateYield(totals.fco, totals.mpUsed),
      farinhetaYield: calculateYield(totals.farinheta, totals.mpUsed),
    }
  }, [production, viewMode, date])

  const MonthPicker = () => {
    const [year, setYear] = useState(date.getFullYear())
    const months = Array.from({ length: 12 }, (_, i) => i)

    return (
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear(year - 1)}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear(year + 1)}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((m) => (
            <Button
              key={m}
              variant={
                m === date.getMonth() && year === date.getFullYear()
                  ? 'default'
                  : 'outline'
              }
              className="h-8 text-xs"
              onClick={() => {
                const newDate = new Date(year, m, 1)
                setDate(newDate)
              }}
            >
              {format(new Date(year, m, 1), 'MMM', { locale: ptBR })}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const YieldCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    iconColorClass,
  }: {
    title: string
    value: number
    icon: any
    colorClass: string
    iconColorClass: string
  }) => (
    <Card className="shadow-sm border-t-4 border-t-transparent hover:border-t-primary/50 transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconColorClass)} />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className={cn('text-3xl font-bold', colorClass)}>
          {value.toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs
          value={viewMode}
          onValueChange={handleViewChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[240px] justify-start text-left font-normal border-primary/20',
                  !date && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {viewMode === 'daily'
                  ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : format(date, "MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              {viewMode === 'daily' ? (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="p-3"
                />
              ) : (
                <MonthPicker />
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Content */}
      {metrics.hasData ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <YieldCard
            title="Rendimento Sebo"
            value={metrics.seboYield}
            icon={Droplets}
            colorClass="text-green-600 dark:text-green-500"
            iconColorClass="text-green-600 dark:text-green-500"
          />
          <YieldCard
            title="Rendimento FCO"
            value={metrics.fcoYield}
            icon={Bone}
            colorClass="text-amber-600 dark:text-amber-500"
            iconColorClass="text-amber-600 dark:text-amber-500"
          />
          <YieldCard
            title="Rendimento Farinheta"
            value={metrics.farinhetaYield}
            icon={Wheat}
            colorClass="text-green-600 dark:text-green-500"
            iconColorClass="text-green-600 dark:text-green-500"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
          <Database className="h-10 w-10 mb-3 opacity-20" />
          <p>Nenhum dado de produção encontrado para este período.</p>
        </div>
      )}
    </div>
  )
}
