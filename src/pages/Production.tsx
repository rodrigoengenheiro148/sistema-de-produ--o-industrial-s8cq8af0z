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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Plus } from 'lucide-react'
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
  shift: z.enum(['Manhã', 'Tarde', 'Noite']),
  mpUsed: z.coerce.number().min(0),
  sebo: z.coerce.number().min(0),
  fco: z.coerce.number().min(0),
  farinheta: z.coerce.number().min(0),
  losses: z.coerce.number().min(0), // Can be auto-calculated but user can override
})

export default function Production() {
  const { production, addProduction, dateRange } = useData()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      shift: 'Manhã',
      mpUsed: 0,
      sebo: 0,
      fco: 0,
      farinheta: 0,
      losses: 0,
    },
  })

  // Auto-calculate losses when other fields change
  const calculateLosses = () => {
    const values = form.getValues()
    const totalOutput =
      (values.sebo || 0) + (values.fco || 0) + (values.farinheta || 0)
    const losses = (values.mpUsed || 0) - totalOutput
    form.setValue('losses', losses > 0 ? losses : 0)
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    addProduction({
      date: new Date(values.date),
      shift: values.shift,
      mpUsed: values.mpUsed,
      seboProduced: values.sebo,
      fcoProduced: values.fco,
      farinhetaProduced: values.farinheta,
      losses: values.losses,
    })
    toast({
      title: 'Sucesso',
      description: 'Produção registrada com sucesso!',
    })
    setIsOpen(false)
    form.reset()
  }

  const filteredProduction = production
    .filter((item) => {
      // Apply global date filter if exists, else show all
      if (dateRange.from && dateRange.to) {
        if (item.date < dateRange.from || item.date > dateRange.to) return false
      }
      return true
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Produção Diária</h2>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Registro
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Registrar Produção</SheetTitle>
              <SheetDescription>
                Informe os dados de processamento do turno.
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 py-4"
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
                    name="shift"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
                  <h3 className="font-medium text-sm text-slate-500">
                    Entrada
                  </h3>
                  <FormField
                    control={form.control}
                    name="mpUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MP Processada (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              calculateLosses()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
                  <h3 className="font-medium text-sm text-slate-500">
                    Saídas (Produtos)
                  </h3>
                  <FormField
                    control={form.control}
                    name="sebo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sebo (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              calculateLosses()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farinha Carne/Osso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              calculateLosses()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="farinheta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farinheta (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              calculateLosses()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="losses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perdas (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="bg-red-50 border-red-200 text-red-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter>
                  <Button type="submit" className="w-full">
                    Salvar Produção
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diário de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="text-right">MP Proc. (kg)</TableHead>
                <TableHead className="text-right">Sebo (kg)</TableHead>
                <TableHead className="text-right">FCO (kg)</TableHead>
                <TableHead className="text-right">Farinheta (kg)</TableHead>
                <TableHead className="text-right text-red-500">
                  Perdas (kg)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProduction.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Nenhum registro encontrado no período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProduction.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <TableCell className="font-medium">
                      {format(entry.date, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{entry.shift}</TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.mpUsed.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {entry.seboProduced.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {entry.fcoProduced.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {entry.farinhetaProduced.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-500 font-medium">
                      {entry.losses.toLocaleString('pt-BR')}
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
