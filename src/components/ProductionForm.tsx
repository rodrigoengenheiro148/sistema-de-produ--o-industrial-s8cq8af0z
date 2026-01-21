import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SheetFooter } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  shift: z.enum(['Manhã', 'Tarde', 'Noite']),
  mpUsed: z.coerce.number().min(0, 'Valor deve ser positivo'),
  sebo: z.coerce.number().min(0, 'Valor deve ser positivo'),
  fco: z.coerce.number().min(0, 'Valor deve ser positivo'),
  farinheta: z.coerce.number().min(0, 'Valor deve ser positivo'),
  losses: z.coerce.number(),
})

interface ProductionFormProps {
  onSuccess: () => void
}

export function ProductionForm({ onSuccess }: ProductionFormProps) {
  const { addProduction } = useData()
  const { toast } = useToast()

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

  const mpUsed = form.watch('mpUsed')
  const sebo = form.watch('sebo')
  const fco = form.watch('fco')
  const farinheta = form.watch('farinheta')

  // Automatic calculation of losses based on inputs and outputs
  useEffect(() => {
    const input = Number(mpUsed) || 0
    const output =
      (Number(sebo) || 0) + (Number(fco) || 0) + (Number(farinheta) || 0)
    const calculatedLosses = input - output

    // Update losses field. Clamp to 0 if negative to avoid confusion, or display real diff.
    // Based on "Perdas" (Losses), usually >= 0.
    form.setValue('losses', Math.max(0, calculatedLosses), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }, [mpUsed, sebo, fco, farinheta, form])

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
    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
          <h3 className="font-medium text-sm text-slate-500">Entrada</h3>
          <FormField
            control={form.control}
            name="mpUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MP Processada (kg)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
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
                  readOnly
                  tabIndex={-1}
                  className="bg-red-50 border-red-200 text-red-700 cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0"
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
  )
}
