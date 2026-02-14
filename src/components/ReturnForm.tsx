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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useData } from '@/context/DataContext'
import { ReturnEntry } from '@/lib/types'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  supplier: z.string().min(1, 'Fornecedor é obrigatório'),
  quantity: z.coerce.number().min(0.01, 'Quantidade deve ser maior que 0'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  value: z.coerce.number().min(0, 'Valor deve ser positivo'),
})

interface ReturnFormProps {
  initialData?: ReturnEntry
  onSuccess: () => void
  onCancel: () => void
}

export function ReturnForm({
  initialData,
  onSuccess,
  onCancel,
}: ReturnFormProps) {
  const { addReturn, updateReturn } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      supplier: initialData?.supplier || '',
      quantity: initialData?.quantity || 0,
      description: initialData?.description || '',
      value: initialData?.value || 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const entryData = {
      date: new Date(`${values.date}T12:00:00`),
      supplier: values.supplier,
      quantity: values.quantity,
      description: values.description,
      value: values.value,
    }

    if (initialData) {
      updateReturn({
        ...entryData,
        id: initialData.id,
        factoryId: initialData.factoryId,
        userId: initialData.userId,
      })
      toast({
        title: 'Sucesso',
        description: 'Devolução atualizada com sucesso!',
      })
    } else {
      addReturn(entryData)
      toast({
        title: 'Sucesso',
        description: 'Devolução registrada com sucesso!',
      })
    }

    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Fornecedor" {...field} />
              </FormControl>
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
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Motivo da devolução..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Registrar Devolução'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
