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
import { Trash2, Clock } from 'lucide-react'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  startTime: z.string().min(1, 'Hora Início é obrigatória'),
  endTime: z.string().min(1, 'Hora Fim é obrigatória'),
})

export function CookingTimeForm() {
  const { addCookingTimeRecord, cookingTimeRecords, deleteCookingTimeRecord } =
    useData()
  const { toast } = useToast()

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
      endTime: values.endTime,
      userId: '', // handled by context/auth
      factoryId: '', // handled by context
    })

    toast({
      title: 'Registro salvo',
      description: 'Tempo de cozimento adicionado com sucesso.',
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
                  <FormLabel>Hora Fim</FormLabel>
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
                      {record.startTime} - {record.endTime}
                    </TableCell>
                    <TableCell className="text-right">
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
      </CardContent>
    </Card>
  )
}
