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
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { ShippingEntry } from '@/lib/types'
import { DialogFooter } from '@/components/ui/dialog'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  client: z.string().min(2, 'Cliente é obrigatório'),
  product: z.enum(['Sebo', 'FCO', 'Farinheta', 'Matéria-Prima']),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantidade inválida',
  }),
  unitPrice: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Preço unitário deve ser um número positivo',
    }),
  docRef: z.string().min(1, 'Documento é obrigatório'),
})

interface ShippingFormProps {
  initialData?: ShippingEntry
  onSuccess: () => void
}

export function ShippingForm({ initialData, onSuccess }: ShippingFormProps) {
  const { addShipping, updateShipping } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      client: initialData?.client || '',
      product: initialData?.product || 'Sebo',
      quantity: initialData ? String(initialData.quantity) : '',
      unitPrice: initialData ? String(initialData.unitPrice) : '',
      docRef: initialData?.docRef || '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const entryData = {
      // Append T12:00:00 to force local noon interpretation and prevent timezone shifts
      date: new Date(`${values.date}T12:00:00`),
      client: values.client,
      product: values.product,
      quantity: Number(values.quantity),
      unitPrice: Number(values.unitPrice),
      docRef: values.docRef,
    }

    if (initialData) {
      updateShipping({ ...entryData, id: initialData.id })
      toast({
        title: 'Expedição Atualizada',
        description: 'Dados de saída e faturamento atualizados.',
      })
    } else {
      addShipping(entryData)
      toast({
        title: 'Expedição Realizada',
        description: 'Saída de estoque e faturamento confirmados.',
      })
    }

    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            name="docRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <FormControl>
                  <Input placeholder="NF ou Pedido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente / Destino</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
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
                  <SelectItem value="Sebo">Sebo</SelectItem>
                  <SelectItem value="FCO">Farinha Carne/Osso</SelectItem>
                  <SelectItem value="Farinheta">Farinheta</SelectItem>
                  <SelectItem value="Matéria-Prima">
                    Matéria-Prima (Devolução)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Unit. (R$)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Confirmar Saída'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
