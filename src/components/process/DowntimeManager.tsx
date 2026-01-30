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
import { Trash2, AlertCircle, Plus } from 'lucide-react'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  durationHours: z.coerce.number().min(0.01, 'Duração deve ser maior que zero'),
  reason: z.string().min(3, 'Motivo é obrigatório'),
})

export function DowntimeManager() {
  const { addDowntimeRecord, downtimeRecords, deleteDowntimeRecord } = useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      durationHours: 0,
      reason: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
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

    form.reset({
      date: values.date,
      durationHours: 0,
      reason: '',
    })
    setIsOpen(false)
  }

  // Display all records sorted by date desc
  const sortedRecords = [...downtimeRecords].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )

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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Parada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Parada</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 py-4"
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
                <FormField
                  control={form.control}
                  name="durationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (Horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 1.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
      </CardHeader>
      <CardContent>
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
                    Nenhum registro de parada.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(record.date, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{record.durationHours} h</TableCell>
                    <TableCell>{record.reason}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDowntimeRecord(record.id)}
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
      </CardContent>
    </Card>
  )
}
