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
import { Textarea } from '@/components/ui/textarea'
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
import { QualityEntry } from '@/lib/types'
import { DialogFooter } from '@/components/ui/dialog'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  product: z.enum(['Farinha', 'Farinheta']),
  acidity: z.coerce
    .number()
    .min(0, 'Valor deve ser positivo')
    .max(100, 'Percentual inválido'),
  protein: z.coerce
    .number()
    .min(0, 'Valor deve ser positivo')
    .max(100, 'Percentual inválido'),
  responsible: z
    .string()
    .min(2, 'Responsável deve ter pelo menos 2 caracteres'),
  notes: z.string().optional(),
})

interface QualityFormProps {
  initialData?: QualityEntry
  onSuccess: () => void
}

export function QualityForm({ initialData, onSuccess }: QualityFormProps) {
  const { addQualityRecord, updateQualityRecord } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      product: initialData?.product || 'Farinha',
      acidity: initialData?.acidity || 0,
      protein: initialData?.protein || 0,
      responsible: initialData?.responsible || '',
      notes: initialData?.notes || '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const entryData = {
      date: new Date(values.date),
      product: values.product,
      acidity: values.acidity,
      protein: values.protein,
      responsible: values.responsible,
      notes: values.notes,
    }

    if (initialData) {
      // We spread initialData first to preserve fields like createdAt and id
      updateQualityRecord({ ...initialData, ...entryData })
      toast({
        title: 'Registro Atualizado',
        description: 'Dados de qualidade atualizados com sucesso.',
      })
    } else {
      addQualityRecord(entryData)
      toast({
        title: 'Registro Salvo',
        description: 'Nova análise de qualidade registrada.',
      })
    }

    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data da Análise</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Farinha">Farinha</SelectItem>
                  <SelectItem value="Farinheta">Farinheta</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="acidity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acidez (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="protein"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proteína (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    {...field}
                  />
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
              <FormLabel>Responsável Técnico</FormLabel>
              <FormControl>
                <Input placeholder="Nome do responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes da amostra..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">
            {initialData ? 'Atualizar Dados' : 'Salvar Análise'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
