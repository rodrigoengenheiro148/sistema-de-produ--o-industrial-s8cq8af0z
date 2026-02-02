import { useState } from 'react'
import { CookingTimeForm } from '@/components/process/CookingTimeForm'
import { DowntimeManager } from '@/components/process/DowntimeManager'
import { HourlyProductionEfficiencyChart } from '@/components/process/HourlyProductionEfficiencyChart'
import { ProcessMetricsCard } from '@/components/process/ProcessMetricsCard'
import { DatePicker } from '@/components/ui/date-picker'
import { ProcessExportMenu } from '@/components/process/ProcessExportMenu'

export default function ProcessManagement() {
  const [analysisDate, setAnalysisDate] = useState<Date>(new Date())

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Tempos de Processo
          </h2>
          <p className="text-muted-foreground">
            Gerencie os tempos de cozimento e paradas para cálculo de
            produtividade.
          </p>
        </div>
        <ProcessExportMenu />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CookingTimeForm />
        <DowntimeManager />
      </div>

      <div className="space-y-4 pt-6 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              Análise de Eficiência
            </h2>
            <p className="text-muted-foreground">
              Acompanhamento detalhado da vazão e produtividade.
            </p>
          </div>
          <DatePicker date={analysisDate} setDate={setAnalysisDate} />
        </div>

        <ProcessMetricsCard date={analysisDate} />

        <div className="md:col-span-2">
          <HourlyProductionEfficiencyChart date={analysisDate} />
        </div>
      </div>
    </div>
  )
}
