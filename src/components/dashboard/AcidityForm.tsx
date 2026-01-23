import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { AcidityEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  acidity: z.coerce.number().min(0, 'Acidez deve ser positiva'),
  tank: z.string().min(1, 'Tanque é obrigatório'),
  performedTimes: z.string().min(1, 'Horários realizados são obrigatórios'),
  notes: z.string().optional(),
})

interface AcidityFormProps {
  initialData?: AcidityEntry
  onSubmit: (data: Omit<AcidityEntry, 'id'>) => void
  onCancel?: () => void
}

export function AcidityForm({
  initialData,
  onSubmit,
  onCancel,
}: AcidityFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      time: initialData?.time || format(new Date(), 'HH:mm'),
      responsible: initialData?.responsible || '',
      weight: initialData?.weight || 0,
      volume: initialData?.volume || 0,
      acidity: initialData?.acidity || 0,
      tank: initialData?.tank || '',
      performedTimes: initialData?.performedTimes || '',
      notes: initialData?.notes || '',
    },
  })

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit({
      // Append T12:00:00 to force local noon interpretation and prevent timezone shifts
      date: new Date(`${values.date}T12:00:00`),
      time: values.time,
      responsible: values.responsible,
      weight: values.weight,
      volume: values.volume,
      acidity: values.acidity,
      tank: values.tank,
      performedTimes: values.performedTimes,
      notes: values.notes,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  <Input placeholder="Identificação do tanque" {...field} />
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          <FormField
            control={form.control}
            name="acidity"
            render={({ field }) => (
              <FormItem className="col-span-2 sm:col-span-1">
                <FormLabel>Acidez</FormLabel>
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
                <Textarea placeholder="Observações adicionais..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Salvar Registro'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
