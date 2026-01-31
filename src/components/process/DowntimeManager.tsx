import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, differenceInSeconds } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Trash2,
  AlertCircle,
  Plus,
  StopCircle,
  PlayCircle,
  Timer,
  Lock,
} from 'lucide-react'
import { shouldRequireAuth } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'

const manualFormSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  durationHours: z.coerce.number().min(0.01, 'Duração deve ser maior que zero'),
  reason: z.string().min(3, 'Motivo é obrigatório'),
})

export function DowntimeManager() {
  const {
    addDowntimeRecord,
    updateDowntimeRecord,
    downtimeRecords,
    deleteDowntimeRecord,
  } = useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const [stopReason, setStopReason] = useState('')

  // Security Gate
  const [securityOpen, setSecurityOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const handleProtectedAction = (
    createdAt: Date | undefined,
    action: () => void,
  ) => {
    if (shouldRequireAuth(createdAt)) {
      setPendingAction(() => action)
      setSecurityOpen(true)
    } else {
      action()
    }
  }

  const handleSecuritySuccess = () => {
    setSecurityOpen(false)
    if (pendingAction) pendingAction()
    setPendingAction(null)
  }

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Find active downtime (has startTime but no endTime)
  const activeDowntime = downtimeRecords.find((r) => r.startTime && !r.endTime)

  // Initialize reason when active downtime is found
  useEffect(() => {
    if (activeDowntime?.reason) {
      setStopReason(activeDowntime.reason)
    } else {
      setStopReason('')
    }
  }, [activeDowntime?.id, activeDowntime?.reason])

  const manualForm = useForm<z.infer<typeof manualFormSchema>>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      durationHours: 0,
      reason: '',
    },
  })

  function onManualSubmit(values: z.infer<typeof manualFormSchema>) {
    const dateObj = new Date(`${values.date}T12:00:00`)

    addDowntimeRecord({
      date: dateObj,
      durationHours: values.durationHours,
      reason: values.reason,
      userId: '',
      factoryId: '',
    })

    toast({
      title: 'Parada registrada',
      description: 'Registro de parada adicionado com sucesso.',
    })

    manualForm.reset({
      date: values.date,
      durationHours: 0,
      reason: '',
    })
    setIsOpen(false)
  }

  const handleStartStop = () => {
    addDowntimeRecord({
      date: new Date(),
      startTime: new Date(),
      durationHours: 0,
      reason: 'Máquina Parada', // Default reason
      userId: '',
      factoryId: '',
    })
    toast({
      title: 'Parada Iniciada',
      description: 'A máquina está parada. O tempo começou a contar.',
    })
  }

  const handleFinishStop = () => {
    if (!activeDowntime) return

    const endTime = new Date()
    const startTime = new Date(activeDowntime.startTime!)
    const durationSeconds = differenceInSeconds(endTime, startTime)
    const durationHours = durationSeconds / 3600

    handleProtectedAction(activeDowntime.createdAt, () => {
      updateDowntimeRecord({
        ...activeDowntime,
        endTime,
        durationHours,
        reason: stopReason || activeDowntime.reason,
      })

      toast({
        title: 'Parada Finalizada',
        description: `Tempo total de parada: ${durationHours.toFixed(2)} horas.`,
      })
      setStopReason('')
    })
  }

  const handleUpdateReason = () => {
    if (!activeDowntime) return

    handleProtectedAction(activeDowntime.createdAt, () => {
      updateDowntimeRecord({
        ...activeDowntime,
        reason: stopReason,
      })
      toast({
        title: 'Motivo Atualizado',
        description: 'O motivo da parada foi salvo.',
      })
    })
  }

  // Display all records sorted by date desc
  const sortedRecords = [...downtimeRecords]
    .filter((r) => r.endTime || (!r.startTime && r.durationHours > 0)) // Only show finished or manual records in table
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  // Format timer
  const getElapsedString = () => {
    if (!activeDowntime?.startTime) return '00:00:00'
    const start = new Date(activeDowntime.startTime)
    const seconds = Math.max(0, differenceInSeconds(now, start))
    const hh = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    const mm = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (seconds % 60).toString().padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Horas de Parada
          </CardTitle>
          <CardDescription>
            Histórico de interrupções na produção.
          </CardDescription>
        </div>
        {!activeDowntime && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleStartStop}
            >
              <StopCircle className="h-4 w-4" /> Iniciar Parada
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Manual
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Parada Manualmente</DialogTitle>
                </DialogHeader>
                <Form {...manualForm}>
                  <form
                    onSubmit={manualForm.handleSubmit(onManualSubmit)}
                    className="space-y-4 py-4"
                  >
                    <FormField
                      control={manualForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="durationHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração (Horas)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 1.5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={manualForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Manutenção Mecânica"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Salvar
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Stop UI */}
        {activeDowntime && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-center justify-between animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                <Timer className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  Parada em andamento
                  {shouldRequireAuth(activeDowntime.createdAt) && (
                    <Lock className="h-3 w-3" />
                  )}
                </h4>
                <p className="text-2xl font-mono font-bold text-destructive">
                  {getElapsedString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-end">
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Motivo da parada..."
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  className="bg-background"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateReason}
                  title="Salvar Motivo"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleFinishStop}
                className="w-full sm:w-auto gap-2 bg-destructive hover:bg-destructive/90 text-white"
              >
                <PlayCircle className="h-4 w-4" /> Finalizar Parada
              </Button>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead>Duração (Horas)</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground h-24"
                  >
                    Nenhum registro de parada finalizado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRecords.map((record) => {
                  const isLocked = shouldRequireAuth(record.createdAt)
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {format(record.date, 'dd/MM/yyyy')}
                          {isLocked && (
                            <Lock className="h-3 w-3 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.durationHours.toFixed(2)} h</TableCell>
                      <TableCell>{record.reason}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleProtectedAction(record.createdAt, () =>
                              deleteDowntimeRecord(record.id),
                            )
                          }
                          className="h-8 w-8 text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <SecurityGate
          isOpen={securityOpen}
          onOpenChange={setSecurityOpen}
          onSuccess={handleSecuritySuccess}
        />
      </CardContent>
    </Card>
  )
}
