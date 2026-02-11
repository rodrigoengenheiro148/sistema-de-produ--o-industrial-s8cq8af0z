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
import { Trash2, Clock, Check, Lock, Edit2 } from 'lucide-react'
import { shouldRequireAuth } from '@/lib/security'
import { SecurityGate } from '@/components/SecurityGate'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  totalHours: z.coerce
    .number()
    .min(0.1, 'Horas devem ser maiores que 0')
    .max(24, 'Máximo 24 horas'),
})

export function CookingTimeForm() {
  const {
    addCookingTimeRecord,
    cookingTimeRecords,
    deleteCookingTimeRecord,
    updateCookingTimeRecord,
  } = useData()
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
      totalHours: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Append T12:00:00 to prevent timezone issues with date
    const dateObj = new Date(`${values.date}T12:00:00`)

    // Check if record exists for this date to avoid duplicates if preferred,
    // but schema allows multiple. For simplicity, we just add.
    addCookingTimeRecord({
      date: dateObj,
      totalHours: values.totalHours,
      userId: '', // handled by context/auth
      factoryId: '', // handled by context
    })

    toast({
      title: 'Registro salvo',
      description: 'Horas de produção registradas com sucesso.',
    })

    form.reset({
      date: values.date, // keep date
      totalHours: 0,
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
    <Card className="shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Tempo de Processo
        </CardTitle>
        <CardDescription>
          Registre as horas totais de produção diária.
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
              name="totalHours"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Horas de Produção</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 10.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Salvar</Button>
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
                displayedRecords.map((record) => {
                  const isLocked = shouldRequireAuth(record.createdAt)
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {record.totalHours ? (
                              <>{record.totalHours} horas</>
                            ) : (
                              // Fallback for legacy records
                              <>
                                {record.startTime} - {record.endTime || '...'}
                              </>
                            )}
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
