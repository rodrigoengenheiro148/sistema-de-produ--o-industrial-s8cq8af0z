import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
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
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Trash2, Clock, PlayCircle, StopCircle, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CookingTimeRecord } from '@/lib/types'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  startTime: z.string().min(1, 'Hora Início é obrigatória'),
  endTime: z.string().optional().or(z.literal('')),
})

export function CookingTimeForm() {
  const {
    addCookingTimeRecord,
    cookingTimeRecords,
    deleteCookingTimeRecord,
    updateCookingTimeRecord,
  } = useData()
  const { toast } = useToast()
  const [finishingRecord, setFinishingRecord] =
    useState<CookingTimeRecord | null>(null)
  const [finishTime, setFinishTime] = useState('')
  const [openDialog, setOpenDialog] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Append T12:00:00 to prevent timezone issues with date
    const dateObj = new Date(`${values.date}T12:00:00`)

    addCookingTimeRecord({
      date: dateObj,
      startTime: values.startTime,
      endTime: values.endTime || null, // Convert empty string to null
      userId: '', // handled by context/auth
      factoryId: '', // handled by context
    })

    toast({
      title: 'Registro salvo',
      description: values.endTime
        ? 'Tempo de cozimento adicionado.'
        : 'Processo iniciado com sucesso.',
    })

    form.reset({
      date: values.date, // keep date
      startTime: '',
      endTime: '',
    })
  }

  const handleFinish = () => {
    if (finishingRecord && finishTime) {
      updateCookingTimeRecord({
        ...finishingRecord,
        endTime: finishTime,
      })
      setOpenDialog(false)
      setFinishingRecord(null)
      setFinishTime('')
      toast({
        title: 'Processo finalizado',
        description: 'Hora de término registrada com sucesso.',
      })
    }
  }

  const openFinishDialog = (record: CookingTimeRecord) => {
    setFinishingRecord(record)
    // Default to current time for convenience
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setFinishTime(timeStr)
    setOpenDialog(true)
  }

  // Filter recently added records for display (e.g. current day)
  const todayStr = form.watch('date')
  const displayedRecords = cookingTimeRecords.filter((r) => {
    try {
      return format(r.date, 'yyyy-MM-dd') === todayStr
    } catch {
      return false
    }
  })

  return (
    <Card className="shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Tempo de Cozimento
        </CardTitle>
        <CardDescription>
          Registre os tempos de processo do digestor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-4 items-end"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Dia</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Hora Início</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Hora Fim (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Adicionar</Button>
          </form>
        </Form>

        <div className="rounded-md border">
          <Table>
            <TableBody>
              {displayedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum registro para este dia.
                  </TableCell>
                </TableRow>
              ) : (
                displayedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {record.endTime ? (
                          <>
                            <StopCircle className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {record.startTime} - {record.endTime}
                            </span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 text-green-500 animate-pulse" />
                            <span className="font-medium text-green-600">
                              {record.startTime} - Em andamento
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      {!record.endTime && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => openFinishDialog(record)}
                        >
                          <Check className="h-3 w-3" />
                          Finalizar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCookingTimeRecord(record.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Finish Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Finalizar Processo</DialogTitle>
              <DialogDescription>
                Informe a hora de término para encerrar este ciclo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Hora Início: {finishingRecord?.startTime}</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="finish-time">Hora Fim</Label>
                <Input
                  id="finish-time"
                  type="time"
                  value={finishTime}
                  onChange={(e) => setFinishTime(e.target.value)}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleFinish}
                className="w-full"
                disabled={!finishTime}
              >
                Confirmar Término
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
