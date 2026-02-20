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
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from '@/components/ui/table'
import { Trash2, Clock, Check, Lock } from 'lucide-react'
import { shouldRequireAuth } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'

const formSchema = z
  .object({
    date: z.string().min(1, 'Data é obrigatória'),
    startTime: z.string().min(1, 'Hora de início é obrigatória'),
    endTime: z.string().min(1, 'Hora de fim é obrigatória'),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(':').map(Number)
        const [endH, endM] = data.endTime.split(':').map(Number)
        const startMins = startH * 60 + startM
        const endMins = endH * 60 + endM
        return endMins > startMins
      }
      return true
    },
    {
      message: 'Fim deve ser maior que Início',
      path: ['endTime'],
    },
  )

export function CookingTimeForm() {
  const { addCookingTimeRecord, cookingTimeRecords, deleteCookingTimeRecord } =
    useData()
  const { toast } = useToast()

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

    const [startH, startM] = values.startTime.split(':').map(Number)
    const [endH, endM] = values.endTime.split(':').map(Number)
    const startMins = startH * 60 + startM
    const endMins = endH * 60 + endM
    const totalHours = (endMins - startMins) / 60

    addCookingTimeRecord({
      date: dateObj,
      startTime: values.startTime,
      endTime: values.endTime,
      totalHours: totalHours,
      userId: '', // handled by context/auth
      factoryId: '', // handled by context
    })

    toast({
      title: 'Registro salvo',
      description: 'Tempo de processo registrado com sucesso.',
    })

    form.reset({
      date: values.date, // keep date
      startTime: '',
      endTime: '',
    })
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
    <Card className="shadow-sm border h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Tempo de Processo
        </CardTitle>
        <CardDescription>
          Registre os horários de início e fim da produção.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
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
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Início</FormLabel>
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
                    <FormLabel>Fim</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              Registrar Tempo
            </Button>
          </form>
        </Form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum registro para este dia.
                  </TableCell>
                </TableRow>
              ) : (
                displayedRecords.map((record) => {
                  const isLocked = shouldRequireAuth(record.createdAt)
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{record.startTime || '-'}</TableCell>
                      <TableCell>{record.endTime || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {record.totalHours
                              ? `${record.totalHours.toFixed(2)}h`
                              : '-'}
                          </span>
                          {isLocked && (
                            <Lock className="h-3 w-3 text-muted-foreground/50 ml-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleProtectedAction(record.createdAt, () =>
                              deleteCookingTimeRecord(record.id),
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
