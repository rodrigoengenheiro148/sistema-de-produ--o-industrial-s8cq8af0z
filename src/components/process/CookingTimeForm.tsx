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
    startTime: z.string().min(1, 'Início é obrigatório'),
    endTime: z.string().min(1, 'Fim é obrigatório'),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime).getTime()
        const end = new Date(data.endTime).getTime()
        return end > start
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
      startTime: '',
      endTime: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const start = new Date(values.startTime)
    const end = new Date(values.endTime)

    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    // Set the logical date for grouping based on start time (noon avoids timezone jumps)
    const dateObj = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      12,
      0,
      0,
    )

    addCookingTimeRecord({
      date: dateObj,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalHours: totalHours,
      userId: '', // handled by context/auth
      factoryId: '', // handled by context
    })

    toast({
      title: 'Registro salvo',
      description: 'Tempo de processo registrado com sucesso.',
    })

    form.reset({
      startTime: '',
      endTime: '',
    })
  }

  // Filter recently added records for display (e.g. records matching currently selected day)
  const selectedStartTime = form.watch('startTime')
  const referenceDateStr = selectedStartTime
    ? selectedStartTime.slice(0, 10)
    : format(new Date(), 'yyyy-MM-dd')

  const displayedRecords = cookingTimeRecords
    .filter((r) => {
      try {
        const rStart = r.startTime ? new Date(r.startTime) : null
        if (!rStart || isNaN(rStart.getTime())) return false
        return format(rStart, 'yyyy-MM-dd') === referenceDateStr
      } catch {
        return false
      }
    })
    .sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
      return timeB - timeA
    })

  const formatDurationStr = (hours: number | null | undefined) => {
    if (!hours && hours !== 0) return '-'
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const formatDateStr = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return '-'
    try {
      const d = new Date(dateValue)
      if (isNaN(d.getTime())) return String(dateValue)
      return format(d, 'dd/MM/yyyy HH:mm')
    } catch {
      return String(dateValue)
    }
  }

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
            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                      <Input type="datetime-local" {...field} />
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
                    className="text-center text-muted-foreground h-24"
                  >
                    Nenhum registro para a data selecionada.
                  </TableCell>
                </TableRow>
              ) : (
                displayedRecords.map((record) => {
                  const isLocked = shouldRequireAuth(record.createdAt)
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateStr(record.startTime)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateStr(record.endTime)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="font-medium whitespace-nowrap">
                            {formatDurationStr(record.totalHours)}
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
