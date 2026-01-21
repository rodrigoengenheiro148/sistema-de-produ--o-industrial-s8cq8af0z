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
import { RawMaterialEntry } from '@/lib/types'
import { DialogFooter } from '@/components/ui/dialog'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  supplier: z.string().min(2, 'Fornecedor deve ter pelo menos 2 caracteres'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantidade deve ser um número positivo',
  }),
  notes: z.string().optional(),
})

interface RawMaterialFormProps {
  initialData?: RawMaterialEntry
  onSuccess: () => void
}

export function RawMaterialForm({
  initialData,
  onSuccess,
}: RawMaterialFormProps) {
  const { addRawMaterial, updateRawMaterial } = useData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData
        ? format(initialData.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      supplier: initialData?.supplier || '',
      type: initialData?.type || '',
      quantity: initialData ? String(initialData.quantity) : '',
      notes: initialData?.notes || '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Ensuring the exact value is used without any additions or offsets
    const quantityValue = Number(values.quantity)

    const entryData = {
      date: new Date(values.date),
      supplier: values.supplier,
      type: values.type,
      quantity: quantityValue,
      notes: values.notes,
    }

    if (initialData) {
      updateRawMaterial({ ...entryData, id: initialData.id })
      toast({
        title: 'Sucesso',
        description: 'Entrada atualizada com sucesso!',
      })
    } else {
      addRawMaterial(entryData)
      toast({
        title: 'Sucesso',
        description: 'Entrada registrada com sucesso!',
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
                <Input placeholder="Nome do fornecedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Matéria-Prima</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Ossos">Ossos</SelectItem>
                  <SelectItem value="Vísceras">Vísceras</SelectItem>
                  <SelectItem value="Sangue">Sangue</SelectItem>
                  <SelectItem value="Misto">Misto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes adicionais..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">
            {initialData ? 'Atualizar' : 'Salvar Registro'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
