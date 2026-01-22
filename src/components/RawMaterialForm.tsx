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
  unit: z.string().min(1, 'Unidade é obrigatória'),
  notes: z.string().optional(),
})

interface RawMaterialFormProps {
  initialData?: RawMaterialEntry
  onSuccess: () => void
  onCancel: () => void
}

export function RawMaterialForm({
  initialData,
  onSuccess,
  onCancel,
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
      unit: initialData?.unit || 'kg',
      notes: initialData?.notes || '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        date: format(initialData.date, 'yyyy-MM-dd'),
        supplier: initialData.supplier,
        type: initialData.type,
        quantity: String(initialData.quantity),
        unit: initialData.unit || 'kg',
        notes: initialData.notes || '',
      })
    } else {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        supplier: '',
        type: '',
        quantity: '',
        unit: 'kg',
        notes: '',
      })
    }
  }, [initialData, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const quantityValue = Number(values.quantity)
    // Append T12:00:00 to force local noon interpretation and prevent timezone shifts
    const dateValue = new Date(`${values.date}T12:00:00`)

    const entryData = {
      date: dateValue,
      supplier: values.supplier,
      type: values.type,
      quantity: quantityValue,
      unit: values.unit,
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
              <FormLabel>Data de Entrada</FormLabel>
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
              <FormLabel>Nome da Matéria-Prima</FormLabel>
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
                  <SelectItem value="Despojo">Despojo</SelectItem>
                  <SelectItem value="Barrigada">Barrigada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Un." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="un">Unidades</SelectItem>
                    <SelectItem value="ton">Toneladas</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes adicionais..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Salvar Alterações' : 'Salvar Registro'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
