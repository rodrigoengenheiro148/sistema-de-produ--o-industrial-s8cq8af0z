import { CookingTimeForm } from '@/components/process/CookingTimeForm'
import { DowntimeManager } from '@/components/process/DowntimeManager'

export default function ProcessManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Tempos de Processo
        </h2>
        <p className="text-muted-foreground">
          Gerencie os tempos de cozimento e paradas para cálculo de
          produtividade.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CookingTimeForm />
        <DowntimeManager />
      </div>
    </div>
  )
}
