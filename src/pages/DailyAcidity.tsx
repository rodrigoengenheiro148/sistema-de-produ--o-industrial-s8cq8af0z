import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Search, FlaskConical } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  responsible: z
    .string()
    .min(2, 'Responsável deve ter pelo menos 2 caracteres'),
  weight: z.coerce.number().min(0, 'Peso deve ser positivo'),
  volume: z.coerce.number().min(0, 'Volume deve ser positivo'),
  tank: z.string().min(1, 'Tanque é obrigatório'),
  performedTimes: z.string().min(1, 'Horários realizados são obrigatórios'),
  notes: z.string().optional(),
})

export default function DailyAcidity() {
  const { acidityRecords, addAcidityRecord, dateRange } = useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      responsible: '',
      weight: 0,
      volume: 0,
      tank: '',
      performedTimes: '',
      notes: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    addAcidityRecord({
      date: new Date(values.date),
      time: values.time,
      responsible: values.responsible,
      weight: values.weight,
      volume: values.volume,
      tank: values.tank,
      performedTimes: values.performedTimes,
      notes: values.notes,
    })
    toast({
      title: 'Sucesso',
      description: 'Registro de acidez salvo com sucesso!',
    })
    setIsOpen(false)
    form.reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      responsible: '',
      weight: 0,
      volume: 0,
      tank: '',
      performedTimes: '',
      notes: '',
    })
  }

  const filteredRecords = acidityRecords
    .filter((item) => {
      // Apply global date filter if exists, else show all
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return (
        item.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tank.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          Acidez Diária
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Medição de Acidez</DialogTitle>
              <DialogDescription>
                Preencha os dados da análise de acidez do tanque.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanque</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Identificação do tanque"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="performedTimes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horários Realizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 08:00, 10:30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume (L)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observação</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Salvar Registro</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Medições</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar responsável ou tanque..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Tanque</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right">Volume (L)</TableHead>
                <TableHead>Horários Real.</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium">
                      {format(entry.date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">
                        {entry.tank}
                      </span>
                    </TableCell>
                    <TableCell>{entry.responsible}</TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.weight.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.volume.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.performedTimes}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {entry.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
